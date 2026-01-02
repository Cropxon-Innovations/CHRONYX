-- Add spaced repetition fields to syllabus_topics
ALTER TABLE public.syllabus_topics
ADD COLUMN IF NOT EXISTS next_review_date date,
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ease_factor numeric DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days integer DEFAULT 1;

-- Add notes column to study_logs if not exists (for markdown support)
ALTER TABLE public.study_logs
ADD COLUMN IF NOT EXISTS linked_topic_id uuid REFERENCES public.syllabus_topics(id) ON DELETE SET NULL;

-- Create loans table
CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  country text NOT NULL DEFAULT 'India',
  bank_name text NOT NULL,
  bank_logo_url text,
  loan_account_number text NOT NULL,
  loan_type text NOT NULL,
  principal_amount numeric NOT NULL,
  interest_rate numeric NOT NULL,
  tenure_months integer NOT NULL,
  emi_amount numeric NOT NULL,
  start_date date NOT NULL,
  repayment_mode text DEFAULT 'Auto Debit',
  notes text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create emi_schedule table
CREATE TABLE public.emi_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  emi_month integer NOT NULL,
  emi_date date NOT NULL,
  emi_amount numeric NOT NULL,
  principal_component numeric NOT NULL,
  interest_component numeric NOT NULL,
  remaining_principal numeric NOT NULL,
  payment_status text DEFAULT 'Pending',
  payment_method text,
  paid_date date,
  is_adjusted boolean DEFAULT false,
  adjustment_event_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Create emi_events table (for part-payments, advance EMI, foreclosure)
CREATE TABLE public.emi_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  amount numeric NOT NULL,
  mode text,
  applied_to_emi_id uuid REFERENCES public.emi_schedule(id) ON DELETE SET NULL,
  reduction_type text,
  interest_saved numeric DEFAULT 0,
  new_tenure_months integer,
  new_emi_amount numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create loan_documents table
CREATE TABLE public.loan_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  emi_id uuid REFERENCES public.emi_schedule(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  document_type text DEFAULT 'other',
  uploaded_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for loans
CREATE POLICY "Users can view their own loans" ON public.loans
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans" ON public.loans
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" ON public.loans
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans" ON public.loans
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for emi_schedule (through loan ownership)
CREATE POLICY "Users can view their own emi_schedule" ON public.emi_schedule
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can create their own emi_schedule" ON public.emi_schedule
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can update their own emi_schedule" ON public.emi_schedule
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can delete their own emi_schedule" ON public.emi_schedule
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid())
);

-- RLS policies for emi_events
CREATE POLICY "Users can view their own emi_events" ON public.emi_events
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can create their own emi_events" ON public.emi_events
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can update their own emi_events" ON public.emi_events
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can delete their own emi_events" ON public.emi_events
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid())
);

-- RLS policies for loan_documents
CREATE POLICY "Users can view their own loan_documents" ON public.loan_documents
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can create their own loan_documents" ON public.loan_documents
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid())
);

CREATE POLICY "Users can delete their own loan_documents" ON public.loan_documents
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid())
);

-- Create triggers for updated_at
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for loan documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for loan-documents bucket
CREATE POLICY "Users can upload loan documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their loan documents" ON storage.objects
FOR SELECT USING (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their loan documents" ON storage.objects
FOR DELETE USING (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);