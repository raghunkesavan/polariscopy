-- Quick verification that migration 047 worked correctly

-- Should show 10 rows (one for each setting type)
SELECT key, jsonb_typeof(value) as value_type, description 
FROM app_settings 
ORDER BY key;

-- Should show clean structure (id, key, value, audit columns only)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
ORDER BY ordinal_position;

-- Test that history tracking works
UPDATE app_settings SET value = value || '{"test": true}'::jsonb WHERE key = 'product_lists';
SELECT key, change_type, jsonb_pretty(changes) 
FROM app_settings_history 
ORDER BY changed_at DESC 
LIMIT 1;
