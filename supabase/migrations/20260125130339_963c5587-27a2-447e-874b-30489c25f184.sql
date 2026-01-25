-- Create avatars bucket (public for profile photos)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policy for avatars - users can upload their own
CREATE POLICY "Users can upload their avatar" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy for avatars - anyone can view (public)
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Storage policy for avatars - users can update their own
CREATE POLICY "Users can update their avatar" ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy for avatars - users can delete their own
CREATE POLICY "Users can delete their avatar" ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Creator payment settings table
CREATE TABLE IF NOT EXISTS public.creator_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    payment_method TEXT NOT NULL DEFAULT 'upi' CHECK (payment_method IN ('upi', 'bank')),
    upi_id TEXT,
    bank_name TEXT,
    account_holder_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content purchases table
CREATE TABLE IF NOT EXISTS public.content_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'library_item',
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    commission_percent NUMERIC DEFAULT 10,
    commission_amount NUMERIC,
    creator_payout_amount NUMERIC,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    payout_id UUID REFERENCES public.creator_payouts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add columns to library_items for creator info
ALTER TABLE public.library_items 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_name TEXT,
ADD COLUMN IF NOT EXISTS creator_avatar TEXT;

-- Enable RLS on new tables
ALTER TABLE public.creator_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_payment_settings
CREATE POLICY "Users can view their own payment settings" ON public.creator_payment_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment settings" ON public.creator_payment_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment settings" ON public.creator_payment_settings
FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for content_purchases
CREATE POLICY "Buyers can view their purchases" ON public.content_purchases
FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view purchases of their content" ON public.content_purchases
FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create purchases" ON public.content_purchases
FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Trigger to update library_items earnings
CREATE OR REPLACE FUNCTION public.update_content_earnings()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE public.library_items
        SET 
            purchase_count = purchase_count + 1,
            total_earnings = total_earnings + NEW.creator_payout_amount
        WHERE id = NEW.content_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_library_earnings
AFTER INSERT OR UPDATE ON public.content_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_content_earnings();

-- Trigger to update updated_at
CREATE TRIGGER update_creator_payment_settings_updated_at
BEFORE UPDATE ON public.creator_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_purchases_updated_at
BEFORE UPDATE ON public.content_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();