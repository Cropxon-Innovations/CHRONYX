-- Create user_rewards table for points and rewards system
-- 100 points = ₹1, minimum redemption = ₹100 (10,000 points)
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  redeemed_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER GENERATED ALWAYS AS (total_points - redeemed_points) STORED,
  lifetime_earnings_rupees NUMERIC(10,2) GENERATED ALWAYS AS ((total_points - redeemed_points) / 100.0) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_rewards_user_id_unique UNIQUE (user_id)
);

-- Create rewards_transactions table for tracking point history
CREATE TABLE public.rewards_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'redeem', 'share_bonus', 'referral', 'purchase'
  points INTEGER NOT NULL,
  description TEXT,
  reference_id UUID, -- Link to share, purchase, etc.
  reference_type TEXT, -- 'library_share', 'memory_share', 'referral', 'redemption'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shares tracking table
CREATE TABLE public.content_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'library_item', 'memory', 'note', 'book'
  content_id UUID NOT NULL,
  share_method TEXT NOT NULL, -- 'link', 'email', 'social'
  recipient_email TEXT,
  access_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create redemption_requests table
CREATE TABLE public.redemption_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points_to_redeem INTEGER NOT NULL,
  amount_rupees NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'upi', 'bank_transfer'
  payment_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'rejected'
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" 
ON public.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards record" 
ON public.user_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" 
ON public.user_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for rewards_transactions
CREATE POLICY "Users can view their own reward transactions" 
ON public.rewards_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.rewards_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for content_shares
CREATE POLICY "Users can view their own shares" 
ON public.content_shares 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares" 
ON public.content_shares 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares" 
ON public.content_shares 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares" 
ON public.content_shares 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for redemption_requests
CREATE POLICY "Users can view their own redemption requests" 
ON public.redemption_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemption requests" 
ON public.redemption_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to add points and record transaction
CREATE OR REPLACE FUNCTION public.add_reward_points(
  p_user_id UUID,
  p_points INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Upsert user_rewards record
  INSERT INTO public.user_rewards (user_id, total_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_rewards.total_points + p_points,
    updated_at = now();
  
  -- Record the transaction
  INSERT INTO public.rewards_transactions (
    user_id, 
    transaction_type, 
    points, 
    description,
    reference_id,
    reference_type
  )
  VALUES (
    p_user_id, 
    p_type, 
    p_points, 
    p_description,
    p_reference_id,
    p_reference_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to handle share bonus (5 points per share)
CREATE OR REPLACE FUNCTION public.award_share_points()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.add_reward_points(
    NEW.user_id,
    5, -- 5 points per share
    'share_bonus',
    'Bonus for sharing ' || NEW.content_type,
    NEW.id,
    NEW.content_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-award points on share
CREATE TRIGGER award_share_points_trigger
AFTER INSERT ON public.content_shares
FOR EACH ROW
EXECUTE FUNCTION public.award_share_points();

-- Create index for performance
CREATE INDEX idx_rewards_transactions_user ON public.rewards_transactions(user_id);
CREATE INDEX idx_content_shares_user ON public.content_shares(user_id);
CREATE INDEX idx_content_shares_token ON public.content_shares(share_token);
CREATE INDEX idx_redemption_requests_user ON public.redemption_requests(user_id);