-- Migration 025: Add ERC (Early Repayment Charge) columns to bridge_fusion_rates_full table
-- These columns store the ERC percentages for Fusion products
-- ERC 1 applies to year 1, ERC 2 applies to year 2

-- Add erc_1 column (Early Repayment Charge Year 1 percentage)
ALTER TABLE bridge_fusion_rates_full
ADD COLUMN IF NOT EXISTS erc_1 NUMERIC(5,2) DEFAULT NULL;

-- Add erc_2 column (Early Repayment Charge Year 2 percentage)
ALTER TABLE bridge_fusion_rates_full
ADD COLUMN IF NOT EXISTS erc_2 NUMERIC(5,2) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bridge_fusion_rates_full.erc_1 IS 'Early Repayment Charge percentage for year 1 (Fusion products only)';
COMMENT ON COLUMN bridge_fusion_rates_full.erc_2 IS 'Early Repayment Charge percentage for year 2 (Fusion products only)';

-- Update existing Fusion rates with default ERC values
-- ERC 1 = 3%, ERC 2 = 1.5%
UPDATE bridge_fusion_rates_full
SET erc_1 = 3.00, erc_2 = 1.50
WHERE set_key = 'Fusion' OR set_key ILIKE '%fusion%';
