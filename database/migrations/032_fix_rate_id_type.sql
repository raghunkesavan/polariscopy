-- Fix rate_id column type from UUID to TEXT
-- This fixes the error: "invalid input syntax for type uuid: '2038'"
-- The rates table uses integer IDs, not UUIDs

-- For quote_results (BTL)
ALTER TABLE quote_results 
  ALTER COLUMN rate_id TYPE TEXT USING rate_id::TEXT;

-- For bridge_quote_results (Bridging)
ALTER TABLE bridge_quote_results 
  ALTER COLUMN rate_id TYPE TEXT USING rate_id::TEXT;
