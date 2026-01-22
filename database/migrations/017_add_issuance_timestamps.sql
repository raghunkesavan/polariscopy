-- Add issuance timestamp columns to BTL and Bridging quotes tables
-- Safe to run multiple times due to IF NOT EXISTS

ALTER TABLE IF EXISTS public.quotes
  ADD COLUMN IF NOT EXISTS dip_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_issued_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.bridge_quotes
  ADD COLUMN IF NOT EXISTS dip_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_issued_at TIMESTAMPTZ;

-- Optional: Backfill logic could be added here if historical statuses exist
-- For now, leave timestamps null until issuance flows set them.
