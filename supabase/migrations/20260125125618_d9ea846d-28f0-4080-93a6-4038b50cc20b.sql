-- Create user_study_templates table to store user's template selections
CREATE TABLE IF NOT EXISTS public.user_study_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_category TEXT NOT NULL,
  template_subcategory TEXT,
  template_level TEXT DEFAULT 'full-prep',
  template_year INTEGER,
  template_icon TEXT DEFAULT '📚',
  total_subjects INTEGER DEFAULT 0,
  total_topics INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, template_id)
);

-- Enable RLS
ALTER TABLE public.user_study_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own templates"
  ON public.user_study_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.user_study_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.user_study_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.user_study_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create study_certificates table for completion certificates
CREATE TABLE IF NOT EXISTS public.study_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.user_study_templates(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  issuer_name TEXT DEFAULT 'Abhishek Panda',
  issuer_title TEXT DEFAULT 'CEO, OriginX Labs Pvt Ltd',
  certificate_url TEXT,
  is_verified BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for certificates
CREATE POLICY "Users can view their own certificates"
  ON public.study_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
  ON public.study_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public verification policy (anyone can verify a certificate by number)
CREATE POLICY "Anyone can verify certificates"
  ON public.study_certificates FOR SELECT
  USING (true);

-- Function to generate unique certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cert_year TEXT;
  cert_seq INT;
  cert_num TEXT;
BEGIN
  cert_year := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO cert_seq
  FROM public.study_certificates
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  cert_num := 'OXLC-' || cert_year || '-' || LPAD(cert_seq::TEXT, 6, '0');
  RETURN cert_num;
END;
$$;