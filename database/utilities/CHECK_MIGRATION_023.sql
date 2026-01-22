-- Quick verification script to check if migration 023 needs to be run
-- Run this in Supabase SQL Editor first

-- Check if new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bridge_quote_results'
  AND column_name IN (
    'rolled_interest_coupon',
    'rolled_interest_bbr',
    'deferred_interest',
    'aprc_annual',
    'tier_name',
    'product_kind'
  )
ORDER BY column_name;

-- If the query returns 0 rows, you need to run migration 023
-- If it returns 6 rows, migration already complete
