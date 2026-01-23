-- Create billing_addresses table for invoice generation
CREATE TABLE public.billing_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  gstin TEXT,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own billing addresses"
ON public.billing_addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own billing addresses"
ON public.billing_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing addresses"
ON public.billing_addresses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own billing addresses"
ON public.billing_addresses FOR DELETE
USING (auth.uid() = user_id);

-- Create payment_records table to store payment with billing info
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  invoice_number TEXT UNIQUE,
  billing_name TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  billing_city TEXT NOT NULL,
  billing_state TEXT NOT NULL,
  billing_pincode TEXT NOT NULL,
  billing_gstin TEXT,
  invoice_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payment records"
ON public.payment_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert payment records"
ON public.payment_records FOR INSERT
WITH CHECK (true);

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  current_month TEXT;
  seq_number INT;
  invoice_num TEXT;
BEGIN
  current_year := to_char(CURRENT_DATE, 'YYYY');
  current_month := to_char(CURRENT_DATE, 'MM');
  
  SELECT COUNT(*) + 1 INTO seq_number
  FROM public.payment_records
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE);
  
  invoice_num := 'CHRX-' || current_year || current_month || '-' || LPAD(seq_number::TEXT, 4, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;