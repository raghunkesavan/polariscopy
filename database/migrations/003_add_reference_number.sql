-- Add reference_number column to both tables
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS reference_number text UNIQUE;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS reference_number text UNIQUE;

-- Create a sequence for generating reference numbers
CREATE SEQUENCE IF NOT EXISTS quote_reference_seq START WITH 1000;

-- Function to generate reference number
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS text AS $$
BEGIN
    RETURN 'MFS' || LPAD(nextval('quote_reference_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate reference numbers for existing quotes that don't have one
UPDATE quotes 
SET reference_number = generate_reference_number()
WHERE reference_number IS NULL;

UPDATE bridge_quotes 
SET reference_number = generate_reference_number()
WHERE reference_number IS NULL;
