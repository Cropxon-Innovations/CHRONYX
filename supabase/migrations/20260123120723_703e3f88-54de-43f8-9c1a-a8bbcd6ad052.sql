-- Two-Factor Authentication Tables

-- 1. User 2FA settings and credentials
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  totp_secret_encrypted TEXT, -- Encrypted TOTP secret
  totp_verified_at TIMESTAMP WITH TIME ZONE,
  webauthn_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes_hash TEXT[], -- Hashed backup codes
  backup_codes_used INTEGER NOT NULL DEFAULT 0,
  last_2fa_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. WebAuthn credentials storage
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  device_type TEXT, -- 'security_key', 'platform', 'hybrid'
  transports TEXT[],
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. 2FA session challenges (for WebAuthn)
CREATE TABLE IF NOT EXISTS public.auth_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_2fa
CREATE POLICY "Users can view own 2FA settings" ON public.user_2fa
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings" ON public.user_2fa
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings" ON public.user_2fa
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for webauthn_credentials
CREATE POLICY "Users can view own WebAuthn credentials" ON public.webauthn_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own WebAuthn credentials" ON public.webauthn_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own WebAuthn credentials" ON public.webauthn_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for auth_challenges
CREATE POLICY "Users can view own challenges" ON public.auth_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" ON public.auth_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON public.auth_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON public.webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_user_id ON public.auth_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires ON public.auth_challenges(expires_at) WHERE NOT used;

-- Update trigger for user_2fa
CREATE TRIGGER update_user_2fa_updated_at
  BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced invoices table with more billing details
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS billing_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS gstin TEXT,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS notes TEXT;