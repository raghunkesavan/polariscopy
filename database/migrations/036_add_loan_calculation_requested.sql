-- Add loan_calculation_requested column to bridge_quotes table
-- This stores whether the user selected "Gross loan" or "Net loan" calculation type

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bridge_quotes' 
    AND column_name = 'loan_calculation_requested'
  ) THEN
    ALTER TABLE bridge_quotes 
    ADD COLUMN loan_calculation_requested TEXT DEFAULT 'Gross loan';
    
    RAISE NOTICE 'Added loan_calculation_requested column to bridge_quotes';
  ELSE
    RAISE NOTICE 'loan_calculation_requested column already exists in bridge_quotes';
  END IF;
END $$;
