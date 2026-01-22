-- Migration 027: Add Full Interest Coupon and Full Interest BBR fields to bridge_quote_results
-- Purpose: Store total interest components over full loan term (not just rolled portion)
-- These fields complement rolled_interest_coupon and rolled_interest_bbr

-- Add fields to bridge_quote_results table
ALTER TABLE bridge_quote_results
  ADD COLUMN IF NOT EXISTS full_interest_coupon NUMERIC,
  ADD COLUMN IF NOT EXISTS full_interest_bbr NUMERIC;

-- Add comments to document field meanings
COMMENT ON COLUMN bridge_quote_results.full_interest_coupon IS 'Total coupon/margin interest over full loan term (£): Gross × (Coupon Monthly - Deferred Monthly) × Term';
COMMENT ON COLUMN bridge_quote_results.full_interest_bbr IS 'Total BBR interest over full loan term (£) for variable products: Gross × BBR Monthly × Term';
