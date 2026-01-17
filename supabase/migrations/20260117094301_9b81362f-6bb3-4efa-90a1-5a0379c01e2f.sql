-- Create insurance_providers table for storing provider details with logos
CREATE TABLE public.insurance_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  website TEXT,
  is_default BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

-- Create policies - users can view all default providers and their own custom ones
CREATE POLICY "Users can view default and own providers" 
ON public.insurance_providers 
FOR SELECT 
USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own providers" 
ON public.insurance_providers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own providers" 
ON public.insurance_providers 
FOR UPDATE 
USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own providers" 
ON public.insurance_providers 
FOR DELETE 
USING (auth.uid() = user_id AND is_default = false);

-- Insert default insurance providers with logo URLs
INSERT INTO public.insurance_providers (name, short_name, logo_url, website, is_default) VALUES
('Life Insurance Corporation', 'LIC', 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/LIC_logo.svg/120px-LIC_logo.svg.png', 'https://licindia.in', true),
('HDFC Life', 'HDFC Life', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/HDFC_Bank_Logo.svg/120px-HDFC_Bank_Logo.svg.png', 'https://www.hdfclife.com', true),
('ICICI Prudential', 'ICICI Pru', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/ICICI_Bank_Logo.svg/120px-ICICI_Bank_Logo.svg.png', 'https://www.iciciprulife.com', true),
('SBI Life Insurance', 'SBI Life', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI-logo.svg/120px-SBI-logo.svg.png', 'https://www.sbilife.co.in', true),
('Max Life Insurance', 'Max Life', 'https://www.maxlifeinsurance.com/content/dam/website/common/logo.png', 'https://www.maxlifeinsurance.com', true),
('Bajaj Allianz Life', 'Bajaj Allianz', 'https://www.bajajallianz.com/content/dam/bajaj-allianz/logos/bajajallianz-logo.png', 'https://www.bajajallianzlife.com', true),
('Tata AIA Life', 'Tata AIA', 'https://www.tataaia.com/content/dam/tataaia/logo/tata-aia-logo.png', 'https://www.tataaia.com', true),
('Kotak Life Insurance', 'Kotak Life', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Kotak_Mahindra_Bank_logo.svg/120px-Kotak_Mahindra_Bank_logo.svg.png', 'https://www.kotaklife.com', true),
('Star Health Insurance', 'Star Health', 'https://www.starhealth.in/sites/default/files/star-health-logo.png', 'https://www.starhealth.in', true),
('Care Health Insurance', 'Care Health', 'https://www.careinsurance.com/images/care-health-logo.svg', 'https://www.careinsurance.com', true),
('HDFC Ergo', 'HDFC Ergo', 'https://www.hdfcergo.com/images/hdfc-ergo-logo.png', 'https://www.hdfcergo.com', true),
('ICICI Lombard', 'ICICI Lombard', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/ICICI_Bank_Logo.svg/120px-ICICI_Bank_Logo.svg.png', 'https://www.icicilombard.com', true),
('New India Assurance', 'New India', 'https://www.newindia.co.in/portals/0/images/NIC-logo.png', 'https://www.newindia.co.in', true),
('United India Insurance', 'United India', 'https://uiic.co.in/sites/default/files/uiic_logo.png', 'https://uiic.co.in', true),
('National Insurance', 'National', 'https://nationalinsurance.nic.co.in/sites/default/files/inline-images/national-insurance-logo.png', 'https://nationalinsurance.nic.co.in', true),
('Oriental Insurance', 'Oriental', 'https://orientalinsurance.org.in/documents/10156/0/Oriental-Logo.png', 'https://orientalinsurance.org.in', true),
('Acko General Insurance', 'Acko', 'https://www.acko.com/images/acko-logo.svg', 'https://www.acko.com', true),
('Digit Insurance', 'Go Digit', 'https://www.godigit.com/images/logo.png', 'https://www.godigit.com', true),
('Niva Bupa Health', 'Niva Bupa', 'https://www.nivabupa.com/assets/images/logo.svg', 'https://www.nivabupa.com', true),
('Aditya Birla Health', 'AB Health', 'https://www.adityabirlacapital.com/healthinsurance/images/abhicl-logo.png', 'https://www.adityabirlahealthinsurance.com', true),
('Reliance General', 'Reliance', 'https://www.reliancegeneral.co.in/SiteAssets/Images/reliance-general-insurance-logo.png', 'https://www.reliancegeneral.co.in', true),
('Bharti AXA General', 'Bharti AXA', 'https://www.bharti-axagi.co.in/images/bharti-axa-logo.png', 'https://www.bharti-axagi.co.in', true),
('Future Generali', 'Future Generali', 'https://general.futuregenerali.in/images/fg-logo.png', 'https://general.futuregenerali.in', true),
('Edelweiss General', 'Edelweiss', 'https://edelweissinsurance.com/images/logo.svg', 'https://edelweissinsurance.com', true),
('ManipalCigna Health', 'ManipalCigna', 'https://www.manipalcigna.com/images/logo.png', 'https://www.manipalcigna.com', true);

-- Create index for faster queries
CREATE INDEX idx_insurance_providers_default ON public.insurance_providers(is_default);
CREATE INDEX idx_insurance_providers_user ON public.insurance_providers(user_id);