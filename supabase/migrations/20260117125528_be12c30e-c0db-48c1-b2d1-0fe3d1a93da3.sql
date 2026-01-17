
-- ============================================
-- CHRONYX GUARDRAILS - COMPREHENSIVE MIGRATION
-- Production-grade security, rate limiting, logging
-- ============================================

-- 1. USAGE TRACKING TABLE for plan limits
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('gmail_import', 'ai_parsing', 'ocr_scan', 'export')),
  usage_count INTEGER NOT NULL DEFAULT 1,
  usage_month TEXT NOT NULL, -- Format: 'YYYY-MM'
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_type, usage_month)
);

-- Enable RLS on usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. GMAIL IMPORT LOGS (Append-only audit trail)
CREATE TABLE IF NOT EXISTS public.gmail_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gmail_message_id TEXT,
  action TEXT NOT NULL, -- 'import', 'skip', 'duplicate', 'error'
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  email_subject TEXT,
  transaction_amount NUMERIC,
  source TEXT NOT NULL DEFAULT 'gmail',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gmail_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gmail logs" ON public.gmail_import_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gmail logs" ON public.gmail_import_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. AI PARSING LOGS (Append-only audit trail)
CREATE TABLE IF NOT EXISTS public.ai_parsing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parse_type TEXT NOT NULL, -- 'email', 'document', 'ocr'
  input_snippet TEXT, -- First 200 chars only
  output_summary TEXT,
  model_used TEXT,
  confidence_score NUMERIC,
  tokens_used INTEGER,
  cost_estimate NUMERIC,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  source TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_parsing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ai logs" ON public.ai_parsing_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai logs" ON public.ai_parsing_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. USER ACTION LOGS (Append-only audit trail)
CREATE TABLE IF NOT EXISTS public.user_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'upgrade', 'downgrade', 'delete_data', 'disconnect_gmail', etc.
  module TEXT NOT NULL, -- 'auth', 'finance', 'gmail', 'subscription', etc.
  target_id UUID, -- Optional reference to affected record
  target_type TEXT, -- 'expense', 'transaction', 'subscription', etc.
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own action logs" ON public.user_action_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action logs" ON public.user_action_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. ERROR LOGS (Append-only for debugging)
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  error_type TEXT NOT NULL, -- 'api_error', 'validation_error', 'rate_limit', 'auth_error', etc.
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint TEXT,
  request_payload JSONB,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own error logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to insert error logs for all users
CREATE POLICY "Service can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- 6. PLAN LIMITS CONFIGURATION (Static reference table)
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL UNIQUE CHECK (plan_type IN ('free', 'trial', 'pro', 'premium', 'lifetime')),
  gmail_imports_per_month INTEGER NOT NULL DEFAULT 0,
  ai_parsing_per_month INTEGER NOT NULL DEFAULT 0,
  ocr_scans_per_month INTEGER NOT NULL DEFAULT 0,
  storage_gb NUMERIC NOT NULL DEFAULT 2,
  trial_duration_days INTEGER,
  price_inr NUMERIC NOT NULL DEFAULT 0,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  yearly_price_inr NUMERIC,
  yearly_price_usd NUMERIC,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default plan limits
INSERT INTO public.plan_limits (plan_type, gmail_imports_per_month, ai_parsing_per_month, ocr_scans_per_month, storage_gb, price_inr, price_usd, yearly_price_inr, yearly_price_usd, trial_duration_days, features)
VALUES 
  ('free', 0, 0, 0, 2, 0, 0, NULL, NULL, NULL, '{"manual_entries": true, "dashboards": true, "budgeting": true, "basic_reports": true}'::jsonb),
  ('trial', 20, 50, 10, 5, 0, 0, NULL, NULL, 7, '{"gmail_import": true, "ai_parsing": true, "ocr": true}'::jsonb),
  ('pro', 300, 500, 100, 10, 199, 3, 1999, 29, NULL, '{"gmail_import": true, "ai_parsing": true, "ocr": true, "smart_categorization": true, "priority_support": true}'::jsonb),
  ('premium', 1500, 3000, 500, 100, 499, 7, 4999, 69, NULL, '{"gmail_import": true, "ai_parsing": true, "ocr": true, "smart_categorization": true, "family_profiles": true, "advanced_forecasts": true, "export_all": true, "priority_support": true}'::jsonb),
  ('lifetime', 1500, 3000, 500, 100, 9999, 149, NULL, NULL, NULL, '{"gmail_import": true, "ai_parsing": true, "ocr": true, "smart_categorization": true, "family_profiles": true, "advanced_forecasts": true, "export_all": true, "priority_support": true, "lifetime": true}'::jsonb)
