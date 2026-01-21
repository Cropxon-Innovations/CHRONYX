-- Add duration_hours column to todos table for timeline-based task management
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2) DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.todos.duration_hours IS 'Estimated hours to complete the task (max 24 hours per day)';