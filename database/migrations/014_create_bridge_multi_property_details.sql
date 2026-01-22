-- Create table for bridge multi-property details
CREATE TABLE IF NOT EXISTS bridge_multi_property_details (
  id SERIAL PRIMARY KEY,
  bridge_quote_id UUID NOT NULL REFERENCES bridge_quotes(id) ON DELETE CASCADE,
  property_address TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN ('Residential', 'Commercial', 'Semi-Commercial')),
  property_value NUMERIC(12, 2),
  charge_type TEXT NOT NULL CHECK (charge_type IN ('First charge', 'Second charge')),
  first_charge_amount NUMERIC(12, 2) DEFAULT 0,
  gross_loan NUMERIC(12, 2),
  row_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_bridge_multi_property_details_quote_id ON bridge_multi_property_details(bridge_quote_id);

-- Add comment
COMMENT ON TABLE bridge_multi_property_details IS 'Stores multi-property details for bridge quotes when Multi-property criterion is set to Yes';
