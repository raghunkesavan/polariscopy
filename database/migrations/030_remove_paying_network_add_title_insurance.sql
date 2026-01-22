-- Migration: Remove paying_network_club and add title_insurance field to quotes tables
-- Date: 2024-11-28

BEGIN;

-- Remove paying_network_club from quotes table (BTL)
ALTER TABLE quotes DROP COLUMN IF EXISTS paying_network_club;

-- Remove paying_network_club from bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes DROP COLUMN IF EXISTS paying_network_club;

-- Add title_insurance column to quotes table (BTL)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS title_insurance TEXT DEFAULT 'No';
COMMENT ON COLUMN quotes.title_insurance IS 'Whether title insurance is included: Yes or No';

-- Add title_insurance column to bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS title_insurance TEXT DEFAULT 'No';
COMMENT ON COLUMN bridge_quotes.title_insurance IS 'Whether title insurance is included: Yes or No';

COMMIT;
