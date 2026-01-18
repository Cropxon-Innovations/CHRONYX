-- Create custom document categories table for user-defined categories
CREATE TABLE public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'FileText',
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own categories" 
ON public.document_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.document_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.document_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.document_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate category names per user
CREATE UNIQUE INDEX idx_unique_category_per_user ON public.document_categories (user_id, LOWER(name));

-- Create document sharing table
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID,
  access_type TEXT DEFAULT 'view',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- Policies for document shares
CREATE POLICY "Users can view shares they created" 
ON public.document_shares 
FOR SELECT 
USING (auth.uid() = shared_by OR auth.uid() = shared_with_user_id);

CREATE POLICY "Users can create shares for their documents" 
ON public.document_shares 
FOR INSERT 
WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares they created" 
ON public.document_shares 
FOR DELETE 
USING (auth.uid() = shared_by);

-- Add file_size and file_type columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Insert default document categories (these are just templates, no user_id means they're not inserted)
-- Each user will have their own categories created on first use