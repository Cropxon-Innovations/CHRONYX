-- Update the payment_mode check constraint to include all possible values from Gmail sync
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_payment_mode_check;

ALTER TABLE public.expenses ADD CONSTRAINT expenses_payment_mode_check 
CHECK (payment_mode = ANY (ARRAY['Cash'::text, 'UPI'::text, 'Card'::text, 'Bank Transfer'::text, 'Wallet'::text, 'Other'::text, 'NetBanking'::text]));