ON CONFLICT (plan_type) DO UPDATE SET
  gmail_imports_per_month = EXCLUDED.gmail_imports_per_month,
  ai_parsing_per_month = EXCLUDED.ai_parsing_per_month,
  ocr_scans_per_month = EXCLUDED.ocr_scans_per_month,
  storage_gb = EXCLUDED.storage_gb,
  price_inr = EXCLUDED.price_inr,
  price_usd = EXCLUDED.price_usd,
  yearly_price_inr = EXCLUDED.yearly_price_inr,
  yearly_price_usd = EXCLUDED.yearly_price_usd,
  features = EXCLUDED.features,
  updated_at = now();

-- Plan limits is a reference table - read-only for users
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan limits" ON public.plan_limits
  FOR SELECT USING (true);

-- 7. INVOICES TABLE for payment records
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  payment_history_id UUID REFERENCES public.payment_history(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  plan_type TEXT NOT NULL,
  
  -- Amounts
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  
  -- Company details
  company_name TEXT NOT NULL DEFAULT 'CROPXON INNOVATIONS PVT LTD',
  company_address TEXT DEFAULT 'India',
  company_gstin TEXT,
  
  -- Customer details
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  
  -- Invoice details
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('draft', 'pending', 'paid', 'cancelled', 'refunded')),
  
  -- File storage
  pdf_url TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. ADD is_overridden column to auto_imported_transactions for manual override tracking
ALTER TABLE public.auto_imported_transactions 
  ADD COLUMN IF NOT EXISTS is_overridden BOOLEAN DEFAULT false;

ALTER TABLE public.auto_imported_transactions 
  ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.auto_imported_transactions 
  ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- 9. ADD unique constraint for deduplication
ALTER TABLE public.auto_imported_transactions 
  DROP CONSTRAINT IF EXISTS auto_imported_transactions_unique_message;

ALTER TABLE public.auto_imported_transactions 
  ADD CONSTRAINT auto_imported_transactions_unique_message 
  UNIQUE (user_id, gmail_message_id);

-- 10. ADD daily import tracking column to gmail_sync_settings
ALTER TABLE public.gmail_sync_settings 
  ADD COLUMN IF NOT EXISTS daily_import_count INTEGER DEFAULT 0;

ALTER TABLE public.gmail_sync_settings 
  ADD COLUMN IF NOT EXISTS daily_import_date DATE;

ALTER TABLE public.gmail_sync_settings 
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- 11. Update subscriptions table with trial info
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;

ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- 12. Add source tracking to expenses for manual vs auto distinction
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS is_overridden BOOLEAN DEFAULT false;

-- 13. Create invoice number sequence function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT;
  seq_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_prefix := 'CRX' || TO_CHAR(CURRENT_DATE, 'YYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.invoices
  WHERE invoice_number LIKE year_prefix || '%';
  
  invoice_num := year_prefix || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. Function to check and update usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID,
  p_usage_type TEXT,
  p_plan_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  current_month TEXT;
  current_usage INTEGER;
  plan_limit INTEGER;
  result JSONB;
BEGIN
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Get current usage
  SELECT COALESCE(usage_count, 0) INTO current_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id 
    AND usage_type = p_usage_type 
    AND usage_month = current_month;
  
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  -- Get plan limit
  SELECT 
    CASE p_usage_type
      WHEN 'gmail_import' THEN gmail_imports_per_month
      WHEN 'ai_parsing' THEN ai_parsing_per_month
      WHEN 'ocr_scan' THEN ocr_scans_per_month
      ELSE 0
    END INTO plan_limit
  FROM public.plan_limits
  WHERE plan_type = p_plan_type;
  
  IF plan_limit IS NULL THEN
    plan_limit := 0;
  END IF;
  
  result := jsonb_build_object(
    'current_usage', current_usage,
    'limit', plan_limit,
    'remaining', GREATEST(plan_limit - current_usage, 0),
    'can_use', current_usage < plan_limit,
    'usage_percent', CASE WHEN plan_limit > 0 THEN ROUND((current_usage::NUMERIC / plan_limit) * 100, 2) ELSE 0 END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  INSERT INTO public.usage_tracking (user_id, usage_type, usage_month, usage_count, last_used_at)
  VALUES (p_user_id, p_usage_type, current_month, p_count, now())
  ON CONFLICT (user_id, usage_type, usage_month)
  DO UPDATE SET 
    usage_count = usage_tracking.usage_count + p_count,
    last_used_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON public.usage_tracking(user_id, usage_month);
CREATE INDEX IF NOT EXISTS idx_gmail_import_logs_user ON public.gmail_import_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_parsing_logs_user ON public.ai_parsing_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_user ON public.user_action_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
