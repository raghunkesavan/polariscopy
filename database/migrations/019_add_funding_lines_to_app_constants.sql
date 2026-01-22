-- Add funding_lines columns to app_constants so funding line options can be persisted
-- Adds separate JSONB columns for BTL and Bridge funding lines
-- Also adds funding_line column to quotes and bridge_quotes tables to store selected values

BEGIN;

-- Add structured columns to app_constants for both BTL and Bridge funding lines
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS funding_lines_btl JSONB;
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS funding_lines_bridge JSONB;

COMMENT ON COLUMN app_constants.funding_lines_btl IS 'List of funding line display names for BTL DIP UI (JSON array)';
COMMENT ON COLUMN app_constants.funding_lines_bridge IS 'List of funding line display names for Bridge DIP UI (JSON array)';

-- Insert or update the canonical app.constants row with default funding_lines values
INSERT INTO app_constants (key, funding_lines_btl, funding_lines_bridge)
VALUES (
  'app.constants',
  '["Main Lending Line","Bridge Facility","Development Line","Specialist Line"]'::jsonb,
  '["Main Lending Line","Bridge Facility","Development Line","Specialist Line"]'::jsonb
)
ON CONFLICT (key) DO UPDATE 
SET 
  funding_lines_btl = CASE 
    WHEN app_constants.funding_lines_btl IS NULL THEN EXCLUDED.funding_lines_btl 
    ELSE app_constants.funding_lines_btl 
  END,
  funding_lines_bridge = CASE 
    WHEN app_constants.funding_lines_bridge IS NULL THEN EXCLUDED.funding_lines_bridge 
    ELSE app_constants.funding_lines_bridge 
  END;

-- Backfill from legacy value JSON if present (for BTL)
UPDATE app_constants
SET funding_lines_btl = (value -> 'fundingLines')::jsonb
WHERE funding_lines_btl IS NULL
  AND value IS NOT NULL
  AND (value ? 'fundingLines');

-- Add funding_line column to quotes table (BTL)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS funding_line TEXT;
COMMENT ON COLUMN quotes.funding_line IS 'Selected funding line for this BTL quote';

-- Add funding_line column to bridge_quotes table (Bridge)
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS funding_line TEXT;
COMMENT ON COLUMN bridge_quotes.funding_line IS 'Selected funding line for this Bridge quote';

COMMIT;
