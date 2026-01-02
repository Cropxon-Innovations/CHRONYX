-- Make loan-documents bucket public for logo access
UPDATE storage.buckets SET public = true WHERE id = 'loan-documents';

-- Add reminder_days column to insurances for renewal reminders
ALTER TABLE public.insurances 
ADD COLUMN IF NOT EXISTS reminder_days integer[] DEFAULT '{30,7,1}';

-- Add email field to profiles for notifications if not exists
-- (profiles already has email from types, just confirming it exists)

-- Create emi_reminders table to track sent reminders
CREATE TABLE IF NOT EXISTS public.emi_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emi_id uuid NOT NULL REFERENCES public.emi_schedule(id) ON DELETE CASCADE,
  reminder_type text NOT NULL, -- 'upcoming_7', 'upcoming_3', 'upcoming_1', 'overdue'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  email_sent_to text NOT NULL
);

-- Enable RLS
ALTER TABLE public.emi_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policy for emi_reminders (join through emi_schedule -> loans)
CREATE POLICY "Users can view their own emi_reminders" 
ON public.emi_reminders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM emi_schedule es
  JOIN loans l ON es.loan_id = l.id
  WHERE es.id = emi_reminders.emi_id AND l.user_id = auth.uid()
));

-- Create insurance_reminders table to track sent reminders
CREATE TABLE IF NOT EXISTS public.insurance_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id uuid NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  reminder_days_before integer NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  email_sent_to text NOT NULL
);

-- Enable RLS
ALTER TABLE public.insurance_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policy for insurance_reminders
CREATE POLICY "Users can view their own insurance_reminders" 
ON public.insurance_reminders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM insurances i
  WHERE i.id = insurance_reminders.insurance_id AND i.user_id = auth.uid()
));