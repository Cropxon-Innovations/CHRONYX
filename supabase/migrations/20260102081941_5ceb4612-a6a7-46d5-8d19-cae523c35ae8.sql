-- Create savings_goals table for tracking financial targets
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own savings goals"
ON public.savings_goals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings goals"
ON public.savings_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals"
ON public.savings_goals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals"
ON public.savings_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_savings_goals_updated_at
BEFORE UPDATE ON public.savings_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create weekly_study_schedule table for study planning
CREATE TABLE public.weekly_study_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_study_schedule ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own study schedule"
ON public.weekly_study_schedule
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study schedule"
ON public.weekly_study_schedule
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study schedule"
ON public.weekly_study_schedule
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study schedule"
ON public.weekly_study_schedule
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weekly_study_schedule_updated_at
BEFORE UPDATE ON public.weekly_study_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();