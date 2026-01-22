-- Migration 045: Migrate data from app_constants to new tables
-- Safely moves existing data to app_settings and results_configuration
-- IMPORTANT: Review data before running, backup recommended

-- Step 1: Migrate main app constants to app_settings
INSERT INTO app_settings (
    key, value, product_lists, fee_columns, flat_above_commercial_rule,
    market_rates, broker_routes, broker_commission_defaults, 
    broker_commission_tolerance, funding_lines_btl, funding_lines_bridge,
    ui_preferences, created_at, updated_at, created_by, updated_by,
    description, is_active
)
SELECT 
    key,
    value,
    product_lists,
    fee_columns,
    flat_above_commercial_rule,
    market_rates,
    broker_routes,
    broker_commission_defaults,
    broker_commission_tolerance,
    funding_lines_btl,
    funding_lines_bridge,
    ui_preferences,
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Main application constants',
    true
FROM app_constants
WHERE key = 'app.constants'
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    product_lists = EXCLUDED.product_lists,
    fee_columns = EXCLUDED.fee_columns,
    flat_above_commercial_rule = EXCLUDED.flat_above_commercial_rule,
    market_rates = EXCLUDED.market_rates,
    broker_routes = EXCLUDED.broker_routes,
    broker_commission_defaults = EXCLUDED.broker_commission_defaults,
    broker_commission_tolerance = EXCLUDED.broker_commission_tolerance,
    funding_lines_btl = EXCLUDED.funding_lines_btl,
    funding_lines_bridge = EXCLUDED.funding_lines_bridge,
    ui_preferences = EXCLUDED.ui_preferences,
    updated_at = NOW();

-- Step 2: Migrate results_table_row_order
INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at, 
    created_by, updated_by, description, is_active
)
SELECT 
    'row_order',
    'btl',
    jsonb_build_object('order', results_row_order->'btl'),
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'BTL calculator row display order',
    true
FROM app_constants
WHERE key = 'results_table_row_order' AND results_row_order ? 'btl'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'row_order',
    'bridge',
    jsonb_build_object('order', results_row_order->'bridge'),
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Bridge calculator row display order',
    true
FROM app_constants
WHERE key = 'results_table_row_order' AND results_row_order ? 'bridge'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'row_order',
    'core',
    jsonb_build_object('order', results_row_order->'core'),
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Core calculator row display order',
    true
FROM app_constants
WHERE key = 'results_table_row_order' AND results_row_order ? 'core'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

-- Step 3: Migrate results_table_visibility
INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'visibility',
    'btl',
    value->'btl',
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'BTL calculator field visibility',
    true
FROM app_constants
WHERE key = 'results_table_visibility' AND value ? 'btl'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'visibility',
    'bridge',
    value->'bridge',
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Bridge calculator field visibility',
    true
FROM app_constants
WHERE key = 'results_table_visibility' AND value ? 'bridge'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'visibility',
    'core',
    value->'core',
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Core calculator field visibility',
    true
FROM app_constants
WHERE key = 'results_table_visibility' AND value ? 'core'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

-- Step 4: Migrate results_table_label_aliases
INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'label_aliases',
    'btl',
    COALESCE(label_aliases->'btl', value->'btl', '{}'::jsonb),
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'BTL calculator custom field labels',
    true
FROM app_constants
WHERE key = 'results_table_label_aliases'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'label_aliases',
    'bridge',
    COALESCE(label_aliases->'bridge', value->'bridge', '{}'::jsonb),
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Bridge calculator custom field labels',
    true
FROM app_constants
WHERE key = 'results_table_label_aliases'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'label_aliases',
    'core',
    COALESCE(label_aliases->'core', value->'core', '{}'::jsonb),
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Core calculator custom field labels',
    true
FROM app_constants
WHERE key = 'results_table_label_aliases'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

-- Step 5: Migrate results_table_header_colors
INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'header_colors',
    'btl',
    value->'btl',
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'BTL calculator header colors',
    true
FROM app_constants
WHERE key = 'results_table_header_colors' AND value ? 'btl'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'header_colors',
    'bridge',
    value->'bridge',
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Bridge calculator header colors',
    true
FROM app_constants
WHERE key = 'results_table_header_colors' AND value ? 'bridge'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

INSERT INTO results_configuration (
    key, calculator_type, config, created_at, updated_at,
    created_by, updated_by, description, is_active
)
SELECT 
    'header_colors',
    'core',
    value->'core',
    COALESCE(created_at, updated_at, NOW()),
    COALESCE(updated_at, NOW()),
    created_by,
    updated_by,
    'Core calculator header colors',
    true
FROM app_constants
WHERE key = 'results_table_header_colors' AND value ? 'core'
ON CONFLICT (key, calculator_type) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = NOW();

-- Verification queries
-- Run these to verify data was migrated correctly

-- Check app_settings
-- SELECT key, created_at, updated_at FROM app_settings;

-- Check results_configuration
-- SELECT key, calculator_type, created_at, updated_at FROM results_configuration ORDER BY key, calculator_type;

-- Compare counts
-- SELECT 'app_constants original' as source, COUNT(*) FROM app_constants WHERE key IN ('app.constants', 'results_table_row_order', 'results_table_visibility', 'results_table_label_aliases', 'results_table_header_colors');
-- SELECT 'app_settings migrated' as source, COUNT(*) FROM app_settings;
-- SELECT 'results_configuration migrated' as source, COUNT(*) FROM results_configuration;
