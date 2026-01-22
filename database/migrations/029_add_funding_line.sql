-- Migration 029: Add funding_line field
-- Date: 2026-01-06
-- Purpose: Add funding_line column to quotes and bridge_quotes tables to store selected funding line for DIP

-- Add funding_line column to quotes table (BTL)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS funding_line TEXT;

-- Add funding_line column to bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes
ADD COLUMN IF NOT EXISTS funding_line TEXT;

-- Add comments for documentation
COMMENT ON COLUMN quotes.funding_line IS 'Selected funding line for the quote (e.g., Standard, Prime, Development)';
COMMENT ON COLUMN bridge_quotes.funding_line IS 'Selected funding line for the quote (e.g., Standard, Prime, Development)';
