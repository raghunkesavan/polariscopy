-- Add product_range column for DIP (Core or Specialist)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS product_range TEXT;

ALTER TABLE bridge_quotes 
ADD COLUMN IF NOT EXISTS product_range TEXT;

-- Comments
COMMENT ON COLUMN quotes.product_range IS 'Product range selection for DIP: Core or Specialist';
COMMENT ON COLUMN bridge_quotes.product_range IS 'Product range selection for DIP: Core or Specialist';
