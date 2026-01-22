-- Migration 028: Add DIP extended fields (title_number, company_number, shareholders)
-- Date: 2026-01-06
-- Purpose: Add fields for company information and shareholders to support enhanced DIP generation

-- Add columns to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS title_number TEXT,
ADD COLUMN IF NOT EXISTS company_number TEXT,
ADD COLUMN IF NOT EXISTS shareholders JSONB DEFAULT '[]'::jsonb;

-- Add columns to bridge_quotes table
ALTER TABLE bridge_quotes
ADD COLUMN IF NOT EXISTS title_number TEXT,
ADD COLUMN IF NOT EXISTS company_number TEXT,
ADD COLUMN IF NOT EXISTS shareholders JSONB DEFAULT '[]'::jsonb;

-- Add indexes for JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_shareholders ON quotes USING gin(shareholders);
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_shareholders ON bridge_quotes USING gin(shareholders);

-- Add comments for documentation
COMMENT ON COLUMN quotes.title_number IS 'Property title number for DIP document';
COMMENT ON COLUMN quotes.company_number IS 'Company registration number (for Corporate borrowers)';
COMMENT ON COLUMN quotes.shareholders IS 'Array of shareholder names for Corporate borrowers (JSONB format: [{"name": "John Doe"}, ...])';

COMMENT ON COLUMN bridge_quotes.title_number IS 'Property title number for DIP document';
COMMENT ON COLUMN bridge_quotes.company_number IS 'Company registration number (for Corporate borrowers)';
COMMENT ON COLUMN bridge_quotes.shareholders IS 'Array of shareholder names for Corporate borrowers (JSONB format: [{"name": "John Doe"}, ...])';
