-- Migration: Add country field to security_properties
-- This adds country to the security property address structure in DIP fields
-- Security properties are stored as JSONB arrays with structure: {street, city, postcode, country}

-- Note: This migration updates the comment/documentation only
-- The security_properties column already exists as JSONB, so it can store the country field
-- No ALTER TABLE needed - JSONB is flexible

-- Update comments to reflect the new structure
COMMENT ON COLUMN quotes.security_properties IS 'Array of security property addresses (street, city, postcode, country)';
COMMENT ON COLUMN bridge_quotes.security_properties IS 'Array of security property addresses (street, city, postcode, country)';

-- This migration is primarily for documentation purposes
-- The application code will handle adding the country field to the JSONB objects
