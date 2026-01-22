-- Migration 047: Ensure clean table structures for Constants and Global Settings pages
-- Creates app_settings table (if needed) for Constants page
-- Ensures results_configuration exists for Global Settings page
-- Sets up proper history tracking with JSONB snapshots

-- ============================================================================
-- PART 1: Ensure app_settings table exists (for Constants page)
-- ============================================================================

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Drop any redundant individual columns if they exist (from migration 042)
DO $$ 
BEGIN
    ALTER TABLE app_settings
        DROP COLUMN IF EXISTS product_lists,
        DROP COLUMN IF EXISTS fee_columns,
        DROP COLUMN IF EXISTS flat_above_commercial_rule,
        DROP COLUMN IF EXISTS market_rates,
        DROP COLUMN IF EXISTS broker_routes,
        DROP COLUMN IF EXISTS broker_commission_defaults,
        DROP COLUMN IF EXISTS broker_commission_tolerance,
        DROP COLUMN IF EXISTS funding_lines_btl,
        DROP COLUMN IF EXISTS funding_lines_bridge,
        DROP COLUMN IF EXISTS ui_preferences;
EXCEPTION
    WHEN undefined_column THEN
        -- Columns don't exist, which is fine
        NULL;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_at ON app_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_active ON app_settings(is_active) WHERE is_active = true;

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at 
BEFORE UPDATE ON app_settings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: Ensure results_configuration table exists (for Global Settings page)
-- ============================================================================

