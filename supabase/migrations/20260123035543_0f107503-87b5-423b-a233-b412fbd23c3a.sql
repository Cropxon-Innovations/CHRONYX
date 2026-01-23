-- Create study_subjects table for custom user subjects with icons
CREATE TABLE IF NOT EXISTS public.study_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📚',
  color TEXT NOT NULL DEFAULT '#6366F1',
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subjects" ON public.study_subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subjects" ON public.study_subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subjects" ON public.study_subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subjects" ON public.study_subjects FOR DELETE USING (auth.uid() = user_id);

-- Create study_chapters table
CREATE TABLE IF NOT EXISTS public.study_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.study_subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chapters" ON public.study_chapters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chapters" ON public.study_chapters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chapters" ON public.study_chapters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chapters" ON public.study_chapters FOR DELETE USING (auth.uid() = user_id);

-- Create study_modules table
CREATE TABLE IF NOT EXISTS public.study_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chapter_id UUID NOT NULL REFERENCES public.study_chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own modules" ON public.study_modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own modules" ON public.study_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own modules" ON public.study_modules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own modules" ON public.study_modules FOR DELETE USING (auth.uid() = user_id);

-- Add module_id to syllabus_topics if not exists (already exists based on schema)
-- Add chapter_id reference
ALTER TABLE public.syllabus_topics ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.study_chapters(id) ON DELETE SET NULL;
ALTER TABLE public.syllabus_topics ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.study_subjects(id) ON DELETE SET NULL;

-- Add category to todos for linking
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS linked_topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL;