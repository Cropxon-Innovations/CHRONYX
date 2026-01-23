-- Fix the permissive RLS policy for payment_records
DROP POLICY IF EXISTS "Service can insert payment records" ON public.payment_records;

-- Create proper RLS policy - allow authenticated users to have records inserted for them
CREATE POLICY "Users can have payment records created for them"
ON public.payment_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix generate_invoice_number function with proper search_path
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;