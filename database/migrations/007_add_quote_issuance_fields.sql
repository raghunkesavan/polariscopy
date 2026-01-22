-- Add Quote issuance fields to quotes table (BTL)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS quote_selected_fee_ranges JSONB,
ADD COLUMN IF NOT EXISTS quote_assumptions JSONB,
ADD COLUMN IF NOT EXISTS quote_borrower_name TEXT,
ADD COLUMN IF NOT EXISTS quote_additional_notes TEXT,
ADD COLUMN IF NOT EXISTS quote_issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'Not Issued';

-- Add Quote issuance fields to bridge_quotes table (Bridging)
ALTER TABLE bridge_quotes 
ADD COLUMN IF NOT EXISTS quote_selected_fee_ranges JSONB,
ADD COLUMN IF NOT EXISTS quote_assumptions JSONB,
ADD COLUMN IF NOT EXISTS quote_borrower_name TEXT,
ADD COLUMN IF NOT EXISTS quote_additional_notes TEXT,
ADD COLUMN IF NOT EXISTS quote_issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'Not Issued';

-- Comments for documentation
COMMENT ON COLUMN quotes.quote_selected_fee_ranges IS 'Array of selected fee ranges (multi-select) for the quote';
COMMENT ON COLUMN quotes.quote_assumptions IS 'Array of assumptions included with the quote';
COMMENT ON COLUMN quotes.quote_borrower_name IS 'Borrower name for the quote';
COMMENT ON COLUMN quotes.quote_additional_notes IS 'Additional notes for the quote';
COMMENT ON COLUMN quotes.quote_issued_at IS 'Timestamp when quote was issued';
COMMENT ON COLUMN quotes.quote_status IS 'Status of Quote: Not Issued, Issued';

COMMENT ON COLUMN bridge_quotes.quote_selected_fee_ranges IS 'Array of selected fee ranges (multi-select) for the quote';
COMMENT ON COLUMN bridge_quotes.quote_assumptions IS 'Array of assumptions included with the quote';
COMMENT ON COLUMN bridge_quotes.quote_borrower_name IS 'Borrower name for the quote';
COMMENT ON COLUMN bridge_quotes.quote_additional_notes IS 'Additional notes for the quote';
COMMENT ON COLUMN bridge_quotes.quote_issued_at IS 'Timestamp when quote was issued';
COMMENT ON COLUMN bridge_quotes.quote_status IS 'Status of Quote: Not Issued, Issued';
