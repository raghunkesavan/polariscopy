-- Remove old applicant columns and add new borrower fields
ALTER TABLE quotes DROP COLUMN IF EXISTS applicant1;
ALTER TABLE quotes DROP COLUMN IF EXISTS applicant2;
ALTER TABLE quotes DROP COLUMN IF EXISTS applicant3;
ALTER TABLE quotes DROP COLUMN IF EXISTS applicant4;

ALTER TABLE bridge_quotes DROP COLUMN IF EXISTS applicant1;
ALTER TABLE bridge_quotes DROP COLUMN IF EXISTS applicant2;
ALTER TABLE bridge_quotes DROP COLUMN IF EXISTS applicant3;
ALTER TABLE bridge_quotes DROP COLUMN IF EXISTS applicant4;

-- Add new borrower type columns
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS borrower_type text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS company_name text;

ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS borrower_type text;
ALTER TABLE bridge_quotes ADD COLUMN IF NOT EXISTS company_name text;
