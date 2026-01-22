-- Migration 040: Add audit columns to app_constants table
-- Adds created_at, updated_at, created_by, updated_by columns for tracking changes
-- No breaking changes - existing functionality remains unchanged

-- Add audit columns to app_constants
ALTER TABLE app_constants 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Backfill created_at and updated_at for existing rows
UPDATE app_constants 
SET created_at = COALESCE(updated_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at on any UPDATE
CREATE TRIGGER update_app_constants_updated_at 
BEFORE UPDATE ON app_constants 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN app_constants.created_at IS 'Timestamp when this setting was first created';
COMMENT ON COLUMN app_constants.updated_at IS 'Timestamp when this setting was last modified (auto-updated)';
COMMENT ON COLUMN app_constants.created_by IS 'User ID who created this setting';
COMMENT ON COLUMN app_constants.updated_by IS 'User ID who last modified this setting';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_app_constants_updated_at ON app_constants(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_constants_key_updated_at ON app_constants(key, updated_at DESC);
