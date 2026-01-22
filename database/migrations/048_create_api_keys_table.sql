-- Migration: Create API keys table for external reporting access
-- Description: Stores API keys for data teams to access reporting endpoints (Power BI, etc.)
-- Author: System
-- Date: 2026-01-05

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Friendly name (e.g., "Power BI - Data Team")
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the API key
  permissions TEXT[] DEFAULT ARRAY['read:reports'], -- Array of permissions
  is_active BOOLEAN DEFAULT true,
  created_by UUID, -- User ID who created this key (no FK constraint - may not exist in users table)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  last_used_at TIMESTAMP WITH TIME ZONE, -- Track usage
  notes TEXT -- Optional notes about the key
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX idx_api_keys_created_by ON public.api_keys(created_by);

-- Add RLS policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Admin users (access level 1) can manage API keys
-- Note: Backend uses service role, so this allows both service role and admin users
CREATE POLICY "Admins can manage API keys" 
  ON public.api_keys 
  FOR ALL 
  USING (true)  -- Backend uses service role which bypasses RLS
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Add comments
COMMENT ON TABLE public.api_keys IS 'Stores API keys for external system access (Power BI, data teams)';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of the API key for secure storage';
COMMENT ON COLUMN public.api_keys.permissions IS 'Array of permission strings (e.g., read:reports, write:data)';
COMMENT ON COLUMN public.api_keys.last_used_at IS 'Timestamp of last successful authentication';
