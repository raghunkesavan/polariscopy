-- Create a new table 'btl_quotes_v2' with the desired schema
CREATE TABLE btl_quotes_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    user_id uuid,
    status text,
    calculator_type text,
    product_scope text,
    retention_choice text,
    retention_ltv integer,
    tier integer,
    property_value numeric,
    monthly_rent numeric,
    top_slicing numeric,
    loan_calculation_requested text,
    specific_gross_loan numeric,
    specific_net_loan numeric,
    target_ltv integer,
    product_type text,
    add_fees_toggle boolean,
    fee_calculation_type text,
    additional_fee_amount numeric,
    selected_range text,
    criteria_answers jsonb,
    rates_and_products jsonb,
    borrower_name text,
    applicant1 text,
    applicant2 text,
    applicant3 text,
    applicant4 text,
    notes text,
    updated_at timestamp with time zone,
    PRIMARY KEY (id)
);

-- Copy data from the old 'quotes' table to the new table
-- This is a sample, you might need to adjust it based on your 'payload' structure
INSERT INTO btl_quotes_v2 (id, created_at, name, user_id, status, calculator_type, product_scope, product_type, property_value, monthly_rent, specific_net_loan, specific_gross_loan, updated_at, criteria_answers)
SELECT
    id,
    created_at,
    name,
    user_id::uuid,
    status,
    'BTL',
    payload->'calculationData'->>'productScope',
    payload->'calculationData'->>'productType',
    NULLIF(payload->'calculationData'->>'propertyValue', '')::numeric,
    NULLIF(payload->'calculationData'->>'monthlyRent', '')::numeric,
    NULLIF(payload->'calculationData'->>'specificNetLoan', '')::numeric,
    NULLIF(payload->'calculationData'->>'specificGrossLoan', '')::numeric,
    updated_at,
    payload->'criteria_answers'
FROM quotes
WHERE calculator_type = 'BTL';

-- Rename old table for backup
ALTER TABLE quotes RENAME TO quotes_old;

-- Rename new table to 'quotes'
ALTER TABLE btl_quotes_v2 RENAME TO quotes;

-- Optionally, you can drop the old table after verifying the data
-- DROP TABLE quotes_old;

-- Add foreign key constraint if you have a users table
-- ALTER TABLE quotes ADD CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
