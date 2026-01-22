-- Add all client details section fields to both quotes and bridge_quotes tables
-- These fields store client information from the "Client details" section in both BTL and Bridging calculators

-- Add columns to quotes table (BTL)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_type TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_first_name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_last_name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_contact_number TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS broker_route TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS broker_commission_percent NUMERIC;

-- Add columns to bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS client_type TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS client_first_name TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS client_last_name TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS client_contact_number TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS broker_route TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS broker_commission_percent NUMERIC;

-- Add comments for documentation (quotes table)
COMMENT ON COLUMN quotes.client_type IS 'Client type: Direct or Broker';
COMMENT ON COLUMN quotes.client_first_name IS 'Client first name';
COMMENT ON COLUMN quotes.client_last_name IS 'Client last name';
COMMENT ON COLUMN quotes.client_email IS 'Client email address';
COMMENT ON COLUMN quotes.client_contact_number IS 'Client contact/phone number';
COMMENT ON COLUMN quotes.broker_route IS 'Broker route: Direct Broker, Mortgage club, Network, or Packager';
COMMENT ON COLUMN quotes.broker_commission_percent IS 'Broker commission percentage';

-- Add comments for documentation (bridge_quotes table)
COMMENT ON COLUMN bridge_quotes.client_type IS 'Client type: Direct or Broker';
COMMENT ON COLUMN bridge_quotes.client_first_name IS 'Client first name';
COMMENT ON COLUMN bridge_quotes.client_last_name IS 'Client last name';
COMMENT ON COLUMN bridge_quotes.client_email IS 'Client email address';
COMMENT ON COLUMN bridge_quotes.client_contact_number IS 'Client contact/phone number';
COMMENT ON COLUMN bridge_quotes.broker_route IS 'Broker route: Direct Broker, Mortgage club, Network, or Packager';
COMMENT ON COLUMN bridge_quotes.broker_commission_percent IS 'Broker commission percentage';
