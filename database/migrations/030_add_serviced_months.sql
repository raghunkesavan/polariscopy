-- Add serviced_months to quote results tables for BTL and Bridge
-- Computes to initial_term - rolled_months at write time in API; column stores value for reporting.

BEGIN;

-- BTL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_results' AND column_name = 'serviced_months'
  ) THEN
    ALTER TABLE public.quote_results ADD COLUMN serviced_months integer;
  END IF;
END $$;

-- Bridge
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bridge_quote_results' AND column_name = 'serviced_months'
  ) THEN
    ALTER TABLE public.bridge_quote_results ADD COLUMN serviced_months integer;
  END IF;
END $$;

COMMIT;
