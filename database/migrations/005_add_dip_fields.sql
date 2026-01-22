-- Add DIP (Decision in Principle) fields to quotes table (BTL)
ALTER TABLE quotes 
ADD COLUMN commercial_or_main_residence TEXT,
ADD COLUMN dip_date DATE,
ADD COLUMN dip_expiry_date DATE,
ADD COLUMN guarantor_name TEXT,
ADD COLUMN lender_legal_fee NUMERIC,
ADD COLUMN number_of_applicants INTEGER,
ADD COLUMN overpayments_percent NUMERIC DEFAULT 10,
ADD COLUMN paying_network_club TEXT,
ADD COLUMN security_properties JSONB,
ADD COLUMN fee_type_selection TEXT,
ADD COLUMN dip_status TEXT DEFAULT 'Not Issued';

-- Add DIP fields to bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes 
ADD COLUMN commercial_or_main_residence TEXT,
ADD COLUMN dip_date DATE,
ADD COLUMN dip_expiry_date DATE,
ADD COLUMN guarantor_name TEXT,
ADD COLUMN lender_legal_fee NUMERIC,
ADD COLUMN number_of_applicants INTEGER,
ADD COLUMN overpayments_percent NUMERIC DEFAULT 10,
ADD COLUMN paying_network_club TEXT,
ADD COLUMN security_properties JSONB,
ADD COLUMN fee_type_selection TEXT,
ADD COLUMN dip_status TEXT DEFAULT 'Not Issued';

-- Comments for documentation
COMMENT ON COLUMN quotes.commercial_or_main_residence IS 'Type of residence: Commercial or Main Residence';
COMMENT ON COLUMN quotes.dip_date IS 'Date when DIP was issued';
COMMENT ON COLUMN quotes.dip_expiry_date IS 'Date when DIP expires (default 14 days from dip_date)';
COMMENT ON COLUMN quotes.guarantor_name IS 'Name of the guarantor';
COMMENT ON COLUMN quotes.lender_legal_fee IS 'Legal fee charged by lender';
COMMENT ON COLUMN quotes.number_of_applicants IS 'Number of applicants on the DIP';
COMMENT ON COLUMN quotes.overpayments_percent IS 'Overpayment percentage allowed (default 10%)';
COMMENT ON COLUMN quotes.paying_network_club IS 'Network or club payment information';
COMMENT ON COLUMN quotes.security_properties IS 'Array of security property addresses (street, city, postcode)';
COMMENT ON COLUMN quotes.fee_type_selection IS 'Selected fee type/percentage for BTL or product type for Bridge';
COMMENT ON COLUMN quotes.dip_status IS 'Status of DIP: Not Issued, Issued, Expired';

COMMENT ON COLUMN bridge_quotes.commercial_or_main_residence IS 'Type of residence: Commercial or Main Residence';
COMMENT ON COLUMN bridge_quotes.dip_date IS 'Date when DIP was issued';
COMMENT ON COLUMN bridge_quotes.dip_expiry_date IS 'Date when DIP expires (default 14 days from dip_date)';
COMMENT ON COLUMN bridge_quotes.guarantor_name IS 'Name of the guarantor';
COMMENT ON COLUMN bridge_quotes.lender_legal_fee IS 'Legal fee charged by lender';
COMMENT ON COLUMN bridge_quotes.number_of_applicants IS 'Number of applicants on the DIP';
COMMENT ON COLUMN bridge_quotes.overpayments_percent IS 'Overpayment percentage allowed (default 10%)';
COMMENT ON COLUMN bridge_quotes.paying_network_club IS 'Network or club payment information';
COMMENT ON COLUMN bridge_quotes.security_properties IS 'Array of security property addresses (street, city, postcode)';
COMMENT ON COLUMN bridge_quotes.fee_type_selection IS 'Selected fee type/percentage for BTL or product type for Bridge (Fusion, Variable Bridge, Fixed Bridge)';
COMMENT ON COLUMN bridge_quotes.dip_status IS 'Status of DIP: Not Issued, Issued, Expired';
