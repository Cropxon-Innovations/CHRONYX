-- Add bio fields to profiles table for health information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bio_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add start_time and end_time fields to todos for time range assignment
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.blood_group IS 'Blood group type (A+, A-, B+, B-, AB+, AB-, O+, O-)';
COMMENT ON COLUMN public.profiles.weight_kg IS 'Weight in kilograms';
COMMENT ON COLUMN public.profiles.height_cm IS 'Height in centimeters';
COMMENT ON COLUMN public.profiles.bio_updated_at IS 'When bio details were last updated';
COMMENT ON COLUMN public.todos.start_time IS 'Start time for scheduled tasks';
COMMENT ON COLUMN public.todos.end_time IS 'End time for scheduled tasks';