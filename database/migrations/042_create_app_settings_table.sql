-- Migration 042: Create app_settings table for application constants
-- Separates main application settings from results configuration
-- This table stores constants managed via the Constants admin page

CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    
    -- Main configuration data
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Individual columns for structured access (optional, for backward compatibility)
    product_lists JSONB,
    fee_columns JSONB,
    flat_above_commercial_rule JSONB,
    market_rates JSONB,
    broker_routes JSONB,
    broker_commission_defaults JSONB,
    broker_commission_tolerance NUMERIC,
    funding_lines_btl JSONB,
    funding_lines_bridge JSONB,
    ui_preferences JSONB,
    
    -- Audit columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_at ON app_settings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_active ON app_settings(is_active) WHERE is_active = true;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_app_settings_updated_at 
BEFORE UPDATE ON app_settings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE app_settings IS 'Application-wide settings and constants (Constants admin page)';
COMMENT ON COLUMN app_settings.key IS 'Unique identifier for the setting (e.g., "app.constants")';
COMMENT ON COLUMN app_settings.value IS 'Complete settings object in JSONB format';
COMMENT ON COLUMN app_settings.description IS 'Human-readable description of what this setting controls';
COMMENT ON COLUMN app_settings.is_active IS 'Whether this setting is currently active';

-- Grant permissions
GRANT SELECT ON app_settings TO authenticated;
GRANT INSERT, UPDATE ON app_settings TO authenticated;
