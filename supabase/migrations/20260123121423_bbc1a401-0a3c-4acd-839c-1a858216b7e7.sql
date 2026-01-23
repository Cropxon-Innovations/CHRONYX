-- Financial Goals and Business Documents Tables

-- 1. Financial Goals Table
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  category TEXT NOT NULL CHECK (category IN ('savings', 'investment', 'debt_payoff', 'emergency_fund', 'retirement', 'education', 'home', 'vehicle', 'vacation', 'other')),
  target_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  color TEXT,
  icon TEXT,
  auto_track BOOLEAN NOT NULL DEFAULT false,
  linked_accounts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Goal Milestones Table
CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_percentage NUMERIC NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Goal Contributions Table
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  note TEXT,
  source TEXT, -- 'manual', 'auto_transfer', 'investment_return'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Stock Holdings Table (for live price tracking)
CREATE TABLE IF NOT EXISTS public.stock_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE', -- NSE, BSE, NASDAQ, NYSE
  quantity NUMERIC NOT NULL,
  average_price NUMERIC NOT NULL,
  current_price NUMERIC,
  last_price_update TIMESTAMP WITH TIME ZONE,
  name TEXT,
  sector TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Business Profiles Table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  legal_name TEXT,
  business_type TEXT NOT NULL CHECK (business_type IN ('sole_proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'opc', 'ngo', 'trust', 'other')),
  registration_number TEXT,
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  incorporation_date DATE,
  registered_address TEXT,
  business_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  description TEXT,
  logo_url TEXT,
  employee_count INTEGER,
  annual_revenue NUMERIC,
  huminex_workspace_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Business Documents Table
CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('incorporation', 'registration', 'tax', 'license', 'agreement', 'compliance', 'financial', 'hr', 'legal', 'other')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  reference_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Business Links Table (for external integrations)
CREATE TABLE IF NOT EXISTS public.business_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_goals
CREATE POLICY "Users can manage own goals" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for goal_milestones (through goal ownership)
CREATE POLICY "Users can manage own milestones" ON public.goal_milestones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.financial_goals WHERE id = goal_milestones.goal_id AND user_id = auth.uid()
  ));

-- RLS Policies for goal_contributions
CREATE POLICY "Users can manage own contributions" ON public.goal_contributions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.financial_goals WHERE id = goal_contributions.goal_id AND user_id = auth.uid()
  ));

-- RLS Policies for stock_holdings
CREATE POLICY "Users can manage own holdings" ON public.stock_holdings
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for business_profiles
CREATE POLICY "Users can manage own businesses" ON public.business_profiles
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for business_documents
CREATE POLICY "Users can manage own business docs" ON public.business_documents
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for business_links
CREATE POLICY "Users can manage own business links" ON public.business_links
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.business_profiles WHERE id = business_links.business_id AND user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_goals_user ON public.financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON public.financial_goals(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stock_holdings_user ON public.stock_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_symbol ON public.stock_holdings(symbol, exchange);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_documents_business ON public.business_documents(business_id);

-- Update triggers
CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_holdings_updated_at
  BEFORE UPDATE ON public.stock_holdings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_documents_updated_at
  BEFORE UPDATE ON public.business_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();