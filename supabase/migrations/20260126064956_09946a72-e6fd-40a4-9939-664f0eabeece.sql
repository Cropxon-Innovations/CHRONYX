-- Fix wallet conversion function: 100 points = 1 coin = ₹1 (not ₹10)
-- Minimum redemption: 10 coins (₹10)

-- First drop the existing function
DROP FUNCTION IF EXISTS public.add_wallet_points(uuid, integer, text, text, uuid);

-- Recreate with correct conversion: 1 coin = ₹1
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
  -- Insert or update wallet
  INSERT INTO public.user_wallet (user_id, total_points, lifetime_points)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_wallet.total_points + p_points,
    lifetime_points = user_wallet.lifetime_points + p_points,
    updated_at = now();
  
  -- Log points earned
  INSERT INTO public.wallet_transactions (
    user_id, transaction_type, points_amount, reason, reference_type, reference_id
  ) VALUES (
    p_user_id, 'earn', p_points, p_reason, p_reference_type, p_reference_id
  );
  
  -- Check if we can convert points to coins (100 points = 1 coin)
  SELECT total_points INTO new_total_points FROM public.user_wallet WHERE user_id = p_user_id;
  coins_to_add := new_total_points / 100;
  
  IF coins_to_add > 0 THEN
    -- Convert points to coins: 100 points = 1 coin = ₹1
    UPDATE public.user_wallet 
    SET 
      total_points = total_points - (coins_to_add * 100),
      total_coins = total_coins + coins_to_add,
      lifetime_coins = lifetime_coins + coins_to_add,
      redeemable_balance = redeemable_balance + coins_to_add, -- 1 coin = ₹1
      updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Log conversion
    INSERT INTO public.wallet_transactions (
      user_id, transaction_type, points_amount, coins_amount, inr_amount, reason
    ) VALUES (
      p_user_id, 'convert', -(coins_to_add * 100), coins_to_add, coins_to_add, 
      'Auto-converted ' || (coins_to_add * 100) || ' points to ' || coins_to_add || ' coins (₹' || coins_to_add || ')'
    );
  END IF;
END;
$$;

-- Add admin approval columns to redemption_requests if not exists
ALTER TABLE public.redemption_requests 
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS admin_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_notified BOOLEAN DEFAULT false;

-- Create admin notifications table for redemption requests
CREATE TABLE IF NOT EXISTS public.admin_redemption_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  redemption_id UUID REFERENCES public.redemption_requests(id) ON DELETE CASCADE,
  admin_user_id UUID,
  notification_type TEXT NOT NULL, -- 'new_request', 'approved', 'rejected'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_redemption_notifications ENABLE ROW LEVEL SECURITY;

-- Admin can view all notifications
CREATE POLICY "Admins can manage redemption notifications"
ON public.admin_redemption_notifications
FOR ALL
USING (public.is_admin(auth.uid()));

-- Update redemption_requests RLS - admins can view all
DROP POLICY IF EXISTS "Admins can view all redemption requests" ON public.redemption_requests;
CREATE POLICY "Admins can view all redemption requests"
ON public.redemption_requests
FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update redemption requests" ON public.redemption_requests;
CREATE POLICY "Admins can update redemption requests"
ON public.redemption_requests
FOR UPDATE
USING (public.is_admin(auth.uid()));