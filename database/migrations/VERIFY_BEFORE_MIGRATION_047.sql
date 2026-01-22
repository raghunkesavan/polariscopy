-- Verification Script: Check database state BEFORE running migration 047
-- Run this in Supabase SQL Editor to see current structure

-- ============================================================================
-- Current state of app_settings table
-- ============================================================================
SELECT 'app_settings columns:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
ORDER BY ordinal_position;

-- Expected result: You'll see product_lists, fee_columns, market_rates, etc. (redundant!)

-- ============================================================================
-- Current state of results_configuration table
-- ============================================================================
SELECT 'results_configuration columns:' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'results_configuration' 
ORDER BY ordinal_position;

-- Expected result: Clean structure with just id, key, calculator_type, config, audit fields

-- ============================================================================
-- Check if old app_constants table still exists
-- ============================================================================
SELECT 'app_constants exists:' as check_type;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'app_constants'
) as table_exists;

-- If true: Old table still exists (can be dropped after verification period)

-- ============================================================================
-- Current data in app_settings
-- ============================================================================
SELECT 'app_settings data:' as check_type;
SELECT id, key, 
    CASE 
        WHEN value = '{}'::jsonb THEN 'EMPTY' 
        ELSE 'HAS DATA' 
    END as value_status,
    CASE 
        WHEN product_lists IS NOT NULL THEN 'HAS DATA' 
        ELSE 'NULL' 
    END as product_lists_status
FROM app_settings;

-- This shows which columns currently have data

-- ============================================================================
-- Current data in results_configuration
-- ============================================================================
SELECT 'results_configuration data:' as check_type;
SELECT key, calculator_type, 
    jsonb_pretty(config) as config_preview 
FROM results_configuration 
ORDER BY key, calculator_type;

-- This shows your Global Settings data (should be empty if not yet migrated)

-- ============================================================================
-- SUMMARY
-- ============================================================================
/*
WHAT YOU'LL SEE:

1. app_settings has BOTH individual columns AND value JSONB
   → This is redundant and needs cleanup
   → Migration 047 will remove the individual columns

2. results_configuration has clean structure
   → This is correct!
   → No changes needed to this table

3. app_constants may still exist
   → Old table from before migration 042
   → Can be safely dropped after data verification

NEXT STEPS:
1. Run migration 047 to clean up app_settings
2. Test Constants admin page
3. Test Global Settings admin page
4. Once verified, optionally drop old app_constants table
*/
