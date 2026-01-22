-- SQL to create bridge_quote_results table
-- Run this in your Supabase SQL Editor if the table doesn't exist

-- Create bridge_quote_results table to store multiple calculated rate results per Bridging quote
CREATE TABLE IF NOT EXISTS bridge_quote_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES bridge_quotes(id) ON DELETE CASCADE,
  
  -- Fee column identifier
  fee_column TEXT,
  
  -- Loan calculations
  gross_loan NUMERIC,
  net_loan NUMERIC,
  ltv_percentage NUMERIC,
  net_ltv NUMERIC,
  property_value NUMERIC,
  
  -- Interest Coverage & Performance
  icr NUMERIC,
  
  -- Rates
  initial_rate NUMERIC,
  pay_rate NUMERIC,
  revert_rate NUMERIC,
  revert_rate_dd NUMERIC,
  full_rate NUMERIC,
  aprc NUMERIC,
  
  -- Fees
  product_fee_percent NUMERIC,
  product_fee_pounds NUMERIC,
  admin_fee NUMERIC,
  broker_client_fee NUMERIC,
  broker_commission_proc_fee_percent NUMERIC,
  broker_commission_proc_fee_pounds NUMERIC,
  commitment_fee_pounds NUMERIC,
  exit_fee NUMERIC,
  
  -- Interest calculations
  monthly_interest_cost NUMERIC,
  rolled_months NUMERIC,
  rolled_months_interest NUMERIC,
  deferred_interest_percent NUMERIC,
  deferred_interest_pounds NUMERIC,
  deferred_rate NUMERIC,
  serviced_interest NUMERIC,
  
  -- Direct debit & ERC
  direct_debit TEXT,
  erc TEXT,
  erc_fusion_only TEXT,
  
  -- Other calculations
  rent NUMERIC,
  top_slicing NUMERIC,
  nbp NUMERIC,
  total_cost_to_borrower NUMERIC,
  total_loan_term NUMERIC,
  
  -- Product information
  product_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by quote_id
CREATE INDEX IF NOT EXISTS idx_bridge_quote_results_quote_id ON bridge_quote_results(quote_id);

-- Add comments for documentation
COMMENT ON TABLE bridge_quote_results IS 'Stores multiple calculated rate results for each Bridging quote';
COMMENT ON COLUMN bridge_quote_results.fee_column IS 'Fee column identifier for bridge products';
COMMENT ON COLUMN bridge_quote_results.erc_fusion_only IS 'Early Repayment Charge (Fusion products only)';
COMMENT ON COLUMN bridge_quote_results.deferred_rate IS 'Deferred interest rate for bridging';
