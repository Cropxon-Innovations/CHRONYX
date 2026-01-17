-- Add policy_type_categories mapping table for filtering providers
CREATE TABLE IF NOT EXISTS public.insurance_provider_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.insurance_providers(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insurance_provider_categories ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for default categories
CREATE POLICY "Anyone can view provider categories"
ON public.insurance_provider_categories
FOR SELECT
USING (true);

-- Insert category mappings for providers (Health providers)
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Health' FROM public.insurance_providers 
WHERE name IN ('Star Health Insurance', 'Care Health Insurance', 'Niva Bupa Health', 'ManipalCigna Health', 'Aditya Birla Health', 'HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz Life', 'New India Assurance', 'Oriental Insurance', 'United India Insurance', 'National Insurance', 'Reliance General');

-- Life insurance providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Life' FROM public.insurance_providers 
WHERE name IN ('Life Insurance Corporation', 'HDFC Life', 'ICICI Prudential', 'SBI Life Insurance', 'Max Life Insurance', 'Kotak Life Insurance', 'Tata AIA Life', 'Bajaj Allianz Life');

-- Term Life providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Term Life' FROM public.insurance_providers 
WHERE name IN ('Life Insurance Corporation', 'HDFC Life', 'ICICI Prudential', 'SBI Life Insurance', 'Max Life Insurance', 'Kotak Life Insurance', 'Tata AIA Life', 'Bajaj Allianz Life');

-- Car/Bike insurance providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Car' FROM public.insurance_providers 
WHERE name IN ('HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz Life', 'New India Assurance', 'Oriental Insurance', 'United India Insurance', 'National Insurance', 'Reliance General', 'Acko General Insurance', 'Digit Insurance', 'Bharti AXA General', 'Future Generali', 'Edelweiss General');

INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Bike' FROM public.insurance_providers 
WHERE name IN ('HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz Life', 'New India Assurance', 'Oriental Insurance', 'United India Insurance', 'National Insurance', 'Reliance General', 'Acko General Insurance', 'Digit Insurance', 'Bharti AXA General', 'Future Generali', 'Edelweiss General');

-- Home/Property insurance providers  
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Home' FROM public.insurance_providers 
WHERE name IN ('HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz Life', 'New India Assurance', 'Oriental Insurance', 'United India Insurance', 'National Insurance', 'Reliance General', 'Bharti AXA General');

INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Property' FROM public.insurance_providers 
WHERE name IN ('HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz Life', 'New India Assurance', 'Oriental Insurance', 'United India Insurance', 'National Insurance', 'Reliance General');

-- Travel insurance providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Travel' FROM public.insurance_providers 
WHERE name IN ('HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz Life', 'New India Assurance', 'Reliance General', 'Digit Insurance', 'Care Health Insurance', 'Star Health Insurance');

-- Critical Illness providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Critical Illness' FROM public.insurance_providers 
WHERE name IN ('Star Health Insurance', 'Care Health Insurance', 'HDFC Life', 'ICICI Prudential', 'Max Life Insurance', 'Tata AIA Life');

-- Child Plan providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Child Plan' FROM public.insurance_providers 
WHERE name IN ('Life Insurance Corporation', 'HDFC Life', 'ICICI Prudential', 'SBI Life Insurance', 'Max Life Insurance', 'Tata AIA Life');

-- Personal Accident providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Personal Accident' FROM public.insurance_providers 
WHERE name IN ('HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz Life', 'New India Assurance', 'Oriental Insurance', 'United India Insurance', 'National Insurance', 'Reliance General', 'Digit Insurance');

-- Other - all providers
INSERT INTO public.insurance_provider_categories (provider_id, policy_type)
SELECT id, 'Other' FROM public.insurance_providers;

-- Add document_url column to insurances table for storing uploaded policy documents
ALTER TABLE public.insurances ADD COLUMN IF NOT EXISTS document_url TEXT;