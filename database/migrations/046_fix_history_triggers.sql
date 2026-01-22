-- Migration 046: Fix history tracking triggers
-- Removes reference to non-existent 'idx' column

-- Drop ALL existing triggers and functions (including old app_constants ones)
DROP TRIGGER IF EXISTS track_app_constants_changes_trigger ON app_constants;
DROP TRIGGER IF EXISTS track_app_settings_changes_trigger ON app_settings;
DROP TRIGGER IF EXISTS track_results_configuration_changes_trigger ON results_configuration;
DROP FUNCTION IF EXISTS track_app_constants_changes();
DROP FUNCTION IF EXISTS track_app_settings_changes();
DROP FUNCTION IF EXISTS track_results_configuration_changes();

-- Recreate app_settings history tracking function (fixed)
-- Simplified version - just stores the change without detailed fields
CREATE OR REPLACE FUNCTION track_app_settings_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_diff JSONB;
    row_id INTEGER;
    row_key TEXT;
BEGIN
    -- Get ID and key safely
    IF (TG_OP = 'DELETE') THEN
        row_id := OLD.id;
        row_key := OLD.key;
        change_diff = jsonb_build_object('old', to_jsonb(OLD));
    ELSE
        row_id := NEW.id;
        row_key := NEW.key;
        IF (TG_OP = 'UPDATE') THEN
            change_diff = jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
        ELSE
            change_diff = jsonb_build_object('new', to_jsonb(NEW));
        END IF;
    END IF;

    -- Simple insert with just the essentials
    INSERT INTO app_settings_history (
        setting_id, key, changed_at, changed_by, change_type, changes
    ) VALUES (
        row_id, row_key, NOW(), 
        CASE WHEN TG_OP = 'DELETE' THEN OLD.updated_by ELSE NEW.updated_by END,
        TG_OP, change_diff
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate results_configuration history tracking function (fixed)
-- Simplified version - just stores the change without detailed fields
CREATE OR REPLACE FUNCTION track_results_configuration_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_diff JSONB;
    row_id INTEGER;
    row_key TEXT;
BEGIN
    -- Get ID and key safely
    IF (TG_OP = 'DELETE') THEN
        row_id := OLD.id;
        row_key := OLD.key;
        change_diff = jsonb_build_object('old', to_jsonb(OLD));
    ELSE
        row_id := NEW.id;
        row_key := NEW.key;
        IF (TG_OP = 'UPDATE') THEN
            change_diff = jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
        ELSE
            change_diff = jsonb_build_object('new', to_jsonb(NEW));
        END IF;
    END IF;

    -- Simple insert with just the essentials
    INSERT INTO results_configuration_history (
        config_id, key, changed_at, changed_by, change_type, changes
    ) VALUES (
        row_id, row_key, NOW(),
        CASE WHEN TG_OP = 'DELETE' THEN OLD.updated_by ELSE NEW.updated_by END,
        TG_OP, change_diff
    );

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