-- Create results_configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS results_configuration (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    calculator_type TEXT NOT NULL CHECK (calculator_type IN ('btl', 'bridge', 'core', 'all')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure one config per key+calculator_type combination
    CONSTRAINT unique_key_calculator_type UNIQUE (key, calculator_type)
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_results_config_key ON results_configuration(key);
CREATE INDEX IF NOT EXISTS idx_results_config_calculator_type ON results_configuration(calculator_type);
CREATE INDEX IF NOT EXISTS idx_results_config_key_calc_type ON results_configuration(key, calculator_type);
CREATE INDEX IF NOT EXISTS idx_results_config_updated_at ON results_configuration(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_config_is_active ON results_configuration(is_active) WHERE is_active = true;

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS update_results_configuration_updated_at ON results_configuration;
CREATE TRIGGER update_results_configuration_updated_at 
BEFORE UPDATE ON results_configuration 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 3: Create or update app_settings_history table
-- ============================================================================

-- Create history table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings_history (
    history_id SERIAL PRIMARY KEY,
    setting_id INTEGER,
    key TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_type TEXT NOT NULL,
    changes JSONB NOT NULL
);

-- Drop any redundant columns from history table
DO $$ 
BEGIN
    ALTER TABLE app_settings_history
        DROP COLUMN IF EXISTS value,
        DROP COLUMN IF EXISTS product_lists,
        DROP COLUMN IF EXISTS fee_columns,
        DROP COLUMN IF EXISTS flat_above_commercial_rule,
        DROP COLUMN IF EXISTS market_rates,
        DROP COLUMN IF EXISTS broker_routes,
        DROP COLUMN IF EXISTS broker_commission_defaults,
        DROP COLUMN IF EXISTS broker_commission_tolerance,
        DROP COLUMN IF EXISTS funding_lines_btl,
        DROP COLUMN IF EXISTS funding_lines_bridge,
        DROP COLUMN IF EXISTS ui_preferences;
EXCEPTION
    WHEN undefined_column THEN
        NULL;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_app_settings_history_setting_id ON app_settings_history(setting_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_history_changed_at ON app_settings_history(changed_at DESC);

-- ============================================================================
-- PART 4: Create or update results_configuration_history table
-- ============================================================================

-- Create history table if it doesn't exist
CREATE TABLE IF NOT EXISTS results_configuration_history (
    history_id SERIAL PRIMARY KEY,
    config_id INTEGER,
    key TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_type TEXT NOT NULL,
    changes JSONB NOT NULL
);

-- Drop any redundant columns
DO $$ 
BEGIN
    ALTER TABLE results_configuration_history
        DROP COLUMN IF EXISTS calculator_type,
        DROP COLUMN IF EXISTS config;
EXCEPTION
    WHEN undefined_column THEN
        NULL;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_results_config_history_config_id ON results_configuration_history(config_id);
CREATE INDEX IF NOT EXISTS idx_results_config_history_changed_at ON results_configuration_history(changed_at DESC);

-- ============================================================================
-- PART 5: Create or recreate trigger functions for history tracking
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS track_app_settings_changes_trigger ON app_settings;
DROP TRIGGER IF EXISTS track_results_configuration_changes_trigger ON results_configuration;

-- Drop old functions
DROP FUNCTION IF EXISTS track_app_settings_changes();
DROP FUNCTION IF EXISTS track_results_configuration_changes();

-- Create simplified app_settings history tracking function
CREATE OR REPLACE FUNCTION track_app_settings_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_diff JSONB;
    row_id INTEGER;
    row_key TEXT;
BEGIN
    -- Determine which operation and build change diff
    IF (TG_OP = 'DELETE') THEN
        row_id := OLD.id;
        row_key := OLD.key;
        change_diff = jsonb_build_object(
            'operation', 'DELETE',
            'before', to_jsonb(OLD)
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        row_id := NEW.id;
        row_key := NEW.key;
        change_diff = jsonb_build_object(
            'operation', 'UPDATE',
            'before', to_jsonb(OLD),
            'after', to_jsonb(NEW)
        );
    ELSE -- INSERT
        row_id := NEW.id;
        row_key := NEW.key;
        change_diff = jsonb_build_object(
            'operation', 'INSERT',
            'after', to_jsonb(NEW)
        );
    END IF;

    -- Insert into history table
    INSERT INTO app_settings_history (
        setting_id,
        key,
        changed_at,
        changed_by,
        change_type,
        changes
    ) VALUES (
        row_id,
        row_key,
        NOW(),
        CASE WHEN TG_OP = 'DELETE' THEN OLD.updated_by ELSE NEW.updated_by END,
        TG_OP,
        change_diff
    );

    -- Return appropriate row
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create simplified results_configuration history tracking function
CREATE OR REPLACE FUNCTION track_results_configuration_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_diff JSONB;
    row_id INTEGER;
    row_key TEXT;
BEGIN
    -- Determine which operation and build change diff
    IF (TG_OP = 'DELETE') THEN
        row_id := OLD.id;
        row_key := OLD.key;
        change_diff = jsonb_build_object(
            'operation', 'DELETE',
            'before', to_jsonb(OLD)
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        row_id := NEW.id;
        row_key := NEW.key;
        change_diff = jsonb_build_object(
            'operation', 'UPDATE',
            'before', to_jsonb(OLD),
            'after', to_jsonb(NEW)
        );
    ELSE -- INSERT
        row_id := NEW.id;
        row_key := NEW.key;
        change_diff = jsonb_build_object(
            'operation', 'INSERT',
            'after', to_jsonb(NEW)
        );
    END IF;

    -- Insert into history table
    INSERT INTO results_configuration_history (
        config_id,
        key,
        changed_at,
        changed_by,
        change_type,
        changes
    ) VALUES (
        row_id,
        row_key,
        NOW(),
        CASE WHEN TG_OP = 'DELETE' THEN OLD.updated_by ELSE NEW.updated_by END,
        TG_OP,
        change_diff
    );

    -- Return appropriate row
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER track_app_settings_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION track_app_settings_changes();

CREATE TRIGGER track_results_configuration_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON results_configuration
    FOR EACH ROW
    EXECUTE FUNCTION track_results_configuration_changes();

-- Grant permissions
GRANT SELECT ON app_settings TO authenticated;
GRANT INSERT, UPDATE ON app_settings TO authenticated;
GRANT SELECT ON results_configuration TO authenticated;
GRANT INSERT, UPDATE ON results_configuration TO authenticated;

-- ============================================================================
-- PART 6: Update table comments
-- ============================================================================

COMMENT ON TABLE app_settings IS 'Application constants (Constants admin page) - each setting stored as separate row';
COMMENT ON COLUMN app_settings.key IS 'Setting identifier: product_lists, fee_columns, market_rates, broker_routes, etc.';
COMMENT ON COLUMN app_settings.value IS 'Setting value in JSONB format';

COMMENT ON TABLE app_settings_history IS 'Audit trail for app_settings changes - stores complete before/after snapshots in changes JSONB';
COMMENT ON COLUMN app_settings_history.changes IS 'Complete change record with operation type and before/after snapshots';

COMMENT ON TABLE results_configuration IS 'Results table configuration (Global Settings page) - stores row order, visibility, label aliases, header colors';
COMMENT ON COLUMN results_configuration.key IS 'Configuration type: visibility, row_order, label_aliases, header_colors';
COMMENT ON COLUMN results_configuration.calculator_type IS 'Which calculator: btl, bridge, core, or all';
COMMENT ON COLUMN results_configuration.config IS 'Configuration data in JSONB format';

COMMENT ON TABLE results_configuration_history IS 'Audit trail for results_configuration changes - stores complete before/after snapshots';

-- ============================================================================
-- PART 7: Migrate data from app_constants to app_settings (separate rows per setting)
-- ============================================================================

DO $$
DECLARE
    latest_value JSONB;
    latest_created TIMESTAMPTZ;
    latest_updated TIMESTAMPTZ;
BEGIN
    -- Only run if app_constants table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_constants') THEN
        
        -- Get the most recent non-NULL value from app_constants
        -- Look for keys: 'app.constants', 'app_constants', or patterns like 'app.constants:2024-...'
        SELECT value, created_at, updated_at
        INTO latest_value, latest_created, latest_updated
        FROM app_constants
        WHERE (key = 'app.constants' OR key = 'app_constants' OR key LIKE 'app.constants:%' OR key LIKE 'app_constants_%')
          AND value IS NOT NULL
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1;
        
        -- Only insert if we found a non-NULL value
        IF latest_value IS NOT NULL THEN
            -- Split the monolithic value into separate rows
            INSERT INTO app_settings (key, value, description, created_at, updated_at)
            VALUES 
                ('product_lists', COALESCE(latest_value->'productLists', '{}'::jsonb), 'Product type lists for BTL and Bridge', latest_created, latest_updated),
                ('fee_columns', COALESCE(latest_value->'feeColumns', '{}'::jsonb), 'Fee column definitions', latest_created, latest_updated),
                ('flat_above_commercial_rule', COALESCE(latest_value->'flatAboveCommercialRule', '{}'::jsonb), 'Flat above commercial rule settings', latest_created, latest_updated),
                ('market_rates', COALESCE(latest_value->'marketRates', '{}'::jsonb), 'Market rate definitions', latest_created, latest_updated),
                ('broker_routes', COALESCE(latest_value->'brokerRoutes', '{}'::jsonb), 'Broker route configurations', latest_created, latest_updated),
                ('broker_commission_defaults', COALESCE(latest_value->'brokerCommissionDefaults', '{}'::jsonb), 'Default broker commission settings', latest_created, latest_updated),
                ('broker_commission_tolerance', COALESCE(latest_value->'brokerCommissionTolerance', 'null'::jsonb), 'Broker commission tolerance value', latest_created, latest_updated),
                ('funding_lines_btl', COALESCE(latest_value->'fundingLinesBTL', '[]'::jsonb), 'BTL funding lines', latest_created, latest_updated),
                ('funding_lines_bridge', COALESCE(latest_value->'fundingLinesBridge', '[]'::jsonb), 'Bridge funding lines', latest_created, latest_updated),
                ('ui_preferences', COALESCE(latest_value->'uiPreferences', '{}'::jsonb), 'UI preference settings', latest_created, latest_updated)
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value,
                updated_at = EXCLUDED.updated_at;
                
            RAISE NOTICE 'Data migrated from app_constants to app_settings (10 separate rows)';
        ELSE
            RAISE NOTICE 'No valid data in app_constants - creating default empty rows';
            
            -- Create default empty settings rows
            INSERT INTO app_settings (key, value, description)
            VALUES 
                ('product_lists', '{}'::jsonb, 'Product type lists for BTL and Bridge'),
                ('fee_columns', '{}'::jsonb, 'Fee column definitions'),
                ('flat_above_commercial_rule', '{}'::jsonb, 'Flat above commercial rule settings'),
                ('market_rates', '{}'::jsonb, 'Market rate definitions'),
                ('broker_routes', '{}'::jsonb, 'Broker route configurations'),
                ('broker_commission_defaults', '{}'::jsonb, 'Default broker commission settings'),
                ('broker_commission_tolerance', 'null'::jsonb, 'Broker commission tolerance value'),
                ('funding_lines_btl', '[]'::jsonb, 'BTL funding lines'),
                ('funding_lines_bridge', '[]'::jsonb, 'Bridge funding lines'),
                ('ui_preferences', '{}'::jsonb, 'UI preference settings')
            ON CONFLICT (key) DO NOTHING;
        END IF;
    ELSE
        RAISE NOTICE 'app_constants table does not exist - creating default rows';
        
        -- Create default empty settings rows
        INSERT INTO app_settings (key, value, description)
        VALUES 
            ('product_lists', '{}'::jsonb, 'Product type lists for BTL and Bridge'),
            ('fee_columns', '{}'::jsonb, 'Fee column definitions'),
            ('flat_above_commercial_rule', '{}'::jsonb, 'Flat above commercial rule settings'),
            ('market_rates', '{}'::jsonb, 'Market rate definitions'),
            ('broker_routes', '{}'::jsonb, 'Broker route configurations'),
            ('broker_commission_defaults', '{}'::jsonb, 'Default broker commission settings'),
            ('broker_commission_tolerance', 'null'::jsonb, 'Broker commission tolerance value'),
            ('funding_lines_btl', '[]'::jsonb, 'BTL funding lines'),
            ('funding_lines_bridge', '[]'::jsonb, 'Bridge funding lines'),
            ('ui_preferences', '{}'::jsonb, 'UI preference settings')
        ON CONFLICT (key) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check app_settings structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_settings' ORDER BY ordinal_position;

-- Check app_settings data (should see 10 rows)
-- SELECT key, jsonb_typeof(value), description FROM app_settings ORDER BY key;

-- Check app_settings_history structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_settings_history' ORDER BY ordinal_position;

-- Check results_configuration structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'results_configuration' ORDER BY ordinal_position;

-- Check results_configuration_history structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'results_configuration_history' ORDER BY ordinal_position;

-- Test trigger on app_settings
-- UPDATE app_settings SET value = value || '{"test": true}'::jsonb WHERE key = 'product_lists';
-- SELECT jsonb_pretty(changes) FROM app_settings_history ORDER BY changed_at DESC LIMIT 1;

-- ============================================================================
-- OPTIONAL CLEANUP: Drop old app_constants table (ONLY after verifying everything works!)
-- ============================================================================

-- Uncomment these lines AFTER testing the new structure for a few days:

-- DROP TRIGGER IF EXISTS track_app_constants_changes_trigger ON app_constants;
-- DROP TABLE IF EXISTS app_constants_history CASCADE;
-- DROP TABLE IF EXISTS app_constants CASCADE;
-- 
-- RAISE NOTICE 'Old app_constants tables dropped - migration complete!';
