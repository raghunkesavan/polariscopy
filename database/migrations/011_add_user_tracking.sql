-- Migration: Add user tracking columns to quotes tables
-- Created: 2025-11-10
-- Purpose: Track which user created/modified each quote without requiring SSO

-- Add user tracking columns to quotes table
ALTER TABLE quotes 
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS created_by_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_id TEXT;

-- Add user tracking columns to bridge_quotes table
ALTER TABLE bridge_quotes 
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS created_by_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN quotes.created_by IS 'Name of user who created this quote (from browser localStorage)';
COMMENT ON COLUMN quotes.created_by_id IS 'Unique ID of user who created this quote (from browser localStorage)';
COMMENT ON COLUMN quotes.updated_by IS 'Name of user who last updated this quote';
COMMENT ON COLUMN quotes.updated_by_id IS 'Unique ID of user who last updated this quote';

COMMENT ON COLUMN bridge_quotes.created_by IS 'Name of user who created this quote (from browser localStorage)';
COMMENT ON COLUMN bridge_quotes.created_by_id IS 'Unique ID of user who created this quote (from browser localStorage)';
COMMENT ON COLUMN bridge_quotes.updated_by IS 'Name of user who last updated this quote';
COMMENT ON COLUMN bridge_quotes.updated_by_id IS 'Unique ID of user who last updated this quote';

-- Create index for filtering by user
CREATE INDEX IF NOT EXISTS idx_quotes_created_by_id ON quotes (created_by_id);
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_created_by_id ON bridge_quotes (created_by_id);

-- Create index for searching by name
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes (created_by);
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_created_by ON bridge_quotes (created_by);

-- Rollback script (if needed)
/*
-- To rollback this migration, run:
ALTER TABLE quotes 
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS created_by_id,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS updated_by_id;

ALTER TABLE bridge_quotes 
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS created_by_id,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS updated_by_id;

DROP INDEX IF EXISTS idx_quotes_created_by_id;
DROP INDEX IF EXISTS idx_bridge_quotes_created_by_id;
DROP INDEX IF EXISTS idx_quotes_created_by;
DROP INDEX IF EXISTS idx_bridge_quotes_created_by;
*/
