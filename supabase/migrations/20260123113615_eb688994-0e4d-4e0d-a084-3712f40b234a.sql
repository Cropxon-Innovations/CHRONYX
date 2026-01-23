-- Create user_assets table for comprehensive asset management
CREATE TABLE IF NOT EXISTS public.user_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Classification
  category_code TEXT NOT NULL CHECK (category_code IN (
    'CASH_BANK', 'INVESTMENTS', 'PROPERTY_REAL', 
    'PHYSICAL_VALUABLES', 'INSURANCE_ASSET', 'RETIREMENT',
    'INTELLECTUAL_DIGITAL', 'BUSINESS_OWNERSHIP', 'RECEIVABLES'
  )),
  subcategory TEXT NOT NULL,
  
  -- Core details
  asset_name TEXT NOT NULL,
  description TEXT,
  
  -- Valuation
  purchase_value NUMERIC(15,2) DEFAULT 0,
  current_value NUMERIC(15,2) DEFAULT 0,
  purchase_date DATE,
  currency TEXT DEFAULT 'INR',
  
  -- Additional fields (JSON for flexibility)
  metadata JSONB DEFAULT '{}',
  
  -- For investments
  quantity NUMERIC(15,4),
  symbol TEXT,
  isin TEXT,
  broker_platform TEXT,
  
  -- For bank accounts
  bank_name TEXT,
  account_number_mask TEXT,
  interest_rate NUMERIC(5,2),
  maturity_date DATE,
  
  -- For property
  address TEXT,
  ownership_percent NUMERIC(5,2) DEFAULT 100,
  rental_income NUMERIC(15,2) DEFAULT 0,
  
  -- For insurance as asset (only if declared)
  policy_number TEXT,
  sum_assured NUMERIC(15,2),
  premium_amount NUMERIC(15,2),
  
  -- Tracking
  is_active BOOLEAN DEFAULT true,
  last_valuation_date TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own assets"
  ON public.user_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON public.user_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON public.user_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON public.user_assets FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_assets_updated_at
  BEFORE UPDATE ON public.user_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_assets_user_id ON public.user_assets(user_id);
CREATE INDEX idx_user_assets_category ON public.user_assets(category_code);
CREATE INDEX idx_user_assets_active ON public.user_assets(is_active);

-- Create AI category suggestions table for learning
CREATE TABLE IF NOT EXISTS public.ai_category_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant_pattern TEXT NOT NULL,
  suggested_category TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_category_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own patterns"
  ON public.ai_category_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns"
  ON public.ai_category_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
  ON public.ai_category_patterns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns"
  ON public.ai_category_patterns FOR DELETE
  USING (auth.uid() = user_id);

-- Create unique index for patterns
CREATE UNIQUE INDEX idx_ai_patterns_unique ON public.ai_category_patterns(user_id, merchant_pattern);

-- Create finance_reports table for scheduled reports
CREATE TABLE IF NOT EXISTS public.finance_report_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'both')),
  is_enabled BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finance_report_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their report subscriptions"
  ON public.finance_report_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_finance_report_subscriptions_updated_at
  BEFORE UPDATE ON public.finance_report_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();