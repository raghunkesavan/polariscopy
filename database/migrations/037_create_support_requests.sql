-- Migration: Create support_requests table
-- Description: Store support requests from users with read/unread status for admin notifications

-- Create support_requests table
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    bug_type VARCHAR(100),
    suggestion TEXT,
    page VARCHAR(100) DEFAULT 'Products',
    is_read BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, resolved, closed
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries on unread requests
CREATE INDEX IF NOT EXISTS idx_support_requests_is_read ON support_requests(is_read);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert support requests (public form submission)
CREATE POLICY "Anyone can create support requests"
ON support_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Only admins can view all support requests
CREATE POLICY "Admins can view all support requests"
ON support_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.access_level = 1
    )
);

-- Policy: Only admins can update support requests
CREATE POLICY "Admins can update support requests"
ON support_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.access_level = 1
    )
);

-- Policy: Only admins can delete support requests
CREATE POLICY "Admins can delete support requests"
ON support_requests FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.access_level = 1
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_support_requests_updated_at ON support_requests;
CREATE TRIGGER trigger_update_support_requests_updated_at
    BEFORE UPDATE ON support_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_support_requests_updated_at();

-- Comment on table
COMMENT ON TABLE support_requests IS 'Stores user support requests with admin notification tracking';
