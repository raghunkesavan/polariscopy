-- Add quote_version to quotes and bridge_quotes
-- Purpose: Track version number that increments each time a quote is issued
-- Date: 2025-12-02

BEGIN;

-- BTL quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'quote_version'
  ) THEN
    ALTER TABLE public.quotes ADD COLUMN quote_version INTEGER DEFAULT 1;
    COMMENT ON COLUMN public.quotes.quote_version IS 'Version number that increments each time quote is issued';
  END IF;
END $$;

-- Bridging quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bridge_quotes' AND column_name = 'quote_version'
  ) THEN
    ALTER TABLE public.bridge_quotes ADD COLUMN quote_version INTEGER DEFAULT 1;
    COMMENT ON COLUMN public.bridge_quotes.quote_version IS 'Version number that increments each time quote is issued';
  END IF;
END $$;

-- Set existing quotes to version 1 if null
UPDATE public.quotes SET quote_version = 1 WHERE quote_version IS NULL;
UPDATE public.bridge_quotes SET quote_version = 1 WHERE quote_version IS NULL;

COMMIT;
