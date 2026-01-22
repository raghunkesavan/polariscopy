-- Migration: Add comprehensive Bridge & Fusion calculation fields
-- Purpose: Store all calculated values from bridgeFusionCalculationEngine.js
-- Related to: Integration folder formulas implementation

-- Add fields to bridge_quote_results table
ALTER TABLE bridge_quote_results
  -- Interest component fields
  ADD COLUMN IF NOT EXISTS rolled_interest_coupon NUMERIC,
  ADD COLUMN IF NOT EXISTS rolled_interest_bbr NUMERIC,
  ADD COLUMN IF NOT EXISTS deferred_interest NUMERIC,
  ADD COLUMN IF NOT EXISTS serviced_interest NUMERIC,
  ADD COLUMN IF NOT EXISTS total_interest NUMERIC,
  
  -- APR/APRC fields
  ADD COLUMN IF NOT EXISTS aprc_annual NUMERIC,
  ADD COLUMN IF NOT EXISTS aprc_monthly NUMERIC,
  ADD COLUMN IF NOT EXISTS total_amount_repayable NUMERIC,
  
  -- Payment fields
  ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC,
  ADD COLUMN IF NOT EXISTS direct_debit NUMERIC,
  
  -- Rate fields
  ADD COLUMN IF NOT EXISTS full_annual_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS full_rate_monthly NUMERIC,
  ADD COLUMN IF NOT EXISTS full_coupon_rate_monthly NUMERIC,
  ADD COLUMN IF NOT EXISTS margin_monthly NUMERIC,
  ADD COLUMN IF NOT EXISTS bbr_monthly NUMERIC,
  ADD COLUMN IF NOT EXISTS deferred_interest_rate NUMERIC,
  
  -- Term fields
  ADD COLUMN IF NOT EXISTS term_months INTEGER,
  ADD COLUMN IF NOT EXISTS rolled_months INTEGER,
  ADD COLUMN IF NOT EXISTS serviced_months INTEGER,
  
  -- Product identification
  ADD COLUMN IF NOT EXISTS tier_name TEXT,
  ADD COLUMN IF NOT EXISTS product_kind TEXT,
  
  -- LTV fields
  ADD COLUMN IF NOT EXISTS ltv_bucket INTEGER,
  ADD COLUMN IF NOT EXISTS gross_ltv NUMERIC,
  ADD COLUMN IF NOT EXISTS net_ltv NUMERIC,
  
  -- Fee breakdown fields
  ADD COLUMN IF NOT EXISTS arrangement_fee_gbp NUMERIC,
  ADD COLUMN IF NOT EXISTS arrangement_fee_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS admin_fee NUMERIC;

-- Add comments to document field purposes
COMMENT ON COLUMN bridge_quote_results.rolled_interest_coupon IS 'Interest rolled into loan (coupon/margin portion only)';
COMMENT ON COLUMN bridge_quote_results.rolled_interest_bbr IS 'Interest rolled into loan (BBR portion for variable products)';
COMMENT ON COLUMN bridge_quote_results.deferred_interest IS 'Interest deferred to end of term (Fusion products)';
COMMENT ON COLUMN bridge_quote_results.serviced_interest IS 'Interest paid monthly during serviced period';
COMMENT ON COLUMN bridge_quote_results.total_interest IS 'Total interest over loan term (rolled + deferred + serviced)';
COMMENT ON COLUMN bridge_quote_results.aprc_annual IS 'Annual Percentage Rate of Charge';
COMMENT ON COLUMN bridge_quote_results.aprc_monthly IS 'Monthly APRC rate';
COMMENT ON COLUMN bridge_quote_results.total_amount_repayable IS 'Total amount borrower repays (principal + all interest)';
COMMENT ON COLUMN bridge_quote_results.monthly_payment IS 'Monthly interest payment amount';
COMMENT ON COLUMN bridge_quote_results.direct_debit IS 'Direct debit payment amount (same as monthly_payment)';
COMMENT ON COLUMN bridge_quote_results.full_annual_rate IS 'Full annual rate including BBR (%)';
COMMENT ON COLUMN bridge_quote_results.full_rate_monthly IS 'Full monthly rate including BBR (%)';
COMMENT ON COLUMN bridge_quote_results.full_coupon_rate_monthly IS 'Coupon/margin rate monthly (%)';
COMMENT ON COLUMN bridge_quote_results.margin_monthly IS 'Margin rate monthly for variable products (%)';
COMMENT ON COLUMN bridge_quote_results.bbr_monthly IS 'BBR monthly rate for variable products (%)';
COMMENT ON COLUMN bridge_quote_results.deferred_interest_rate IS 'Deferred interest annual rate (%)';
COMMENT ON COLUMN bridge_quote_results.term_months IS 'Total loan term in months';
COMMENT ON COLUMN bridge_quote_results.rolled_months IS 'Number of months with rolled interest';
COMMENT ON COLUMN bridge_quote_results.serviced_months IS 'Number of months with serviced interest payments';
COMMENT ON COLUMN bridge_quote_results.tier_name IS 'Fusion tier name (Small/Medium/Large) or product name';
COMMENT ON COLUMN bridge_quote_results.product_kind IS 'Product type: bridge-var, bridge-fix, or fusion';
COMMENT ON COLUMN bridge_quote_results.ltv_bucket IS 'LTV bucket used for rate determination (60, 70, or 75)';
COMMENT ON COLUMN bridge_quote_results.gross_ltv IS 'Gross LTV percentage';
COMMENT ON COLUMN bridge_quote_results.net_ltv IS 'Net LTV percentage';
COMMENT ON COLUMN bridge_quote_results.arrangement_fee_gbp IS 'Arrangement fee amount in GBP';
COMMENT ON COLUMN bridge_quote_results.arrangement_fee_pct IS 'Arrangement fee percentage';
COMMENT ON COLUMN bridge_quote_results.admin_fee IS 'Admin fee amount';

-- Create index on product_kind for filtering
CREATE INDEX IF NOT EXISTS idx_bridge_results_product_kind ON bridge_quote_results(product_kind);

-- Create index on tier_name for Fusion product filtering
CREATE INDEX IF NOT EXISTS idx_bridge_results_tier_name ON bridge_quote_results(tier_name);
