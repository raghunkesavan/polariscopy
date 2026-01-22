-- Migration 044: Create history tables for new structure
-- Separate history tracking for app_settings and results_configuration

-- History table for app_settings
CREATE TABLE IF NOT EXISTS app_settings_history (
    history_id SERIAL PRIMARY KEY,
    setting_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value JSONB,
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
    
    -- Audit metadata
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_type TEXT NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
    changes JSONB
);

-- Indexes for app_settings_history
CREATE INDEX IF NOT EXISTS idx_app_settings_history_key ON app_settings_history(key, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_settings_history_changed_at ON app_settings_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_settings_history_changed_by ON app_settings_history(changed_by);

-- History table for results_configuration
CREATE TABLE IF NOT EXISTS results_configuration_history (
    history_id SERIAL PRIMARY KEY,
    config_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    calculator_type TEXT NOT NULL,
    config JSONB,
    
    -- Audit metadata
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_type TEXT NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
    changes JSONB
);

-- Indexes for results_configuration_history
CREATE INDEX IF NOT EXISTS idx_results_config_history_key ON results_configuration_history(key, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_config_history_calc_type ON results_configuration_history(calculator_type);
CREATE INDEX IF NOT EXISTS idx_results_config_history_changed_at ON results_configuration_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_config_history_changed_by ON results_configuration_history(changed_by);

-- Function to track app_settings changes
CREATE OR REPLACE FUNCTION track_app_settings_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_diff JSONB;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        change_diff = jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    ELSIF (TG_OP = 'INSERT') THEN
        change_diff = jsonb_build_object('new', to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        change_diff = jsonb_build_object('old', to_jsonb(OLD));
    END IF;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO app_settings_history (
            setting_id, key, value, product_lists, fee_columns,
            flat_above_commercial_rule, market_rates, broker_routes,
            broker_commission_defaults, broker_commission_tolerance,
            funding_lines_btl, funding_lines_bridge, ui_preferences,
            changed_at, changed_by, change_type, changes
        ) VALUES (
            OLD.id, OLD.key, OLD.value, OLD.product_lists, OLD.fee_columns,
            OLD.flat_above_commercial_rule, OLD.market_rates, OLD.broker_routes,
            OLD.broker_commission_defaults, OLD.broker_commission_tolerance,
            OLD.funding_lines_btl, OLD.funding_lines_bridge, OLD.ui_preferences,
            NOW(), OLD.updated_by, 'DELETE', change_diff
        );
        RETURN OLD;
    ELSE
        INSERT INTO app_settings_history (
            setting_id, key, value, product_lists, fee_columns,
            flat_above_commercial_rule, market_rates, broker_routes,
            broker_commission_defaults, broker_commission_tolerance,
            funding_lines_btl, funding_lines_bridge, ui_preferences,
            changed_at, changed_by, change_type, changes
        ) VALUES (
            NEW.id, NEW.key, NEW.value, NEW.product_lists, NEW.fee_columns,
            NEW.flat_above_commercial_rule, NEW.market_rates, NEW.broker_routes,
            NEW.broker_commission_defaults, NEW.broker_commission_tolerance,
            NEW.funding_lines_btl, NEW.funding_lines_bridge, NEW.ui_preferences,
            NOW(), NEW.updated_by, TG_OP, change_diff
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to track results_configuration changes
CREATE OR REPLACE FUNCTION track_results_configuration_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_diff JSONB;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        change_diff = jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    ELSIF (TG_OP = 'INSERT') THEN
        change_diff = jsonb_build_object('new', to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        change_diff = jsonb_build_object('old', to_jsonb(OLD));
    END IF;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO results_configuration_history (
            config_id, key, calculator_type, config,
            changed_at, changed_by, change_type, changes
        ) VALUES (
            OLD.id, OLD.key, OLD.calculator_type, OLD.config,
            NOW(), OLD.updated_by, 'DELETE', change_diff
        );
        RETURN OLD;
    ELSE
        INSERT INTO results_configuration_history (
            config_id, key, calculator_type, config,
            changed_at, changed_by, change_type, changes
        ) VALUES (
            NEW.id, NEW.key, NEW.calculator_type, NEW.config,
            NOW(), NEW.updated_by, TG_OP, change_diff
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER track_app_settings_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION track_app_settings_changes();

CREATE TRIGGER track_results_configuration_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON results_configuration
FOR EACH ROW
EXECUTE FUNCTION track_results_configuration_changes();

-- Comments
COMMENT ON TABLE app_settings_history IS 'Audit trail for app_settings changes';
COMMENT ON TABLE results_configuration_history IS 'Audit trail for results_configuration changes';

-- Grant permissions
GRANT SELECT ON app_settings_history TO authenticated;
GRANT SELECT ON results_configuration_history TO authenticated;
