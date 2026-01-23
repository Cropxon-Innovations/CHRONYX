-- Create login_history table for tracking sign-in attempts
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  login_method TEXT NOT NULL DEFAULT 'email', -- 'email', 'google', 'github', 'apple', 'passkey', 'totp'
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', '2fa_required', '2fa_verified'
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own login history"
  ON public.login_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert login history"
  ON public.login_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_created_at ON public.login_history(created_at DESC);

-- Enable realtime for login notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_history;