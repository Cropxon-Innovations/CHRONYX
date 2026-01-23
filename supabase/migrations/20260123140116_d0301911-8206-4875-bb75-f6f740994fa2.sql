-- Fix the login_history insert policy to only allow authenticated users to insert their own records
DROP POLICY IF EXISTS "Service role can insert login history" ON public.login_history;

CREATE POLICY "Users can insert their own login history"
  ON public.login_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);