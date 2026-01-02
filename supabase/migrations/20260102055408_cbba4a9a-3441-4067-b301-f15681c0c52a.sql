-- Add topic and focus_level columns to study_logs for enhanced tracking
ALTER TABLE public.study_logs 
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS focus_level text DEFAULT 'medium' CHECK (focus_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger for automatic timestamp updates on study_logs
CREATE TRIGGER update_study_logs_updated_at
BEFORE UPDATE ON public.study_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();