-- Create chapter_summaries table for AI-generated summaries
CREATE TABLE public.chapter_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  summary_type TEXT NOT NULL DEFAULT 'short' CHECK (summary_type IN ('short', 'detailed', 'study')),
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vocabulary table for saved words
CREATE TABLE public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  phonetic TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  translation_language TEXT,
  translation_text TEXT,
  synonyms TEXT[],
  antonyms TEXT[],
  examples JSONB DEFAULT '[]'::jsonb,
  source_type TEXT DEFAULT 'study_reader' CHECK (source_type IN ('study_reader', 'notes', 'document')),
  source_ref_id UUID,
  lookup_count INTEGER DEFAULT 1,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study_explanations table for paragraph explanations
CREATE TABLE public.study_explanations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  library_item_id UUID REFERENCES public.library_items(id) ON DELETE CASCADE,
  chapter_index INTEGER,
  paragraph_hash TEXT,
  original_text TEXT NOT NULL,
  explanation_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chapter_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_explanations ENABLE ROW LEVEL SECURITY;

-- RLS policies for chapter_summaries
CREATE POLICY "Users can view their own summaries" ON public.chapter_summaries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own summaries" ON public.chapter_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own summaries" ON public.chapter_summaries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own summaries" ON public.chapter_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for vocabulary
CREATE POLICY "Users can view their own vocabulary" ON public.vocabulary
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own vocabulary" ON public.vocabulary
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vocabulary" ON public.vocabulary
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vocabulary" ON public.vocabulary
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for study_explanations
CREATE POLICY "Users can view their own explanations" ON public.study_explanations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own explanations" ON public.study_explanations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own explanations" ON public.study_explanations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_chapter_summaries_user ON public.chapter_summaries(user_id);
CREATE INDEX idx_chapter_summaries_item ON public.chapter_summaries(library_item_id);
CREATE INDEX idx_vocabulary_user ON public.vocabulary(user_id);
CREATE INDEX idx_vocabulary_word ON public.vocabulary(user_id, word);
CREATE INDEX idx_study_explanations_user ON public.study_explanations(user_id);

-- Update trigger for chapter_summaries
CREATE TRIGGER update_chapter_summaries_updated_at
  BEFORE UPDATE ON public.chapter_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();