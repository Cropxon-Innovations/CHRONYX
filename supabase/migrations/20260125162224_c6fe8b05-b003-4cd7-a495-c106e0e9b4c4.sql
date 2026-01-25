-- Create table for storing cloned template data with full editable content
CREATE TABLE IF NOT EXISTS public.user_template_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_template_id UUID NOT NULL REFERENCES public.user_study_templates(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL DEFAULT '{}',
  custom_subjects JSONB DEFAULT '[]',
  custom_outcomes JSONB DEFAULT '[]',
  is_customized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_template_id)
);

-- Create table for tracking individual section/topic progress (checklist)
CREATE TABLE IF NOT EXISTS public.user_template_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_template_id UUID NOT NULL REFERENCES public.user_study_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL DEFAULT 'topic', -- 'subject', 'chapter', 'topic', 'subtopic'
  parent_section_id UUID REFERENCES public.user_template_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'revised', 'mastered'
  linked_note_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for study timetable/schedule
CREATE TABLE IF NOT EXISTS public.user_study_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_template_id UUID REFERENCES public.user_study_templates(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.user_template_sections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  color TEXT DEFAULT '#3b82f6',
  recurrence_rule TEXT, -- 'daily', 'weekly', 'weekdays', 'custom'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for linking notes to study sections
CREATE TABLE IF NOT EXISTS public.study_section_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.user_template_sections(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.user_study_schedule(id) ON DELETE CASCADE,
  user_template_id UUID REFERENCES public.user_study_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}', -- TipTap JSON content
  note_type TEXT DEFAULT 'general', -- 'general', 'summary', 'flashcard', 'question'
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_template_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_study_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_section_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_template_data
CREATE POLICY "Users can view own template data" ON public.user_template_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own template data" ON public.user_template_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own template data" ON public.user_template_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own template data" ON public.user_template_data FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_template_sections
CREATE POLICY "Users can view own sections" ON public.user_template_sections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sections" ON public.user_template_sections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sections" ON public.user_template_sections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sections" ON public.user_template_sections FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_study_schedule
CREATE POLICY "Users can view own schedule" ON public.user_study_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own schedule" ON public.user_study_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule" ON public.user_study_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule" ON public.user_study_schedule FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_section_notes
CREATE POLICY "Users can view own notes" ON public.study_section_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.study_section_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.study_section_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.study_section_notes FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_template_sections_template ON public.user_template_sections(user_template_id);
CREATE INDEX IF NOT EXISTS idx_user_template_sections_parent ON public.user_template_sections(parent_section_id);
CREATE INDEX IF NOT EXISTS idx_user_study_schedule_date ON public.user_study_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_study_section_notes_section ON public.study_section_notes(section_id);

-- Update trigger for updated_at
CREATE TRIGGER update_user_template_data_updated_at BEFORE UPDATE ON public.user_template_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_template_sections_updated_at BEFORE UPDATE ON public.user_template_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_study_schedule_updated_at BEFORE UPDATE ON public.user_study_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_section_notes_updated_at BEFORE UPDATE ON public.study_section_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();