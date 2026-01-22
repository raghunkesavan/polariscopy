-- ============================================================================
-- Migration 047b: Fix Data Migration from app_constants to app_settings
-- ============================================================================
-- This fixes the issue where migration 047 looked for key 'app_constants'
-- but the actual key in the database is 'app.constants' (with dot not underscore)
-- ============================================================================

DO $$
DECLARE
    source_value jsonb;
BEGIN
    -- Get the value from the old app_constants row with key 'app.constants'
    SELECT value INTO source_value
    FROM app_constants
    WHERE key = 'app.constants'
    LIMIT 1;
    
    -- Only proceed if we found data
    IF source_value IS NOT NULL THEN
        RAISE NOTICE 'Found data in app_constants with key "app.constants" - migrating to app_settings...';
        
        -- Update each row in app_settings with the corresponding nested value
        UPDATE app_settings 
        SET value = COALESCE(source_value->'productLists', '{}'::jsonb),
            updated_at = NOW()
        WHERE key = 'product_lists';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'feeColumns', '{}'::jsonb),
            updated_at = NOW()
        WHERE key = 'fee_columns';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'flatAboveCommercialRule', '{}'::jsonb),
            updated_at = NOW()
        WHERE key = 'flat_above_commercial_rule';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'marketRates', '{}'::jsonb),
            updated_at = NOW()
        WHERE key = 'market_rates';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'brokerRoutes', '{}'::jsonb),
            updated_at = NOW()
        WHERE key = 'broker_routes';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'brokerCommissionDefaults', '{}'::jsonb),
            updated_at = NOW()
        WHERE key = 'broker_commission_defaults';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'brokerCommissionTolerance', 'null'::jsonb),
            updated_at = NOW()
        WHERE key = 'broker_commission_tolerance';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'fundingLinesBTL', '[]'::jsonb),
            updated_at = NOW()
        WHERE key = 'funding_lines_btl';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'fundingLinesBridge', '[]'::jsonb),
            updated_at = NOW()
        WHERE key = 'funding_lines_bridge';
        
        UPDATE app_settings 
        SET value = COALESCE(source_value->'uiPreferences', '{}'::jsonb),
            updated_at = NOW()
        WHERE key = 'ui_preferences';
        
        RAISE NOTICE 'Successfully migrated data to 10 separate rows in app_settings';
    ELSE
        RAISE WARNING 'No data found in app_constants with key "app.constants"';
    END IF;
END $$;

-- Verification: Show migrated data
SELECT 
    key, 
    jsonb_typeof(value) as value_type,
    CASE 
        WHEN jsonb_typeof(value) = 'object' THEN 'object with ' || (SELECT count(*) FROM jsonb_object_keys(value)) || ' keys'
        WHEN jsonb_typeof(value) = 'array' THEN 'array[' || jsonb_array_length(value) || ' items]'
        WHEN jsonb_typeof(value) = 'number' THEN value::text
        WHEN jsonb_typeof(value) = 'null' THEN 'null'
        ELSE left(value::text, 50)
    END as sample,
    updated_at
FROM app_settings 
ORDER BY key;
