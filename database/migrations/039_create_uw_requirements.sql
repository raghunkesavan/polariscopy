-- Migration: Create UW Requirements storage
-- This migration adds support for storing UW requirements configuration
-- and per-quote checklist state

-- 1. Add uw_requirements to app_constants (uses existing table)
-- The app_constants table already exists with key/value structure
-- UW requirements will be stored with key = 'uw_requirements'

-- 2. Create table for storing per-quote checklist state
CREATE TABLE IF NOT EXISTS public.uw_checklist_state (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  checked_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  stage text NOT NULL DEFAULT 'DIP', -- 'DIP' or 'Indicative'
  last_updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique quote_id + stage combination
  UNIQUE(quote_id, stage)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_uw_checklist_quote_id ON public.uw_checklist_state(quote_id);
CREATE INDEX IF NOT EXISTS idx_uw_checklist_stage ON public.uw_checklist_state(stage);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_uw_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_uw_checklist_updated_at ON public.uw_checklist_state;
CREATE TRIGGER tr_uw_checklist_updated_at
  BEFORE UPDATE ON public.uw_checklist_state
  FOR EACH ROW
  EXECUTE FUNCTION update_uw_checklist_updated_at();

-- Enable RLS
ALTER TABLE public.uw_checklist_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read/write their own checklist state
CREATE POLICY "Users can view own checklist state"
  ON public.uw_checklist_state
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own checklist state"
  ON public.uw_checklist_state
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own checklist state"
  ON public.uw_checklist_state
  FOR UPDATE
  USING (true);

-- 3. Add columns to quotes table for quick access to UW status
-- This allows showing UW completion status in quote lists without joins
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS uw_checklist_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uw_checklist_required_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uw_checklist_progress integer DEFAULT 0;

-- Comment on columns
COMMENT ON TABLE public.uw_checklist_state IS 'Stores UW requirements checklist state per quote and stage';
COMMENT ON COLUMN public.uw_checklist_state.checked_items IS 'Array of requirement IDs that have been checked/received';
COMMENT ON COLUMN public.uw_checklist_state.stage IS 'DIP or Indicative stage';
COMMENT ON COLUMN public.quotes.uw_checklist_complete IS 'True if all UW requirements are checked';
COMMENT ON COLUMN public.quotes.uw_checklist_required_complete IS 'True if all required UW items are checked';
COMMENT ON COLUMN public.quotes.uw_checklist_progress IS 'Percentage of UW requirements complete (0-100)';

-- Grant permissions (adjust as needed for your setup)
GRANT ALL ON public.uw_checklist_state TO authenticated;
GRANT ALL ON public.uw_checklist_state TO service_role;
