-- Add applicant_type field to quotes and bridge_quotes tables
-- This field stores whether the applicant is 'Personal' or 'Corporate'
-- When Corporate is selected, guarantor_name becomes required

ALTER TABLE quotes 
ADD COLUMN applicant_type TEXT;

ALTER TABLE bridge_quotes 
ADD COLUMN applicant_type TEXT;

-- Comments for documentation
COMMENT ON COLUMN quotes.applicant_type IS 'Type of applicant: Personal or Corporate. When Corporate, guarantor_name is required.';
COMMENT ON COLUMN bridge_quotes.applicant_type IS 'Type of applicant: Personal or Corporate. When Corporate, guarantor_name is required.';
