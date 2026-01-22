-- Add minimum slider limit columns to rates tables
-- These columns define the minimum values for interactive sliders in calculators

-- Add to rates_flat table (CSV-imported rates)
ALTER TABLE rates_flat
ADD COLUMN IF NOT EXISTS min_rolled_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_defer_int NUMERIC(5,2) DEFAULT 0;

COMMENT ON COLUMN rates_flat.min_rolled_months IS 'Minimum number of months that can be rolled into the loan';
COMMENT ON COLUMN rates_flat.min_defer_int IS 'Minimum percentage of interest that can be deferred (primarily for Bridge products)';
