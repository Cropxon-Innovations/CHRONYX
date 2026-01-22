-- ===========================================
-- CHRONYX eAUTHOR MODULE DATABASE SCHEMA
-- E-Book Authoring, Designing, Reading, and Publishing Studio
-- ===========================================

-- Books table - Main book projects
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Book',
  subtitle TEXT,
  author_name TEXT,
  description TEXT,
  cover_url TEXT,
  cover_template TEXT DEFAULT 'minimal',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'writing', 'editing', 'review', 'published')),
  genre TEXT,
  language TEXT DEFAULT 'en',
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{"fontSize": 16, "fontFamily": "serif", "lineSpacing": 1.6, "pageSize": "A4", "margins": {"top": 72, "bottom": 72, "left": 72, "right": 72}}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chapters table - Book structure
CREATE TABLE public.book_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Chapter',
  content JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'final')),
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sections table - Chapter subsections
CREATE TABLE public.book_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.book_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Section',
  content JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chapter versions - Version history
CREATE TABLE public.book_chapter_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.book_chapters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  word_count INTEGER DEFAULT 0,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Book assets - Images and media
CREATE TABLE public.book_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  alt_text TEXT,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reading progress - Track reading position
CREATE TABLE public.book_reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  current_chapter_id UUID REFERENCES public.book_chapters(id) ON DELETE SET NULL,
  current_position INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reading_settings JSONB DEFAULT '{"theme": "light", "fontSize": 16, "lineSpacing": 1.6}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Bookmarks
CREATE TABLE public.book_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.book_chapters(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Highlights
CREATE TABLE public.book_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.book_chapters(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  color TEXT DEFAULT 'yellow',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments/Notes on chapters
CREATE TABLE public.book_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_id UUID NOT NULL REFERENCES public.book_chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position_start INTEGER,
  position_end INTEGER,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reading analytics
CREATE TABLE public.book_reading_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.book_chapters(id) ON DELETE SET NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  pages_read INTEGER DEFAULT 0,
  words_read INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chapter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reading_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for books
CREATE POLICY "Users can view their own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public books" ON public.books FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create their own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chapters
CREATE POLICY "Users can view chapters of their books" ON public.book_chapters FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = book_chapters.book_id AND (books.user_id = auth.uid() OR books.is_public = true)));
CREATE POLICY "Users can create chapters in their books" ON public.book_chapters FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.books WHERE books.id = book_chapters.book_id AND books.user_id = auth.uid()));
CREATE POLICY "Users can update chapters in their books" ON public.book_chapters FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = book_chapters.book_id AND books.user_id = auth.uid()));
CREATE POLICY "Users can delete chapters in their books" ON public.book_chapters FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = book_chapters.book_id AND books.user_id = auth.uid()));

-- RLS Policies for sections
CREATE POLICY "Users can manage sections" ON public.book_sections FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.book_chapters c 
    JOIN public.books b ON b.id = c.book_id 
    WHERE c.id = book_sections.chapter_id AND b.user_id = auth.uid()
  ));

-- RLS Policies for chapter versions
CREATE POLICY "Users can manage chapter versions" ON public.book_chapter_versions FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.book_chapters c 
    JOIN public.books b ON b.id = c.book_id 
    WHERE c.id = book_chapter_versions.chapter_id AND b.user_id = auth.uid()
  ));

-- RLS Policies for assets
CREATE POLICY "Users can manage book assets" ON public.book_assets FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = book_assets.book_id AND books.user_id = auth.uid()));

-- RLS Policies for reading progress
CREATE POLICY "Users can manage their reading progress" ON public.book_reading_progress FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for bookmarks
CREATE POLICY "Users can manage their bookmarks" ON public.book_bookmarks FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for highlights
CREATE POLICY "Users can manage their highlights" ON public.book_highlights FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Users can manage comments on their books" ON public.book_comments FOR ALL 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.book_chapters c 
    JOIN public.books b ON b.id = c.book_id 
    WHERE c.id = book_comments.chapter_id AND b.user_id = auth.uid()
  ));

-- RLS Policies for analytics
CREATE POLICY "Users can manage their reading analytics" ON public.book_reading_analytics FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_book_chapters_book_id ON public.book_chapters(book_id);
CREATE INDEX idx_book_chapters_order ON public.book_chapters(book_id, order_index);
CREATE INDEX idx_book_sections_chapter_id ON public.book_sections(chapter_id);
CREATE INDEX idx_book_reading_progress_user_book ON public.book_reading_progress(user_id, book_id);
CREATE INDEX idx_book_reading_analytics_user ON public.book_reading_analytics(user_id, book_id);

-- Trigger to update book word count when chapters change
CREATE OR REPLACE FUNCTION public.update_book_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.books
  SET 
    word_count = (SELECT COALESCE(SUM(word_count), 0) FROM public.book_chapters WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
    reading_time_minutes = (SELECT COALESCE(SUM(reading_time_minutes), 0) FROM public.book_chapters WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_book_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.book_chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_book_stats();

-- Trigger to update chapter timestamps
CREATE TRIGGER update_book_chapters_updated_at
BEFORE UPDATE ON public.book_chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for book assets
INSERT INTO storage.buckets (id, name, public) VALUES ('book-assets', 'book-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload book assets" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'book-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view book assets" ON storage.objects FOR SELECT 
USING (bucket_id = 'book-assets');

CREATE POLICY "Users can update their book assets" ON storage.objects FOR UPDATE 
USING (bucket_id = 'book-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their book assets" ON storage.objects FOR DELETE 
USING (bucket_id = 'book-assets' AND auth.uid()::text = (storage.foldername(name))[1]);