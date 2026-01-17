-- Table for tracking user corrections to improve duplicate detection
CREATE TABLE public.financeflow_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_transaction_id UUID REFERENCES public.auto_imported_transactions(id) ON DELETE CASCADE,
  correction_type TEXT NOT NULL, -- 'marked_duplicate', 'marked_not_duplicate', 'category_changed', 'amount_corrected'
  original_value JSONB,
  corrected_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financeflow_corrections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own corrections" 
ON public.financeflow_corrections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own corrections" 
ON public.financeflow_corrections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Table for FinanceFlow sync history
CREATE TABLE public.financeflow_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled', 'initial'
  emails_scanned INTEGER NOT NULL DEFAULT 0,
  transactions_found INTEGER NOT NULL DEFAULT 0,
  duplicates_detected INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  sync_duration_ms INTEGER,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'partial', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financeflow_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own sync history" 
ON public.financeflow_sync_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync history" 
ON public.financeflow_sync_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_financeflow_corrections_user ON public.financeflow_corrections(user_id);
CREATE INDEX idx_financeflow_sync_history_user ON public.financeflow_sync_history(user_id, created_at DESC);

-- Add merchant_pattern column to track learned patterns
ALTER TABLE public.auto_imported_transactions 
ADD COLUMN IF NOT EXISTS learned_category TEXT,
ADD COLUMN IF NOT EXISTS user_verified BOOLEAN DEFAULT false;