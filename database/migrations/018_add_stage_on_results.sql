-- Add stage column to results tables to distinguish QUOTE vs DIP rows
-- Design goals:
--  - Backward compatible: defaults to 'QUOTE' so existing code keeps working
--  - Safe: use IF NOT EXISTS patterns and guard rails to avoid breaking deploys
--  - Constraints added only where they cannot conflict with current data

-- ===================== BTL quote_results =====================
ALTER TABLE IF EXISTS public.quote_results
  ADD COLUMN IF NOT EXISTS stage TEXT;

-- Set default and backfill nulls to 'QUOTE' (non-breaking; preserves current behavior)
ALTER TABLE IF EXISTS public.quote_results
  ALTER COLUMN stage SET DEFAULT 'QUOTE';

UPDATE public.quote_results SET stage = 'QUOTE' WHERE stage IS NULL;

-- Add a CHECK constraint for valid values if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quote_results_stage_check'
      AND conrelid = 'public.quote_results'::regclass
  ) THEN
    ALTER TABLE public.quote_results
      ADD CONSTRAINT quote_results_stage_check CHECK (stage IN ('QUOTE','DIP'));
  END IF;
END $$;

-- Exactly one DIP row per quote (safe: currently no DIP rows exist)
CREATE UNIQUE INDEX IF NOT EXISTS uq_quote_results_dip_one_per_quote
  ON public.quote_results (quote_id)
  WHERE stage = 'DIP';

-- Performance index for QUOTE rows by (quote_id, fee_column) without enforcing uniqueness yet
CREATE INDEX IF NOT EXISTS ix_quote_results_quote_fee
  ON public.quote_results (quote_id, fee_column)
  WHERE stage = 'QUOTE';


-- ===================== Bridging bridge_quote_results =====================
ALTER TABLE IF EXISTS public.bridge_quote_results
  ADD COLUMN IF NOT EXISTS stage TEXT;

ALTER TABLE IF EXISTS public.bridge_quote_results
  ALTER COLUMN stage SET DEFAULT 'QUOTE';

UPDATE public.bridge_quote_results SET stage = 'QUOTE' WHERE stage IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bridge_quote_results_stage_check'
      AND conrelid = 'public.bridge_quote_results'::regclass
  ) THEN
    ALTER TABLE public.bridge_quote_results
      ADD CONSTRAINT bridge_quote_results_stage_check CHECK (stage IN ('QUOTE','DIP'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bridge_results_dip_one_per_quote
  ON public.bridge_quote_results (quote_id)
  WHERE stage = 'DIP';

CREATE INDEX IF NOT EXISTS ix_bridge_results_quote_fee
  ON public.bridge_quote_results (quote_id, fee_column)
  WHERE stage = 'QUOTE';

-- Notes:
-- 1) We intentionally do NOT enforce uniqueness on (quote_id, fee_column) for QUOTE rows yet
--    to avoid breaking deployments if historical duplicates exist. Once the data is clean,
--    this can be tightened to a UNIQUE index with a follow-up migration.
-- 2) The DIP unique indexes are safe now as no rows have stage='DIP'.
-- 3) Existing app code continues to work because stage defaults to 'QUOTE'.
