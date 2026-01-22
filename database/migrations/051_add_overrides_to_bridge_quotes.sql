-- Migration: Add override fields and per-column settings to bridge_quotes table
-- These fields store user edits to rates, product fees, rolled months, and deferred interest
-- This mirrors the columns already present in the quotes table (from migration 022)

-- Add columns to store overrides as JSON
ALTER TABLE bridge_quotes 
ADD COLUMN IF NOT EXISTS rates_overrides jsonb,
ADD COLUMN IF NOT EXISTS product_fee_overrides jsonb,
ADD COLUMN IF NOT EXISTS rolled_months_per_column jsonb,
ADD COLUMN IF NOT EXISTS deferred_interest_per_column jsonb;

-- Add comments for documentation
COMMENT ON COLUMN bridge_quotes.rates_overrides IS 'User-edited rate values by column key (e.g., {"Fusion": "5.5% + BBR", "Fixed Bridge": "0.85%"})';
COMMENT ON COLUMN bridge_quotes.product_fee_overrides IS 'User-edited product fee values by column key (e.g., {"Fusion": "2.0%", "Variable Bridge": "2.5%"})';
COMMENT ON COLUMN bridge_quotes.rolled_months_per_column IS 'Manual rolled months values by column key (e.g., {"Fusion": 6, "Variable Bridge": 3})';
COMMENT ON COLUMN bridge_quotes.deferred_interest_per_column IS 'Manual deferred interest % values by column key (e.g., {"Fusion": 0.45, "Fixed Bridge": 0.50})';

-- Add indexes for JSON columns for faster queries
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_rates_overrides ON bridge_quotes USING GIN (rates_overrides);
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_product_fee_overrides ON bridge_quotes USING GIN (product_fee_overrides);
