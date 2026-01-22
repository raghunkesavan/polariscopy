-- Add password reset token functionality to users table
-- Allows users to reset forgotten passwords via token

ALTER TABLE users 
ADD COLUMN password_reset_token TEXT,
ADD COLUMN password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token) 
WHERE password_reset_token IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN users.password_reset_token IS 'Secure token for password reset (UUID format)';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration time for password reset token (typically 1 hour from creation)';
