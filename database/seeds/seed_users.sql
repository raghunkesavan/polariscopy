-- Seed Users Script
-- This creates multiple test users with bcrypt-hashed passwords
-- Default password for all users: "Test123!"
-- Access Levels: 1=Admin, 2=UW Team Lead, 3=Head of UW, 4=Underwriter, 5=Product Team

-- IMPORTANT: These bcrypt hashes are for password "Test123!" with salt rounds = 10
-- In production, use strong unique passwords!

-- Clear existing test users (optional - comment out if you want to keep existing users)
-- DELETE FROM users WHERE email LIKE '%@test.com';

-- Insert test users
INSERT INTO users (email, password_hash, name, access_level, is_active) VALUES
-- Admin Users (Level 1)
('admin@test.com', '$2b$10$YourBcryptHashHere', 'Admin User', 1, true),
('john.admin@test.com', '$2b$10$YourBcryptHashHere', 'John Admin', 1, true),

-- UW Team Lead (Level 2)  
('teamlead@test.com', '$2b$10$YourBcryptHashHere', 'Team Lead User', 2, true),
('sarah.lead@test.com', '$2b$10$YourBcryptHashHere', 'Sarah Team Lead', 2, true),

-- Head of UW (Level 3)
('headofuw@test.com', '$2b$10$YourBcryptHashHere', 'Head of UW', 3, true),
('mike.head@test.com', '$2b$10$YourBcryptHashHere', 'Mike Head', 3, true),

-- Underwriter (Level 4)
('underwriter@test.com', '$2b$10$YourBcryptHashHere', 'Underwriter User', 4, true),
('jane.uw@test.com', '$2b$10$YourBcryptHashHere', 'Jane Underwriter', 4, true),
('bob.uw@test.com', '$2b$10$YourBcryptHashHere', 'Bob Underwriter', 4, true),

-- Product Team (Level 5)
('product@test.com', '$2b$10$YourBcryptHashHere', 'Product User', 5, true),
('alex.product@test.com', '$2b$10$YourBcryptHashHere', 'Alex Product', 5, true)

ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify users were created
SELECT id, email, name, access_level, is_active, created_at FROM users ORDER BY access_level, email;
