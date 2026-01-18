-- Add color column to notes table for sticky note colors
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS color text DEFAULT NULL;

-- Add index for quick_note type queries (common filter)
CREATE INDEX IF NOT EXISTS idx_notes_type_archived ON public.notes(type, is_archived);
