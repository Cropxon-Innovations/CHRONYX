-- Library items table for books, PDFs, documents
CREATE TABLE public.library_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  format TEXT NOT NULL DEFAULT 'pdf', -- 'pdf' | 'epub'
  file_url TEXT NOT NULL,
  cover_url TEXT,
  total_pages INTEGER DEFAULT 0,
  file_size BIGINT,
  is_locked BOOLEAN DEFAULT false,
  lock_hash TEXT,
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reading state/progress tracking
CREATE TABLE public.reading_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  last_page INTEGER DEFAULT 1,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  reading_mode TEXT DEFAULT 'book', -- 'book' | 'document'
  theme TEXT DEFAULT 'day', -- 'day' | 'sepia' | 'night'
  font_size INTEGER DEFAULT 16,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Reading highlights and notes
CREATE TABLE public.reading_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text_snippet TEXT,
  note TEXT,
  color TEXT DEFAULT 'yellow',
  position_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_highlights ENABLE ROW LEVEL SECURITY;

-- RLS policies for library_items
CREATE POLICY "Users can view their own library items" 
ON public.library_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own library items" 
ON public.library_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library items" 
ON public.library_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library items" 
ON public.library_items FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for reading_state
CREATE POLICY "Users can view their own reading state" 
ON public.reading_state FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading state" 
ON public.reading_state FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading state" 
ON public.reading_state FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading state" 
ON public.reading_state FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for reading_highlights
CREATE POLICY "Users can view their own highlights" 
ON public.reading_highlights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights" 
ON public.reading_highlights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" 
ON public.reading_highlights FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" 
ON public.reading_highlights FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_library_items_user ON public.library_items(user_id);
CREATE INDEX idx_reading_state_user_item ON public.reading_state(user_id, item_id);
CREATE INDEX idx_reading_highlights_item ON public.reading_highlights(item_id);

-- Update timestamp trigger
CREATE TRIGGER update_library_items_updated_at
BEFORE UPDATE ON public.library_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_state_updated_at
BEFORE UPDATE ON public.reading_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for library files
INSERT INTO storage.buckets (id, name, public)
VALUES ('library', 'library', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for library bucket
CREATE POLICY "Users can upload their own library files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own library files"
ON storage.objects FOR SELECT
USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own library files"
ON storage.objects FOR DELETE
USING (bucket_id = 'library' AND auth.uid()::text = (storage.foldername(name))[1]);