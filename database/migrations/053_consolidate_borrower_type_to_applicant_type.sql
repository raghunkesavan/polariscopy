-- Consolidate borrower_type into applicant_type
-- Migration 053: Merge borrower_type column into applicant_type and drop borrower_type

-- For quotes table: copy borrower_type to applicant_type where applicant_type is null
UPDATE quotes
SET applicant_type = CASE 
    WHEN borrower_type = 'Company' THEN 'Corporate'
    WHEN borrower_type = 'Personal' THEN 'Personal'
    WHEN borrower_type = 'Individual' THEN 'Personal'
    ELSE borrower_type
END
WHERE applicant_type IS NULL AND borrower_type IS NOT NULL;

-- For bridge_quotes table: copy borrower_type to applicant_type where applicant_type is null
UPDATE bridge_quotes
SET applicant_type = CASE 
    WHEN borrower_type = 'Company' THEN 'Corporate'
    WHEN borrower_type = 'Personal' THEN 'Personal'
    WHEN borrower_type = 'Individual' THEN 'Personal'
    ELSE borrower_type
END
WHERE applicant_type IS NULL AND borrower_type IS NOT NULL;

-- Drop the borrower_type column from both tables
ALTER TABLE quotes DROP COLUMN IF EXISTS borrower_type;
ALTER TABLE bridge_quotes DROP COLUMN IF EXISTS borrower_type;

-- Add comment explaining the field
COMMENT ON COLUMN quotes.applicant_type IS 'Type of applicant: Personal or Corporate. Consolidated from borrower_type field.';
COMMENT ON COLUMN bridge_quotes.applicant_type IS 'Type of applicant: Personal or Corporate. Consolidated from borrower_type field.';
