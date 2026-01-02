-- Add planned_duration column to study_logs for planned vs actual tracking
ALTER TABLE public.study_logs 
ADD COLUMN IF NOT EXISTS planned_duration integer DEFAULT NULL;

-- Add timer_started_at and timer_ended_at for timer tracking
ALTER TABLE public.study_logs 
ADD COLUMN IF NOT EXISTS timer_started_at timestamp with time zone DEFAULT NULL;

ALTER TABLE public.study_logs 
ADD COLUMN IF NOT EXISTS timer_ended_at timestamp with time zone DEFAULT NULL;

-- Add is_timer_session to differentiate timer-based entries
ALTER TABLE public.study_logs 
ADD COLUMN IF NOT EXISTS is_timer_session boolean DEFAULT false;