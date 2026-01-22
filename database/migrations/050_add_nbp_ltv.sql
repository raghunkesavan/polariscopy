-- Migration 050: Add NBP LTV to Quote Results Tables
-- Created: 2025-12-17
-- Description: Adds nbp_ltv column to both quote_results and bridge_quote_results tables
--              NBP LTV = (NBP / Property Value) * 100

-- ============================================================================
-- 1. Add nbp_ltv to quote_results (BTL quotes)
-- ============================================================================
ALTER TABLE quote_results 
ADD COLUMN IF NOT EXISTS nbp_ltv NUMERIC;

COMMENT ON COLUMN quote_results.nbp_ltv IS 'NBP LTV percentage: (NBP / Property Value) * 100';

-- ============================================================================
-- 2. Add nbp_ltv to bridge_quote_results (Bridging/Fusion quotes)
-- ============================================================================
ALTER TABLE bridge_quote_results 
ADD COLUMN IF NOT EXISTS nbp_ltv NUMERIC;

COMMENT ON COLUMN bridge_quote_results.nbp_ltv IS 'NBP LTV percentage: (NBP / Property Value) * 100';

-- ============================================================================
-- Verification
-- ============================================================================
-- Check that columns were added successfully
DO $$
BEGIN
    -- Check quote_results
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quote_results' 
        AND column_name = 'nbp_ltv'
    ) THEN
        RAISE NOTICE 'SUCCESS: nbp_ltv column added to quote_results';
    ELSE
        RAISE EXCEPTION 'FAILED: nbp_ltv column NOT found in quote_results';
    END IF;
    
    -- Check bridge_quote_results
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bridge_quote_results' 
        AND column_name = 'nbp_ltv'
    ) THEN
        RAISE NOTICE 'SUCCESS: nbp_ltv column added to bridge_quote_results';
    ELSE
        RAISE EXCEPTION 'FAILED: nbp_ltv column NOT found in bridge_quote_results';
    END IF;
END $$;
