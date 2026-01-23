-- Add folder scanning settings and auto-sync configuration to gmail_sync_settings
ALTER TABLE public.gmail_sync_settings 
ADD COLUMN IF NOT EXISTS scan_folders JSONB DEFAULT '{"inbox": true, "promotions": true, "updates": true, "social": false, "spam": false, "trash": false}'::jsonb,
ADD COLUMN IF NOT EXISTS sync_frequency_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS last_auto_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scan_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS scan_mode TEXT DEFAULT 'limited' CHECK (scan_mode IN ('limited', 'full'));

-- Add is_auto_imported and source tracking to income_entries for gmail imports
ALTER TABLE public.income_entries
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS gmail_import_id UUID REFERENCES public.auto_imported_transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS merchant_name TEXT;

-- Add transaction type to auto_imported_transactions to distinguish debit/credit
ALTER TABLE public.auto_imported_transactions
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'debit' CHECK (transaction_type IN ('debit', 'credit'));

-- Create index for income entry lookup
CREATE INDEX IF NOT EXISTS idx_income_entries_gmail_import ON public.income_entries(gmail_import_id);
CREATE INDEX IF NOT EXISTS idx_auto_imported_txn_type ON public.auto_imported_transactions(user_id, transaction_type);