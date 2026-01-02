-- Create custom_banks table for user-added banks
CREATE TABLE public.custom_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  logo_url TEXT,
  country TEXT NOT NULL DEFAULT 'Other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.custom_banks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own custom banks"
ON public.custom_banks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom banks"
ON public.custom_banks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom banks"
ON public.custom_banks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom banks"
ON public.custom_banks FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for loan-documents bucket (logos folder)
CREATE POLICY "Users can upload logos to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'loan-documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can view their own logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'loan-documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'loan-documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public access to view logos (so they display properly)
CREATE POLICY "Anyone can view logos publicly"
ON storage.objects FOR SELECT
USING (bucket_id = 'loan-documents' AND (storage.foldername(name))[1] = 'logos');