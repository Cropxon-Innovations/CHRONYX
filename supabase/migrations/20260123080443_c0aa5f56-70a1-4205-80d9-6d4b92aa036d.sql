-- Add is_archived column to library_items
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;