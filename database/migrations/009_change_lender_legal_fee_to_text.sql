-- Change lender_legal_fee from NUMERIC to TEXT to support "TBC" value
ALTER TABLE quotes 
ALTER COLUMN lender_legal_fee TYPE TEXT;

ALTER TABLE bridge_quotes 
ALTER COLUMN lender_legal_fee TYPE TEXT;

-- Update comments
COMMENT ON COLUMN quotes.lender_legal_fee IS 'Legal fee charged by lender - can be numeric value or "TBC"';
COMMENT ON COLUMN bridge_quotes.lender_legal_fee IS 'Legal fee charged by lender - can be numeric value or "TBC"';
