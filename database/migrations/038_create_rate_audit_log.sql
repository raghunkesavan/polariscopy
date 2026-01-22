-- Migration: Create rate_audit_log table for tracking rate changes
-- Date: 2025-12-05

-- Create the audit log table
CREATE TABLE IF NOT EXISTS rate_audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- What was changed
    table_name TEXT NOT NULL,  -- 'bridge_fusion_rates_full' or 'rates_flat'
    record_id BIGINT NOT NULL,  -- ID of the rate record that was changed
    
    -- Change details
    field_name TEXT NOT NULL,  -- 'rate', 'min_loan', 'max_loan', etc.
    old_value TEXT,
    new_value TEXT,
    
    -- Context
    set_key TEXT,
    product TEXT,
    property TEXT,
    min_ltv TEXT,
    max_ltv TEXT,
    
    -- Who made the change
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_name TEXT,
    
    -- When
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_rate_audit_log_created_at ON rate_audit_log(created_at DESC);
CREATE INDEX idx_rate_audit_log_user_id ON rate_audit_log(user_id);
CREATE INDEX idx_rate_audit_log_table_record ON rate_audit_log(table_name, record_id);
CREATE INDEX idx_rate_audit_log_set_key ON rate_audit_log(set_key);

-- Enable RLS
ALTER TABLE rate_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can view all audit logs
CREATE POLICY "Admin can view audit logs"
    ON rate_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.access_level = 1
        )
    );

-- Policy: Service role can insert audit logs (backend inserts)
CREATE POLICY "Service role can insert audit logs"
    ON rate_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE rate_audit_log IS 'Audit trail for all rate changes made through the Products page';
