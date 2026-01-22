-- Add title_insurance_cost field to quote results tables and row ordering to app_constants

-- Add title_insurance_cost to quote_results (BTL)
ALTER TABLE quote_results ADD COLUMN IF NOT EXISTS title_insurance_cost NUMERIC;

COMMENT ON COLUMN quote_results.title_insurance_cost IS 'Title insurance cost for the BTL loan';

-- Add title_insurance_cost to bridge_quote_results (Bridging)
ALTER TABLE bridge_quote_results ADD COLUMN IF NOT EXISTS title_insurance_cost NUMERIC;

COMMENT ON COLUMN bridge_quote_results.title_insurance_cost IS 'Title insurance cost for the bridging loan';

-- Add row_order configuration to app_constants for results table row ordering
ALTER TABLE app_constants ADD COLUMN IF NOT EXISTS results_row_order JSONB;

COMMENT ON COLUMN app_constants.results_row_order IS 'Display order configuration for results table rows (JSON object with btl and bridge arrays)';

-- Initialize default row ordering (matching current display order in calculators)
INSERT INTO app_constants (key, results_row_order)
VALUES (
  'results_table_row_order',
  '{
    "btl": [
      "Pay Rate",
      "Revert Rate",
      "Deferred Interest %",
      "Rolled Months",
      "Product Fee %",
      "Gross Loan",
      "Net Loan",
      "LTV",
      "ICR",
      "APRC",
      "Product Fee £",
      "Deferred Interest £",
      "Rolled Months Interest",
      "Serviced Months",
      "Serviced Interest",
      "Total Cost to Borrower",
      "NBP",
      "Direct Debit",
      "Monthly Interest Cost",
      "Broker Client Fee",
      "Broker Commission (Proc Fee %)",
      "Broker Commission (Proc Fee £)",
      "Admin Fee",
      "ERC",
      "Exit Fee",
      "Net LTV",
      "Revert Rate DD",
      "Title Insurance Cost",
      "Initial Term",
      "Full Term"
    ],
    "bridge": [
      "APRC",
      "Rolled Months",
      "Deferred Interest %",
      "Product Fee %",
      "Admin Fee",
      "Broker Client Fee",
      "Commitment Fee £",
      "Deferred Interest £",
      "Direct Debit",
      "Exit Fee",
      "Gross Loan",
      "ICR",
      "LTV",
      "Monthly Interest Cost",
      "NBP",
      "Net Loan",
      "Net LTV",
      "Pay Rate",
      "Product Fee £",
      "Revert Rate",
      "Revert Rate DD",
      "Rolled Months Interest",
      "Serviced Interest",
      "Title Insurance Cost",
      "Broker Commission (Proc Fee %)",
      "Broker Commission (Proc Fee £)",
      "ERC 1 £",
      "ERC 2 £",
      "Full Int BBR £",
      "Full Int Coupon £",
      "Total Interest",
      "Full Term",
      "Initial Term",
      "Serviced Months"
    ],
    "core": [
      "Pay Rate",
      "Revert Rate",
      "Product Fee %",
      "Rolled Months",
      "Deferred Interest %",
      "Gross Loan",
      "Net Loan",
      "APRC",
      "Admin Fee",
      "Broker Client Fee",
      "Broker Commission (Proc Fee %)",
      "Broker Commission (Proc Fee £)",
      "Deferred Interest £",
      "Direct Debit",
      "ERC",
      "Exit Fee",
      "ICR",
      "LTV",
      "Monthly Interest Cost",
      "NBP",
      "Net LTV",
      "Product Fee £",
      "Revert Rate DD",
      "Rolled Months Interest",
      "Serviced Months",
      "Serviced Interest",
      "Title Insurance Cost",
      "Total Cost to Borrower",
      "Full Term",
      "Initial Term"
    ]
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET 
  results_row_order = CASE 
    WHEN app_constants.results_row_order IS NULL THEN EXCLUDED.results_row_order 
    ELSE app_constants.results_row_order 
  END,
  updated_at = NOW();
