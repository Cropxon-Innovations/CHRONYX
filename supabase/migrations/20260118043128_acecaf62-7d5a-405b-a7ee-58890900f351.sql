-- Add new columns to notes table for CHRONYX Notes hybrid system
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS content_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS type text DEFAULT 'quick_note',
ADD COLUMN IF NOT EXISTS linked_entities jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private',
ADD COLUMN IF NOT EXISTS emotion text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS date_confidence text DEFAULT 'exact';

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS idx_notes_type ON public.notes(type);

-- Create index for linked_entities JSONB
CREATE INDEX IF NOT EXISTS idx_notes_linked_entities ON public.notes USING gin(linked_entities);

-- Add comment for documentation
COMMENT ON COLUMN public.notes.type IS 'Note type: quick_note, journal, document, finance_note, memory_note, tax_note, story';
COMMENT ON COLUMN public.notes.linked_entities IS 'Array of linked entities like insurances, loans, expenses etc';
COMMENT ON COLUMN public.notes.visibility IS 'Note visibility: private, shared';
COMMENT ON COLUMN public.notes.emotion IS 'Emotion metadata for journal/memory notes';
COMMENT ON COLUMN public.notes.date_confidence IS 'Date confidence: exact, approximate';