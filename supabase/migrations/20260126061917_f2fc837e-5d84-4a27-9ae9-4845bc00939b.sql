-- =============================================
-- RESOLUTIONS & REWARDS SYSTEM (with IF NOT EXISTS)
-- =============================================

-- Yearly Resolutions Table
CREATE TABLE IF NOT EXISTS public.yearly_resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  category TEXT DEFAULT 'general',
  color TEXT DEFAULT '#6366f1',
  priority INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Five Year Plans Table
CREATE TABLE IF NOT EXISTS public.five_year_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestones JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Coins & Points Wallet
CREATE TABLE IF NOT EXISTS public.user_wallet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  total_coins INTEGER DEFAULT 0,
  redeemable_balance DECIMAL(10,2) DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  lifetime_coins INTEGER DEFAULT 0,
  lifetime_redeemed DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Points & Coins Transactions Log
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  points_amount INTEGER DEFAULT 0,
  coins_amount INTEGER DEFAULT 0,
  inr_amount DECIMAL(10,2) DEFAULT 0,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  badge_color TEXT DEFAULT '#6366f1',
  badge_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Notes Trash Table (for 7-day cleanup)
CREATE TABLE IF NOT EXISTS public.notes_trash (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_note_id UUID NOT NULL,
  title TEXT,
  content JSONB,
  canvas_data JSONB,
  tags TEXT[],
  folder_id UUID,
  metadata JSONB DEFAULT '{}',
  versions JSONB DEFAULT '[]',
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  auto_delete_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS
ALTER TABLE public.yearly_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.five_year_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_trash ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view own resolutions" ON public.yearly_resolutions;
DROP POLICY IF EXISTS "Users can create own resolutions" ON public.yearly_resolutions;
DROP POLICY IF EXISTS "Users can update own resolutions" ON public.yearly_resolutions;
DROP POLICY IF EXISTS "Users can delete own resolutions" ON public.yearly_resolutions;

CREATE POLICY "Users can view own resolutions" ON public.yearly_resolutions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own resolutions" ON public.yearly_resolutions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resolutions" ON public.yearly_resolutions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resolutions" ON public.yearly_resolutions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own plans" ON public.five_year_plans;
DROP POLICY IF EXISTS "Users can create own plans" ON public.five_year_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON public.five_year_plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON public.five_year_plans;

CREATE POLICY "Users can view own plans" ON public.five_year_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own plans" ON public.five_year_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.five_year_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.five_year_plans FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallet;
DROP POLICY IF EXISTS "Users can create own wallet" ON public.user_wallet;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallet;

CREATE POLICY "Users can view own wallet" ON public.user_wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wallet" ON public.user_wallet FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.user_wallet FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.wallet_transactions;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can create own badges" ON public.user_badges;

CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own trash" ON public.notes_trash;
DROP POLICY IF EXISTS "Users can create own trash" ON public.notes_trash;
DROP POLICY IF EXISTS "Users can delete own trash" ON public.notes_trash;

CREATE POLICY "Users can view own trash" ON public.notes_trash FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trash" ON public.notes_trash FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trash" ON public.notes_trash FOR DELETE USING (auth.uid() = user_id);

-- Function to add points and auto-convert to coins
CREATE OR REPLACE FUNCTION public.add_wallet_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total_points INTEGER;
  coins_to_add INTEGER;
BEGIN
  INSERT INTO public.user_wallet (user_id, total_points, lifetime_points)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_wallet.total_points + p_points,
    lifetime_points = user_wallet.lifetime_points + p_points,
    updated_at = now();
  
  INSERT INTO public.wallet_transactions (
    user_id, transaction_type, points_amount, reason, reference_type, reference_id
  ) VALUES (
    p_user_id, 'earn', p_points, p_reason, p_reference_type, p_reference_id
  );
  
  SELECT total_points INTO new_total_points FROM public.user_wallet WHERE user_id = p_user_id;
  coins_to_add := new_total_points / 100;
  
  IF coins_to_add > 0 THEN
    UPDATE public.user_wallet 
    SET 
      total_points = total_points - (coins_to_add * 100),
      total_coins = total_coins + coins_to_add,
      lifetime_coins = lifetime_coins + coins_to_add,
      redeemable_balance = redeemable_balance + (coins_to_add * 10),
      updated_at = now()
    WHERE user_id = p_user_id;
    
    INSERT INTO public.wallet_transactions (
      user_id, transaction_type, points_amount, coins_amount, inr_amount, reason
    ) VALUES (
      p_user_id, 'convert', -(coins_to_add * 100), coins_to_add, coins_to_add * 10, 
      'Auto-converted ' || (coins_to_add * 100) || ' points to ' || coins_to_add || ' coins'
    );
  END IF;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_trash_auto_delete ON public.notes_trash(auto_delete_at);
CREATE INDEX IF NOT EXISTS idx_notes_trash_user ON public.notes_trash(user_id);
CREATE INDEX IF NOT EXISTS idx_yearly_resolutions_user_year ON public.yearly_resolutions(user_id, year);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id, created_at DESC);