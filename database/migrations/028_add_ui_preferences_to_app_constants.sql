-- Add ui_preferences column to app_constants so UI preferences can be persisted
-- This includes keyboard shortcuts enabled/disabled and keyboard hints visibility

BEGIN;

-- Add structured column to app_constants for UI preferences
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS ui_preferences JSONB;

COMMENT ON COLUMN app_constants.ui_preferences IS 'UI preferences including keyboard shortcuts and hints visibility (JSON object)';

-- Insert or update the canonical app.constants row with default ui_preferences values
INSERT INTO app_constants (key, ui_preferences)
VALUES (
  'app.constants',
  '{"keyboardShortcutsEnabled":true,"showKeyboardHints":true}'::jsonb
)
ON CONFLICT (key) DO UPDATE 
SET 
  ui_preferences = CASE 
    WHEN app_constants.ui_preferences IS NULL THEN EXCLUDED.ui_preferences 
    ELSE app_constants.ui_preferences 
  END;

-- Backfill from legacy value JSON if present
UPDATE app_constants
SET ui_preferences = (value -> 'uiPreferences')::jsonb
WHERE ui_preferences IS NULL
  AND value IS NOT NULL
  AND (value ? 'uiPreferences');

COMMIT;
