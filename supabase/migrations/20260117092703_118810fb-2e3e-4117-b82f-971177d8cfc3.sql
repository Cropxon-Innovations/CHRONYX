-- Add dedupe_hash and needs_review columns for improved deduplication and review flow
ALTER TABLE public.auto_imported_transactions 
ADD COLUMN IF NOT EXISTS dedupe_hash TEXT,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_reason TEXT;

-- Add unique constraint on dedupe_hash per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_auto_imported_transactions_dedupe_hash 
ON public.auto_imported_transactions(user_id, dedupe_hash) 
WHERE dedupe_hash IS NOT NULL;

-- Add index for faster review queries
CREATE INDEX IF NOT EXISTS idx_auto_imported_transactions_needs_review 
ON public.auto_imported_transactions(user_id, needs_review) 
WHERE needs_review = true;