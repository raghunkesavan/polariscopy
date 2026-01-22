-- Migration: Add custom_requirements field to uw_checklist_state
-- This allows storing per-quote custom requirement descriptions
-- so edits don't affect other quotes globally

-- Add custom_requirements column to store modified requirement descriptions
ALTER TABLE public.uw_checklist_state
  ADD COLUMN IF NOT EXISTS custom_requirements jsonb DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.uw_checklist_state.custom_requirements IS 'Stores custom/edited requirement descriptions per quote. JSON array matching requirement structure.';
