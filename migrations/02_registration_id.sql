-- migrations/02_registration_id.sql
-- Adds a human-readable registration id (AVNL-YYYY-NNNN) and backfills existing rows.
-- Safe to re-run (uses IF NOT EXISTS / DO blocks where possible).

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS registration_id TEXT;

-- Backfill: assign a sequential id to any existing rows ordered by created_at.
DO $$
DECLARE
    rec RECORD;
    seq INT := 0;
    current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
    new_id TEXT;
BEGIN
    FOR rec IN
        SELECT id FROM public.students
        WHERE registration_id IS NULL
        ORDER BY created_at ASC
    LOOP
        seq := seq + 1;
        new_id := 'AVNL-' || current_year || '-' || lpad(seq::TEXT, 4, '0');
        UPDATE public.students SET registration_id = new_id WHERE id = rec.id;
    END LOOP;
END $$;

-- Now enforce uniqueness and not-null.
ALTER TABLE public.students
ALTER COLUMN registration_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_registration_id'
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT unique_registration_id UNIQUE (registration_id);
    END IF;
END $$;
