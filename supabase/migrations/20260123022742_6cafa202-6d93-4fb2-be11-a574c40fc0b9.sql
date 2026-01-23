-- Add missing library tables (library_items already exists)

-- Create library_highlights table for user highlights
CREATE TABLE IF NOT EXISTS public.library_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  page_number INTEGER,
  start_offset INTEGER,
  end_offset INTEGER,
  text_content TEXT NOT NULL,
  color TEXT DEFAULT '#fbbf24',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create library_bookmarks table
CREATE TABLE IF NOT EXISTS public.library_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vocabulary table for saved words
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT,
  pronunciation TEXT,
  example_usage TEXT,
  source_library_item_id UUID REFERENCES public.library_items(id) ON DELETE SET NULL,
  source_page INTEGER,
  mastery_level INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_sessions table for analytics
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  pages_read INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0
);

-- Create library_shares table for sharing
CREATE TABLE IF NOT EXISTS public.library_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with_email TEXT,
  shared_with_user_id UUID,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'download')),
  access_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create library_purchases table for monetization
CREATE TABLE IF NOT EXISTS public.library_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creator_payouts table
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT,
  payout_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add missing columns to library_items if they don't exist
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Enable RLS on all tables
ALTER TABLE public.library_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_highlights
CREATE POLICY "Users can manage their own highlights" ON public.library_highlights FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for library_bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON public.library_bookmarks FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for vocabulary
CREATE POLICY "Users can manage their own vocabulary" ON public.vocabulary FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for reading_sessions
CREATE POLICY "Users can manage their own reading sessions" ON public.reading_sessions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for library_shares
CREATE POLICY "Users can manage shares they created" ON public.library_shares FOR ALL USING (auth.uid() = shared_by OR auth.uid() = shared_with_user_id);

-- RLS Policies for library_purchases
CREATE POLICY "Users can view their purchases" ON public.library_purchases FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can insert purchases" ON public.library_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for creator_payouts
CREATE POLICY "Users can manage their own payouts" ON public.creator_payouts FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_library_highlights_item_id ON public.library_highlights(library_item_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON public.vocabulary(user_id);