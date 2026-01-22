-- Create a new table 'bridging_quotes_v2' with the desired schema
CREATE TABLE bridging_quotes_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    user_id uuid,
    status text,
    calculator_type text,
    product_scope text,
    property_value numeric,
    gross_loan numeric,
    monthly_rent numeric,
    top_slicing numeric,
    use_specific_net_loan boolean,
    specific_net_loan numeric,
    bridging_loan_term integer,
    charge_type text,
    sub_product text,
    criteria_answers jsonb,
    results jsonb,
    borrower_name text,
    applicant1 text,
    applicant2 text,
    applicant3 text,
    applicant4 text,
    notes text,
    updated_at timestamp with time zone,
    PRIMARY KEY (id)
);

-- Copy data from the old 'bridge_quotes' table to the new table
-- This is a sample, you might need to adjust it based on your 'payload' structure
INSERT INTO bridging_quotes_v2 (id, created_at, name, user_id, status, calculator_type, product_scope, property_value, gross_loan, monthly_rent, top_slicing, use_specific_net_loan, specific_net_loan, bridging_loan_term, updated_at, criteria_answers)
SELECT
    id,
    created_at,
    name,
    user_id::uuid,
    status,
    'BRIDGING',
    payload->'calculationData'->>'productScope',
    NULLIF(payload->'calculationData'->>'propertyValue', '')::numeric,
    NULLIF(payload->'calculationData'->>'grossLoan', '')::numeric,
    NULLIF(payload->'calculationData'->>'monthlyRent', '')::numeric,
    NULLIF(payload->'calculationData'->>'topSlicing', '')::numeric,
    (payload->'calculationData'->>'useSpecificNet')::boolean,
    NULLIF(payload->'calculationData'->>'specificNetLoan', '')::numeric,
    NULLIF(payload->'calculationData'->>'bridgingTerm', '')::integer,
    updated_at,
    payload->'criteria_answers'
FROM bridge_quotes
WHERE calculator_type = 'BRIDGING';

-- Rename old table for backup
ALTER TABLE bridge_quotes RENAME TO bridge_quotes_old;

-- Rename new table to 'bridge_quotes'
ALTER TABLE bridging_quotes_v2 RENAME TO bridge_quotes;

-- Optionally, you can drop the old table after verifying the data
-- DROP TABLE bridge_quotes_old;

-- Add foreign key constraint if you have a users table
-- ALTER TABLE bridge_quotes ADD CONSTRAINT bridge_quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
