-- Migration 043: Create results_configuration table
-- Stores calculator results table configuration (Global Settings page)
-- Includes row order, visibility, label aliases, and header colors

CREATE TABLE IF NOT EXISTS results_configuration (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,  -- 'row_order', 'visibility', 'label_aliases', 'header_colors'
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_results_config_key ON results_configuration(key);
CREATE INDEX IF NOT EXISTS idx_results_config_calculator_type ON results_configuration(calculator_type);
CREATE INDEX IF NOT EXISTS idx_results_config_key_calc_type ON results_configuration(key, calculator_type);
CREATE INDEX IF NOT EXISTS idx_results_config_updated_at ON results_configuration(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_config_is_active ON results_configuration(is_active) WHERE is_active = true;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_results_configuration_updated_at 
BEFORE UPDATE ON results_configuration 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE results_configuration IS 'Results table configuration settings (Global Settings page)';
COMMENT ON COLUMN results_configuration.key IS 'Type of configuration: row_order, visibility, label_aliases, header_colors';
COMMENT ON COLUMN results_configuration.calculator_type IS 'Which calculator this config applies to: btl, bridge, core, or all';
COMMENT ON COLUMN results_configuration.config IS 'Configuration data in JSONB format';
COMMENT ON COLUMN results_configuration.description IS 'Human-readable description of this configuration';

-- Grant permissions
GRANT SELECT ON results_configuration TO authenticated;
GRANT INSERT, UPDATE ON results_configuration TO authenticated;
