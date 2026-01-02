-- Create syllabus_documents table for simple document uploads
CREATE TABLE IF NOT EXISTS public.syllabus_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own syllabus documents"
  ON public.syllabus_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus documents"
  ON public.syllabus_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus documents"
  ON public.syllabus_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus documents"
  ON public.syllabus_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_syllabus_documents_user_id ON public.syllabus_documents(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_syllabus_documents_updated_at
  BEFORE UPDATE ON public.syllabus_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();