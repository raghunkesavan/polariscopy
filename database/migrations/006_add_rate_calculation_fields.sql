-- Create quote_results table to store multiple calculated rate results per BTL quote
CREATE TABLE IF NOT EXISTS quote_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
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
  serviced_interest NUMERIC,
  
  -- Direct debit & ERC
  direct_debit TEXT,
  erc TEXT,
  
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
CREATE INDEX idx_quote_results_quote_id ON quote_results(quote_id);

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
CREATE INDEX idx_bridge_quote_results_quote_id ON bridge_quote_results(quote_id);

-- Add comments for documentation
COMMENT ON TABLE quote_results IS 'Stores multiple calculated rate results for each BTL quote';
COMMENT ON TABLE bridge_quote_results IS 'Stores multiple calculated rate results for each Bridging quote';

COMMENT ON COLUMN quote_results.fee_column IS 'Fee column identifier (e.g., "2.00", "3.00", "6.00")';
COMMENT ON COLUMN quote_results.gross_loan IS 'Calculated gross loan amount';
COMMENT ON COLUMN quote_results.net_loan IS 'Calculated net loan amount';
COMMENT ON COLUMN quote_results.ltv_percentage IS 'Calculated Loan-to-Value ratio';
COMMENT ON COLUMN quote_results.icr IS 'Interest Coverage Ratio';
COMMENT ON COLUMN quote_results.initial_rate IS 'Initial interest rate';
COMMENT ON COLUMN quote_results.pay_rate IS 'Pay rate';
COMMENT ON COLUMN quote_results.product_fee_pounds IS 'Product fee in pounds';
COMMENT ON COLUMN quote_results.monthly_interest_cost IS 'Monthly interest cost';
COMMENT ON COLUMN quote_results.total_cost_to_borrower IS 'Total cost to borrower';
COMMENT ON COLUMN quote_results.product_name IS 'Selected product name';

COMMENT ON COLUMN bridge_quote_results.fee_column IS 'Fee column identifier for bridge products';
COMMENT ON COLUMN bridge_quote_results.erc_fusion_only IS 'Early Repayment Charge (Fusion products only)';
COMMENT ON COLUMN bridge_quote_results.deferred_rate IS 'Deferred interest rate for bridging';
