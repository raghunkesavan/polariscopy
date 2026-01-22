-- Add broker_company_name and first_charge_value columns to both quotes and bridge_quotes tables
-- broker_company_name: stores the broker company name when client_type is "Broker"
-- first_charge_value: used to calculate LTV tier (LTV = (Gross Loan + First Charge Value) / Property Value × 100)

-- Add columns to quotes table (BTL)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS broker_company_name TEXT;

-- Add columns to bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS broker_company_name TEXT;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS first_charge_value NUMERIC;

-- Add comments for documentation
COMMENT ON COLUMN quotes.broker_company_name IS 'Broker company name (when client type is Broker)';
COMMENT ON COLUMN bridge_quotes.broker_company_name IS 'Broker company name (when client type is Broker)';
COMMENT ON COLUMN bridge_quotes.first_charge_value IS 'First charge value used for LTV calculation: LTV = (Gross Loan + First Charge Value) / Property Value × 100';
