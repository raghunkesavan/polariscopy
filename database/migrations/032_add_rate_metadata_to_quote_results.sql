-- Add complete rate metadata fields to quote_results tables for historical accuracy
-- These fields ensure quotes can be reproduced even after rates change
-- Stores a complete snapshot of the rate at the time the quote was created

-- Add fields to quote_results (BTL)
ALTER TABLE quote_results 
  ADD COLUMN IF NOT EXISTS initial_term INTEGER,
  ADD COLUMN IF NOT EXISTS full_term INTEGER,
  ADD COLUMN IF NOT EXISTS revert_rate_type TEXT,
  ADD COLUMN IF NOT EXISTS product_range TEXT,
  ADD COLUMN IF NOT EXISTS rate_id TEXT,
  ADD COLUMN IF NOT EXISTS revert_index TEXT,
  ADD COLUMN IF NOT EXISTS revert_margin NUMERIC,
  ADD COLUMN IF NOT EXISTS min_loan NUMERIC,
  ADD COLUMN IF NOT EXISTS max_loan NUMERIC,
  ADD COLUMN IF NOT EXISTS min_ltv NUMERIC,
  ADD COLUMN IF NOT EXISTS max_ltv NUMERIC,
  ADD COLUMN IF NOT EXISTS max_rolled_months INTEGER,
  ADD COLUMN IF NOT EXISTS max_defer_int NUMERIC,
  ADD COLUMN IF NOT EXISTS min_icr NUMERIC,
  ADD COLUMN IF NOT EXISTS tracker_flag BOOLEAN,
  ADD COLUMN IF NOT EXISTS max_top_slicing NUMERIC,
  ADD COLUMN IF NOT EXISTS admin_fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS erc_1 NUMERIC,
  ADD COLUMN IF NOT EXISTS erc_2 NUMERIC,
  ADD COLUMN IF NOT EXISTS erc_3 NUMERIC,
  ADD COLUMN IF NOT EXISTS erc_4 NUMERIC,
  ADD COLUMN IF NOT EXISTS erc_5 NUMERIC,
  ADD COLUMN IF NOT EXISTS rate_status TEXT,
  ADD COLUMN IF NOT EXISTS floor_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS proc_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS property_type TEXT,
  ADD COLUMN IF NOT EXISTS retention_type TEXT,
  ADD COLUMN IF NOT EXISTS rate_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS product_fee_saved NUMERIC;

-- Add fields to bridge_quote_results (Bridging)
ALTER TABLE bridge_quote_results 
  ADD COLUMN IF NOT EXISTS initial_term INTEGER,
  ADD COLUMN IF NOT EXISTS full_term INTEGER,
  ADD COLUMN IF NOT EXISTS revert_rate_type TEXT,
  ADD COLUMN IF NOT EXISTS product_range TEXT,
  ADD COLUMN IF NOT EXISTS rate_id TEXT,
  ADD COLUMN IF NOT EXISTS min_term INTEGER,
  ADD COLUMN IF NOT EXISTS max_term INTEGER,
  ADD COLUMN IF NOT EXISTS min_rolled INTEGER,
  ADD COLUMN IF NOT EXISTS max_rolled INTEGER,
  ADD COLUMN IF NOT EXISTS min_loan NUMERIC,
  ADD COLUMN IF NOT EXISTS max_loan NUMERIC,
  ADD COLUMN IF NOT EXISTS min_ltv NUMERIC,
  ADD COLUMN IF NOT EXISTS max_ltv NUMERIC,
  ADD COLUMN IF NOT EXISTS min_icr NUMERIC,
  ADD COLUMN IF NOT EXISTS max_defer NUMERIC,
  ADD COLUMN IF NOT EXISTS erc_1_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS erc_2_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS rate_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS product_fee_saved NUMERIC,
  ADD COLUMN IF NOT EXISTS charge_type TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS product TEXT,
  ADD COLUMN IF NOT EXISTS property_type TEXT,
  ADD COLUMN IF NOT EXISTS rate_status TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT;

