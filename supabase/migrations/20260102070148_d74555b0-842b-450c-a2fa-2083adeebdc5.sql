-- Create family_members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create insurances table
CREATE TABLE public.insurances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  policy_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  premium_amount NUMERIC NOT NULL,
  sum_assured NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  insured_type TEXT NOT NULL DEFAULT 'self',
  insured_member_id UUID REFERENCES public.family_members(id),
  vehicle_registration TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create insurance_claims table
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  insured_member_id UUID REFERENCES public.family_members(id),
  claim_reference_no TEXT,
  claim_type TEXT NOT NULL,
  claim_date DATE NOT NULL,
  claimed_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  settled_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'Filed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create insurance_claim_documents table
CREATE TABLE public.insurance_claim_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create insurance_documents table
CREATE TABLE public.insurance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'policy',
  year INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for insurance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('insurance-documents', 'insurance-documents', false);

-- Enable RLS on all tables
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_members
CREATE POLICY "Users can view their own family members" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own family members" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own family members" ON public.family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own family members" ON public.family_members FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for insurances
CREATE POLICY "Users can view their own insurances" ON public.insurances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insurances" ON public.insurances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insurances" ON public.insurances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insurances" ON public.insurances FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for insurance_claims (via insurances)
CREATE POLICY "Users can view their own claims" ON public.insurance_claims FOR SELECT USING (EXISTS (SELECT 1 FROM public.insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can create their own claims" ON public.insurance_claims FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can update their own claims" ON public.insurance_claims FOR UPDATE USING (EXISTS (SELECT 1 FROM public.insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can delete their own claims" ON public.insurance_claims FOR DELETE USING (EXISTS (SELECT 1 FROM public.insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));

-- RLS policies for insurance_claim_documents (via claims -> insurances)
CREATE POLICY "Users can view their own claim documents" ON public.insurance_claim_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.insurance_claims c JOIN public.insurances i ON c.insurance_id = i.id WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can create their own claim documents" ON public.insurance_claim_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.insurance_claims c JOIN public.insurances i ON c.insurance_id = i.id WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can delete their own claim documents" ON public.insurance_claim_documents FOR DELETE USING (EXISTS (SELECT 1 FROM public.insurance_claims c JOIN public.insurances i ON c.insurance_id = i.id WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()));

-- RLS policies for insurance_documents (via insurances)
CREATE POLICY "Users can view their own insurance documents" ON public.insurance_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can create their own insurance documents" ON public.insurance_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can delete their own insurance documents" ON public.insurance_documents FOR DELETE USING (EXISTS (SELECT 1 FROM public.insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()));

-- Storage policies for insurance-documents bucket
CREATE POLICY "Users can upload insurance documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own insurance documents" ON storage.objects FOR SELECT USING (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own insurance documents" ON storage.objects FOR DELETE USING (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create updated_at triggers
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurances_updated_at BEFORE UPDATE ON public.insurances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();