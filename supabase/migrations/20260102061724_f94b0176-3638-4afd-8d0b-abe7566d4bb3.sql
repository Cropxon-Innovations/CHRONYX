-- Create subject_colors table for user-configurable subject colors
CREATE TABLE public.subject_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, subject)
);

-- Enable RLS
ALTER TABLE public.subject_colors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own subject colors" 
ON public.subject_colors FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subject colors" 
ON public.subject_colors FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subject colors" 
ON public.subject_colors FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subject colors" 
ON public.subject_colors FOR DELETE USING (auth.uid() = user_id);

-- Create study_goals table for weekly targets
CREATE TABLE public.study_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  target_hours_weekly INTEGER NOT NULL DEFAULT 10,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own study goals" 
ON public.study_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study goals" 
ON public.study_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study goals" 
ON public.study_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study goals" 
ON public.study_goals FOR DELETE USING (auth.uid() = user_id);

-- Create syllabus_topics table for parsed syllabus content
CREATE TABLE public.syllabus_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  estimated_hours NUMERIC(5,2) DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 1,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own syllabus topics" 
ON public.syllabus_topics FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus topics" 
ON public.syllabus_topics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus topics" 
ON public.syllabus_topics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus topics" 
ON public.syllabus_topics FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for syllabus files
INSERT INTO storage.buckets (id, name, public) VALUES ('syllabus', 'syllabus', false);

-- Storage policies
CREATE POLICY "Users can upload their own syllabus" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'syllabus' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own syllabus" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'syllabus' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own syllabus" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'syllabus' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update triggers
CREATE TRIGGER update_subject_colors_updated_at
BEFORE UPDATE ON public.subject_colors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_goals_updated_at
BEFORE UPDATE ON public.study_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_syllabus_topics_updated_at
BEFORE UPDATE ON public.syllabus_topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();