-- Migration 041: Create app_constants_history table for change tracking
-- Automatically tracks all changes to app_constants via trigger
-- Provides full audit trail without modifying existing application logic

-- Create history table with same structure as app_constants
CREATE TABLE IF NOT EXISTS app_constants_history (
    history_id SERIAL PRIMARY KEY,
    -- Original row identifier
    idx INTEGER,
    key TEXT NOT NULL,
    
    -- All data columns from app_constants
    value JSONB,
    product_lists JSONB,
    fee_columns JSONB,
    flat_above_commercial_rule JSONB,
    market_rates JSONB,
    broker_routes JSONB,
    broker_commission_defaults JSONB,
    broker_commission_tolerance NUMERIC,
    funding_lines JSONB,
    funding_lines_btl JSONB,
    funding_lines_bridge JSONB,
    results_row_order JSONB,
    ui_preferences JSONB,
    label_aliases JSONB,
    
    -- Audit metadata
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_type TEXT NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Store snapshot of what changed
    changes JSONB
);

-- Indexes for efficient history queries
CREATE INDEX IF NOT EXISTS idx_app_constants_history_key ON app_constants_history(key, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_constants_history_changed_at ON app_constants_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_constants_history_changed_by ON app_constants_history(changed_by);

-- Function to track changes to app_constants
CREATE OR REPLACE FUNCTION track_app_constants_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_diff JSONB;
BEGIN
    -- Calculate what changed (for UPDATE operations)
    IF (TG_OP = 'UPDATE') THEN
        change_diff = jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
    ELSIF (TG_OP = 'INSERT') THEN
        change_diff = jsonb_build_object('new', to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        change_diff = jsonb_build_object('old', to_jsonb(OLD));
    END IF;

    -- Insert history record
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO app_constants_history (
            idx, key, value, product_lists, fee_columns, 
            flat_above_commercial_rule, market_rates, broker_routes,
            broker_commission_defaults, broker_commission_tolerance,
            funding_lines, funding_lines_btl, funding_lines_bridge,
            results_row_order, ui_preferences, label_aliases,
            changed_at, changed_by, change_type, changes
        ) VALUES (
            OLD.idx, OLD.key, OLD.value, OLD.product_lists, OLD.fee_columns,
            OLD.flat_above_commercial_rule, OLD.market_rates, OLD.broker_routes,
            OLD.broker_commission_defaults, OLD.broker_commission_tolerance,
            OLD.funding_lines, OLD.funding_lines_btl, OLD.funding_lines_bridge,
            OLD.results_row_order, OLD.ui_preferences, OLD.label_aliases,
            NOW(), OLD.updated_by, 'DELETE', change_diff
        );
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        INSERT INTO app_constants_history (
            idx, key, value, product_lists, fee_columns,
            flat_above_commercial_rule, market_rates, broker_routes,
            broker_commission_defaults, broker_commission_tolerance,
            funding_lines, funding_lines_btl, funding_lines_bridge,
            results_row_order, ui_preferences, label_aliases,
            changed_at, changed_by, change_type, changes
        ) VALUES (
            NEW.idx, NEW.key, NEW.value, NEW.product_lists, NEW.fee_columns,
            NEW.flat_above_commercial_rule, NEW.market_rates, NEW.broker_routes,
            NEW.broker_commission_defaults, NEW.broker_commission_tolerance,
            NEW.funding_lines, NEW.funding_lines_btl, NEW.funding_lines_bridge,
            NEW.results_row_order, NEW.ui_preferences, NEW.label_aliases,
            NOW(), NEW.updated_by, TG_OP, change_diff
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track all changes
CREATE TRIGGER track_app_constants_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON app_constants
FOR EACH ROW
EXECUTE FUNCTION track_app_constants_changes();

-- Add comments
COMMENT ON TABLE app_constants_history IS 'Audit trail for all changes to app_constants table';
COMMENT ON COLUMN app_constants_history.history_id IS 'Unique identifier for each history record';
COMMENT ON COLUMN app_constants_history.changed_at IS 'Timestamp when the change occurred';
COMMENT ON COLUMN app_constants_history.changed_by IS 'User who made the change';
COMMENT ON COLUMN app_constants_history.change_type IS 'Type of operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN app_constants_history.changes IS 'JSON diff showing what changed';

-- Grant appropriate permissions
-- Admin can view history
GRANT SELECT ON app_constants_history TO authenticated;
