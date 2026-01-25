-- Add is_suspended column to profiles table for user account management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Add index for quick filtering of suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended) WHERE is_suspended = true;