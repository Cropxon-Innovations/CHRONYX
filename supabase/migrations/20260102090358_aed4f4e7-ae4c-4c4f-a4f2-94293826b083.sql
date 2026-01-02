-- Add color and icon columns to memory_folders for customization
ALTER TABLE public.memory_folders 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-accent/30',
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Default';
