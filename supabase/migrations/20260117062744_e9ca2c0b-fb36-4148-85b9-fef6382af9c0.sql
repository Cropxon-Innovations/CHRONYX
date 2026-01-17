-- Create gmail_sync_settings table for storing user Gmail sync preferences and tokens
CREATE TABLE public.gmail_sync_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  gmail_email TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_history_id TEXT,
  sync_status TEXT DEFAULT 'idle',
  total_synced_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gmail_sync_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own gmail settings"
ON public.gmail_sync_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gmail settings"
ON public.gmail_sync_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gmail settings"
ON public.gmail_sync_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gmail settings"
ON public.gmail_sync_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Create auto_imported_transactions table for tracking Gmail-imported transactions
CREATE TABLE public.auto_imported_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT,
  merchant_name TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  transaction_date DATE NOT NULL,
  payment_mode TEXT,
  source_platform TEXT,
  email_subject TEXT,
  email_snippet TEXT,
  confidence_score NUMERIC DEFAULT 0.7,
  is_processed BOOLEAN DEFAULT false,
  linked_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  raw_extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_message_id)
);

-- Enable RLS
ALTER TABLE public.auto_imported_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own imported transactions"
ON public.auto_imported_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imported transactions"
ON public.auto_imported_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported transactions"
ON public.auto_imported_transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported transactions"
ON public.auto_imported_transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add columns to expenses table for better auto-import tracking
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS gmail_import_id UUID REFERENCES public.auto_imported_transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS merchant_name TEXT;

-- Create index for duplicate detection
CREATE INDEX idx_expenses_duplicate_check ON public.expenses(user_id, amount, expense_date, merchant_name);
CREATE INDEX idx_auto_imported_gmail_msg ON public.auto_imported_transactions(user_id, gmail_message_id);
CREATE INDEX idx_gmail_sync_user ON public.gmail_sync_settings(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_gmail_sync_settings_updated_at
BEFORE UPDATE ON public.gmail_sync_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_imported_transactions_updated_at
BEFORE UPDATE ON public.auto_imported_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();