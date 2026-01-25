-- Add rating and review tables for Hub content
CREATE TABLE IF NOT EXISTS public.content_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(content_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.content_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add download control and average rating to library_items
ALTER TABLE public.library_items 
ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sample_pages INTEGER DEFAULT 5;

-- Enable RLS
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

-- RLS for ratings: Anyone can view, users can rate public content
CREATE POLICY "Anyone can view ratings" ON public.content_ratings
FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON public.content_ratings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.content_ratings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.content_ratings
FOR DELETE USING (auth.uid() = user_id);

-- RLS for comments: Anyone can view, users can comment
CREATE POLICY "Anyone can view comments" ON public.content_comments
FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.content_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.content_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.content_comments
FOR DELETE USING (auth.uid() = user_id);

-- Update RLS for library_items to allow reading public content by anyone
DROP POLICY IF EXISTS "Users can view public items" ON public.library_items;
CREATE POLICY "Anyone can view public items" ON public.library_items
FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Function to update average rating
CREATE OR REPLACE FUNCTION public.update_content_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avg_rating NUMERIC(2,1);
    count_ratings INTEGER;
BEGIN
    SELECT AVG(rating)::NUMERIC(2,1), COUNT(*) INTO avg_rating, count_ratings
    FROM public.content_ratings
    WHERE content_id = COALESCE(NEW.content_id, OLD.content_id);
    
    UPDATE public.library_items
    SET average_rating = COALESCE(avg_rating, 0),
        rating_count = count_ratings
    WHERE id = COALESCE(NEW.content_id, OLD.content_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for rating updates
DROP TRIGGER IF EXISTS update_rating_stats ON public.content_ratings;
CREATE TRIGGER update_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON public.content_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_content_rating();