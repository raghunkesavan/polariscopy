-- Migration: Create users table and authentication system
-- This enables email/password authentication with role-based access control

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    access_level INTEGER NOT NULL CHECK (access_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_access_level ON users(access_level);

-- Create enum-like documentation comment for access levels
COMMENT ON COLUMN users.access_level IS '1=Admin, 2=UW Team Lead, 3=Head of UW, 4=Underwriter, 5=Product Team';

-- Add RLS policies (Row Level Security) for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Policy: Users can update their own data (except access_level)
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Add user tracking to existing tables (only if tables exist)
-- Add created_by and updated_by to quotes tables if not exists
DO $$ 
BEGIN
    -- Check if btl_quotes table exists before adding columns
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'btl_quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'btl_quotes' AND column_name = 'created_by_user_id') THEN
            ALTER TABLE btl_quotes ADD COLUMN created_by_user_id UUID REFERENCES users(id);
            ALTER TABLE btl_quotes ADD COLUMN updated_by_user_id UUID REFERENCES users(id);
        END IF;
    END IF;
    
    -- Check if bridging_quotes table exists before adding columns
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'bridging_quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'bridging_quotes' AND column_name = 'created_by_user_id') THEN
            ALTER TABLE bridging_quotes ADD COLUMN created_by_user_id UUID REFERENCES users(id);
            ALTER TABLE bridging_quotes ADD COLUMN updated_by_user_id UUID REFERENCES users(id);
        END IF;
    END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (password: 'admin123' - CHANGE THIS IN PRODUCTION!)
-- Password hash generated with bcrypt for 'admin123'
INSERT INTO users (email, password_hash, name, access_level)
VALUES (
    'admin@polaris.local',
    '$2b$10$j5U0WeQ3Re7fiez0IQgG0el.jITKgGkHHeRJNODgY8vIeKEXirn26',
    'Admin User',
    1
)
ON CONFLICT (email) DO NOTHING;

-- Create audit log table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

COMMENT ON TABLE audit_logs IS 'Audit trail for user actions on rates, criteria, and constants';
