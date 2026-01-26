-- Add NoteflowLM generation type to usage_tracking
ALTER TABLE public.usage_tracking 
DROP CONSTRAINT IF EXISTS usage_tracking_usage_type_check;

ALTER TABLE public.usage_tracking 
ADD CONSTRAINT usage_tracking_usage_type_check 
CHECK (usage_type IN ('gmail_import', 'ai_parsing', 'ocr_scan', 'export', 'noteflowlm_generation'));

-- Add NoteflowLM limits to plan_limits table
ALTER TABLE public.plan_limits 
ADD COLUMN IF NOT EXISTS noteflowlm_generations_per_day INTEGER DEFAULT 5;

-- Update existing plan limits with NoteflowLM daily limits
UPDATE public.plan_limits SET noteflowlm_generations_per_day = 5 WHERE plan_type = 'free';
UPDATE public.plan_limits SET noteflowlm_generations_per_day = 12 WHERE plan_type = 'pro';
UPDATE public.plan_limits SET noteflowlm_generations_per_day = 20 WHERE plan_type = 'premium';

-- Create a NoteflowLM generations table to track daily usage
CREATE TABLE IF NOT EXISTS public.noteflowlm_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('image', 'slides', 'infographic', 'video')),
  generation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note_id UUID,
  note_title TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('private', 'public')),
  custom_prompt TEXT,
  result_summary TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.noteflowlm_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own generations"
  ON public.noteflowlm_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
  ON public.noteflowlm_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient daily count queries
CREATE INDEX IF NOT EXISTS idx_noteflowlm_generations_user_date 
  ON public.noteflowlm_generations(user_id, generation_date);