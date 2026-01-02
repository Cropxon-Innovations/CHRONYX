-- Documents & Career Vault tables
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.education_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  course TEXT,
  start_year INTEGER,
  end_year INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.work_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.salary_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_history_id UUID NOT NULL REFERENCES public.work_history(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  salary_type TEXT NOT NULL DEFAULT 'monthly',
  monthly_amount NUMERIC,
  annual_amount NUMERIC,
  bonus NUMERIC DEFAULT 0,
  variable_pay NUMERIC DEFAULT 0,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.work_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_history_id UUID NOT NULL REFERENCES public.work_history(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.education_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  education_id UUID NOT NULL REFERENCES public.education_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social Life module tables
CREATE TABLE public.social_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  custom_name TEXT,
  username TEXT,
  profile_url TEXT,
  logo_url TEXT,
  connection_type TEXT NOT NULL DEFAULT 'manual',
  last_post_date DATE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  notes_encrypted TEXT,
  status TEXT DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for education_records
CREATE POLICY "Users can view their own education records" ON public.education_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own education records" ON public.education_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own education records" ON public.education_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own education records" ON public.education_records FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for work_history
CREATE POLICY "Users can view their own work history" ON public.work_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own work history" ON public.work_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own work history" ON public.work_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own work history" ON public.work_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for salary_records
CREATE POLICY "Users can view their own salary records" ON public.salary_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own salary records" ON public.salary_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own salary records" ON public.salary_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own salary records" ON public.salary_records FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for work_documents
CREATE POLICY "Users can view their own work documents" ON public.work_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own work documents" ON public.work_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own work documents" ON public.work_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for education_documents
CREATE POLICY "Users can view their own education documents" ON public.education_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own education documents" ON public.education_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own education documents" ON public.education_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_profiles
CREATE POLICY "Users can view their own social profiles" ON public.social_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own social profiles" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social profiles" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social profiles" ON public.social_profiles FOR DELETE USING (auth.uid() = user_id);

-- Add sort_order to syllabus_documents for drag-and-drop
ALTER TABLE public.syllabus_documents ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add sort_order to memory_folders for drag-and-drop
ALTER TABLE public.memory_folders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);