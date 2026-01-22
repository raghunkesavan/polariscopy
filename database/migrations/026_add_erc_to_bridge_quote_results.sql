-- Migration 026: Add ERC (Early Repayment Charge) columns to bridge_quote_results table
-- These columns store the calculated ERC amounts in pounds for Fusion products

-- Add erc_1_pounds column (Early Repayment Charge Year 1 in £)
ALTER TABLE bridge_quote_results
ADD COLUMN IF NOT EXISTS erc_1_pounds NUMERIC(12,2) DEFAULT NULL;

-- Add erc_2_pounds column (Early Repayment Charge Year 2 in £)
ALTER TABLE bridge_quote_results
ADD COLUMN IF NOT EXISTS erc_2_pounds NUMERIC(12,2) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bridge_quote_results.erc_1_pounds IS 'Early Repayment Charge for year 1 in GBP (Fusion products only): Gross Loan × ERC 1 %';
COMMENT ON COLUMN bridge_quote_results.erc_2_pounds IS 'Early Repayment Charge for year 2 in GBP (Fusion products only): Gross Loan × ERC 2 %';
