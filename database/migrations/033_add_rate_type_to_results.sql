-- Add rate_type column to quote results tables
-- Purpose: Store the rate type (Core/Specialist) for filtering and display
-- This is a backup/alias for product_range to ensure compatibility
-- Date: 2025-12-01

BEGIN;

-- BTL quote results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_results' AND column_name = 'rate_type'
  ) THEN
    ALTER TABLE public.quote_results ADD COLUMN rate_type TEXT;
    COMMENT ON COLUMN public.quote_results.rate_type IS 'Rate type/range (Core, Specialist) - backup field for product_range';
  END IF;
END $$;

-- Bridge quote results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bridge_quote_results' AND column_name = 'rate_type'
  ) THEN
    ALTER TABLE public.bridge_quote_results ADD COLUMN rate_type TEXT;
    COMMENT ON COLUMN public.bridge_quote_results.rate_type IS 'Rate type/range - backup field for product_range';
  END IF;
END $$;

COMMIT;
