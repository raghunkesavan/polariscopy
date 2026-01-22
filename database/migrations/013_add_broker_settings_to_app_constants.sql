-- Add broker settings columns to app_constants table
-- This allows broker routes, commission defaults, and tolerance to persist in the database
-- instead of only in localStorage

ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_routes JSONB;
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_commission_defaults JSONB;
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS broker_commission_tolerance NUMERIC;

-- Add comments for documentation
COMMENT ON COLUMN app_constants.broker_routes IS 'Broker route display names as JSON object (e.g., {"DIRECT_BROKER": "Direct Broker", "MORTGAGE_CLUB": "Mortgage club"})';
COMMENT ON COLUMN app_constants.broker_commission_defaults IS 'Default commission percentages by route name as JSON object (e.g., {"Direct Broker": 0.7, "Mortgage club": 0.9})';
COMMENT ON COLUMN app_constants.broker_commission_tolerance IS 'Allowable deviation from default commission in percentage points (e.g., 0.2 for ±0.2%)';
