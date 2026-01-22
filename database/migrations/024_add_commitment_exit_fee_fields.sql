-- Migration 024: Add commitment_fee and exit_fee_percent to bridge_quotes table
-- These fields store user-entered fees for bridging calculator

-- Add commitment_fee column (flat fee in pounds)
ALTER TABLE bridge_quotes
ADD COLUMN IF NOT EXISTS commitment_fee NUMERIC(12, 2);

-- Add exit_fee_percent column (percentage value)
ALTER TABLE bridge_quotes
ADD COLUMN IF NOT EXISTS exit_fee_percent NUMERIC(5, 2);

-- Add comments
COMMENT ON COLUMN bridge_quotes.commitment_fee IS 'Commitment fee in pounds entered by user';
COMMENT ON COLUMN bridge_quotes.exit_fee_percent IS 'Exit fee as percentage entered by user';
