-- Add priority and recurring fields to todos table
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type text CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', NULL)),
ADD COLUMN IF NOT EXISTS recurrence_days integer[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_recurring_id uuid REFERENCES public.todos(id) ON DELETE SET NULL;

-- Create index for recurring tasks lookup
CREATE INDEX IF NOT EXISTS idx_todos_recurring ON public.todos(is_recurring, recurrence_type) WHERE is_recurring = true;

-- Create index for priority sorting
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);

-- Add syllabus phases table for hierarchical structure
CREATE TABLE IF NOT EXISTS public.syllabus_phases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  syllabus_name text NOT NULL,
  phase_name text NOT NULL,
  phase_order integer DEFAULT 0,
  source_page text,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add syllabus modules table
CREATE TABLE IF NOT EXISTS public.syllabus_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id uuid NOT NULL REFERENCES public.syllabus_phases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  module_name text NOT NULL,
  module_order integer DEFAULT 0,
  source_page text,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  notes text,
  time_spent_minutes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Update syllabus_topics to link to modules
ALTER TABLE public.syllabus_topics 
ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.syllabus_modules(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS source_page text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS time_spent_minutes integer DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.syllabus_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies for syllabus_phases
CREATE POLICY "Users can view their own syllabus phases" 
ON public.syllabus_phases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus phases" 
ON public.syllabus_phases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus phases" 
ON public.syllabus_phases FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus phases" 
ON public.syllabus_phases FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for syllabus_modules
CREATE POLICY "Users can view their own syllabus modules" 
ON public.syllabus_modules FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus modules" 
ON public.syllabus_modules FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus modules" 
ON public.syllabus_modules FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus modules" 
ON public.syllabus_modules FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_syllabus_phases_updated_at
BEFORE UPDATE ON public.syllabus_phases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_syllabus_modules_updated_at
BEFORE UPDATE ON public.syllabus_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();