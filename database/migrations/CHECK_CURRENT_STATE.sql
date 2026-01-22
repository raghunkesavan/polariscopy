-- Quick check to see what tables and columns actually exist

-- Check if app_constants exists
SELECT 'app_constants table exists:' as info, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_constants') as result;

-- Check if app_settings exists
SELECT 'app_settings table exists:' as info,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings') as result;

-- Check if results_configuration exists  
SELECT 'results_configuration table exists:' as info,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'results_configuration') as result;

-- Show columns in app_constants (if it exists)
SELECT 'app_constants columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_constants' 
ORDER BY ordinal_position;

-- Show columns in app_settings (if it exists)
SELECT 'app_settings columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
ORDER BY ordinal_position;

-- Show columns in results_configuration (if it exists)
SELECT 'results_configuration columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'results_configuration' 
ORDER BY ordinal_position;

-- Show sample data from app_constants
SELECT 'app_constants data (first row):' as info;
SELECT * FROM app_constants LIMIT 1;
