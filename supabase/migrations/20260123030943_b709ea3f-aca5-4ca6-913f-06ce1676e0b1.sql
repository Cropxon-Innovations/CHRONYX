-- Add missing columns to family_members
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS place_of_birth TEXT;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS date_of_death DATE;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS place_of_death TEXT;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS spouse_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS is_root BOOLEAN DEFAULT false;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS generation_level INTEGER DEFAULT 0;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS position_x DECIMAL;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS position_y DECIMAL;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Rename relation to relationship for consistency
ALTER TABLE public.family_members RENAME COLUMN relation TO relationship;

-- Create family_documents table for identity documents
CREATE TABLE public.family_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhaar', 'pan', 'passport', 'voter_id', 'birth_certificate', 'other')),
  document_number TEXT,
  file_url TEXT,
  file_name TEXT,
  verification_status TEXT NOT NULL DEFAULT 'not_added' CHECK (verification_status IN ('not_added', 'added', 'verified')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_audit_log table
CREATE TABLE public.family_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.family_documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_tree_exports table
CREATE TABLE public.family_tree_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL UNIQUE,
  export_format TEXT NOT NULL DEFAULT 'pdf',
  file_url TEXT,
  member_count INTEGER,
  generation_count INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_tree_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_documents
CREATE POLICY "Users can view their own family documents"
ON public.family_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own family documents"
ON public.family_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family documents"
ON public.family_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family documents"
ON public.family_documents FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for family_audit_log
CREATE POLICY "Users can view their own audit logs"
ON public.family_audit_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audit logs"
ON public.family_audit_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for family_tree_exports
CREATE POLICY "Users can view their own exports"
ON public.family_tree_exports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports"
ON public.family_tree_exports FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for family documents
INSERT INTO storage.buckets (id, name, public) VALUES ('family-documents', 'family-documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for family-documents bucket
CREATE POLICY "Users can upload family documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'family-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their family documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'family-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their family documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'family-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_parent_id ON public.family_members(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_documents_member_id ON public.family_documents(member_id);
CREATE INDEX IF NOT EXISTS idx_family_audit_log_user_id ON public.family_audit_log(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_family_documents_updated_at
BEFORE UPDATE ON public.family_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();