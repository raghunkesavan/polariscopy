-- Test queries to verify audit system is working

-- 1. Check that audit columns were added to app_constants
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'app_constants'
  AND column_name IN ('created_at', 'updated_at', 'created_by', 'updated_by')
ORDER BY column_name;

-- 2. Check that app_constants_history table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'app_constants_history';

-- 3. Check that trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'track_app_constants_changes_trigger';

-- 4. View current app_constants with new audit columns
SELECT 
    key,
    created_at,
    updated_at,
    created_by,
    updated_by
FROM app_constants
WHERE key IN ('app.constants', 'results_table_row_order', 'results_table_visibility')
ORDER BY updated_at DESC
LIMIT 5;

-- 5. Check if any history has been captured yet
SELECT 
    COUNT(*) as history_count,
    MIN(changed_at) as first_change,
    MAX(changed_at) as last_change
FROM app_constants_history;

-- 6. View recent history entries (if any)
SELECT 
    history_id,
    key,
    change_type,
    changed_at,
    changed_by
FROM app_constants_history
ORDER BY changed_at DESC
LIMIT 10;