-- Add comments for documentation
COMMENT ON COLUMN quote_results.initial_term IS 'Initial fixed rate term in months (e.g., 24 for 2-year fixed)';
COMMENT ON COLUMN quote_results.full_term IS 'Full loan term in months (e.g., 300 for 25-year mortgage)';
COMMENT ON COLUMN quote_results.revert_rate_type IS 'Revert rate type (e.g., MVR, SVR, or specific rate)';
COMMENT ON COLUMN quote_results.product_range IS 'Product range/tier (e.g., Core, Specialist, Bridge)';
COMMENT ON COLUMN quote_results.rate_id IS 'Reference to the original rate in the rates table';
COMMENT ON COLUMN quote_results.max_ltv IS 'Maximum LTV allowed by this rate';
COMMENT ON COLUMN quote_results.min_ltv IS 'Minimum LTV required by this rate';
COMMENT ON COLUMN quote_results.tier IS 'Tier/tier name for this rate';
COMMENT ON COLUMN quote_results.retention_type IS 'Retention type (Yes/No/Any)';
COMMENT ON COLUMN quote_results.property_type IS 'Property type for this rate';
COMMENT ON COLUMN quote_results.rate_percent IS 'Base rate percentage from rates table';
COMMENT ON COLUMN quote_results.product_fee_saved IS 'Product fee percentage from rates table';

COMMENT ON COLUMN bridge_quote_results.initial_term IS 'Initial fixed rate term in months';
COMMENT ON COLUMN bridge_quote_results.full_term IS 'Full loan term in months';
COMMENT ON COLUMN bridge_quote_results.revert_rate_type IS 'Revert rate type (e.g., MVR, SVR)';
COMMENT ON COLUMN bridge_quote_results.product_range IS 'Product range/tier (e.g., Bridge, Fusion)';
COMMENT ON COLUMN bridge_quote_results.rate_id IS 'Reference to the original rate in the rates table';
COMMENT ON COLUMN bridge_quote_results.min_term IS 'Minimum term in months';
COMMENT ON COLUMN bridge_quote_results.max_term IS 'Maximum term in months';
COMMENT ON COLUMN bridge_quote_results.min_rolled IS 'Minimum rolled months allowed';
COMMENT ON COLUMN bridge_quote_results.max_rolled IS 'Maximum rolled months allowed';
COMMENT ON COLUMN bridge_quote_results.min_loan IS 'Minimum loan amount';
COMMENT ON COLUMN bridge_quote_results.max_loan IS 'Maximum loan amount';
COMMENT ON COLUMN bridge_quote_results.min_ltv IS 'Minimum LTV percentage';
COMMENT ON COLUMN bridge_quote_results.max_ltv IS 'Maximum LTV percentage';
COMMENT ON COLUMN bridge_quote_results.min_icr IS 'Minimum ICR required';
COMMENT ON COLUMN bridge_quote_results.max_defer IS 'Maximum deferred interest percentage';
COMMENT ON COLUMN bridge_quote_results.erc_1_percent IS 'ERC 1 percentage';
COMMENT ON COLUMN bridge_quote_results.erc_2_percent IS 'ERC 2 percentage';
COMMENT ON COLUMN bridge_quote_results.rate_percent IS 'Base rate percentage from rates table';
COMMENT ON COLUMN bridge_quote_results.product_fee_saved IS 'Product fee percentage from rates table';
COMMENT ON COLUMN bridge_quote_results.charge_type IS 'Charge type (First/Second)';
COMMENT ON COLUMN bridge_quote_results.type IS 'Rate type (Fixed/Variable/Fusion)';
COMMENT ON COLUMN bridge_quote_results.product IS 'Product name';
COMMENT ON COLUMN bridge_quote_results.property_type IS 'Property type for this rate';
