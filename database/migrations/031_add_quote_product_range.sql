-- Add quote_product_range to quotes and bridge_quotes
-- Purpose: Store which product range (Core/Specialist) was chosen when issuing a quote
-- Date: 2025-12-01

BEGIN;

-- BTL quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'quote_product_range'
  ) THEN
    ALTER TABLE public.quotes ADD COLUMN quote_product_range TEXT;
    COMMENT ON COLUMN public.quotes.quote_product_range IS 'Selected product range for issued quote (e.g., core, specialist)';
  END IF;
END $$;

-- Bridging quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bridge_quotes' AND column_name = 'quote_product_range'
  ) THEN
    ALTER TABLE public.bridge_quotes ADD COLUMN quote_product_range TEXT;
    COMMENT ON COLUMN public.bridge_quotes.quote_product_range IS 'Selected product range for issued quote (e.g., core, specialist)';
  END IF;
END $$;

COMMIT;
