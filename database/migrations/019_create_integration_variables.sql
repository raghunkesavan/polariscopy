-- Create a table to store integration variables (Vercel-style)
-- Safe IF NOT EXISTS guards to avoid breaking deploys

CREATE TABLE IF NOT EXISTS public.integration_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  scope TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS ix_integration_variables_active ON public.integration_variables (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS uq_integration_variables_key ON public.integration_variables (key);
