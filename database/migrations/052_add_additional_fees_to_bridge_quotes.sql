-- Add additional fee fields to bridge_quotes table
-- These fields match the BTL quotes table structure for consistency

-- Add additional fee columns to bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS add_fees_toggle BOOLEAN DEFAULT false;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS fee_calculation_type TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS additional_fee_amount NUMERIC;

-- Add comments for documentation
COMMENT ON COLUMN bridge_quotes.add_fees_toggle IS 'Toggle to enable/disable additional broker fees';
COMMENT ON COLUMN bridge_quotes.fee_calculation_type IS 'Fee calculation type: pound or percent';
COMMENT ON COLUMN bridge_quotes.additional_fee_amount IS 'Additional fee amount (as pounds or percent based on fee_calculation_type)';
