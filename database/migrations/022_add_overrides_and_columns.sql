-- Migration: Add override fields and per-column settings to quotes table
-- These fields store user edits to rates, product fees, rolled months, and deferred interest

-- Add columns to store overrides as JSON
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS rates_overrides jsonb,
ADD COLUMN IF NOT EXISTS product_fee_overrides jsonb,
ADD COLUMN IF NOT EXISTS rolled_months_per_column jsonb,
ADD COLUMN IF NOT EXISTS deferred_interest_per_column jsonb;

-- Add comments for documentation
COMMENT ON COLUMN quotes.rates_overrides IS 'User-edited rate values by column key (e.g., {"rate_123": "5.5"})';
COMMENT ON COLUMN quotes.product_fee_overrides IS 'User-edited product fee values by column key (e.g., {"rate_123": "2.0"})';
COMMENT ON COLUMN quotes.rolled_months_per_column IS 'Manual rolled months values by column key (e.g., {"rate_123": 6})';
COMMENT ON COLUMN quotes.deferred_interest_per_column IS 'Manual deferred interest % values by column key (e.g., {"rate_123": 0.45})';

-- Add indexes for JSON columns for faster queries
CREATE INDEX IF NOT EXISTS idx_quotes_rates_overrides ON quotes USING GIN (rates_overrides);
CREATE INDEX IF NOT EXISTS idx_quotes_product_fee_overrides ON quotes USING GIN (product_fee_overrides);
