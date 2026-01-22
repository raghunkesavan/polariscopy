-- Seed Users Script
-- Generated: 2026-01-08T14:03:15.876Z
-- Default password for all users: "Test123!"
-- Access Levels: 1=Admin, 2=UW Team Lead, 3=Head of UW, 4=Underwriter, 5=Product Team

-- IMPORTANT: Change passwords immediately in production!

-- Clear existing test users (optional - uncomment if needed)
-- DELETE FROM users WHERE email LIKE '%@test.com';

-- Insert test users
INSERT INTO users (email, password_hash, name, access_level, is_active) VALUES
('jo.heywood@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Jo Heywood', 4, true),
('hugh.mcgarahan@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Hugh McGarahan', 4, true),
('samantha.curtis@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Samantha Curtis', 4, true),
('steve.jones@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Steve Jones', 4, true),
('charlesk@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Charles Kasote', 4, true),
('omkar@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Omkar Hushing', 4, true),
('scott@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Scott Lord', 4, true),
('karen.rodrigues@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Karen Rodrigues', 4, true),
('liza.campion@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Liza Campion', 4, true),
('kateryna.bilokur@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Kateryna Bilokur', 4, true),
('jon.williams@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Jon Williams', 4, true),
('emmaleigh@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Emma-Leigh Williams', 4, true),
('george.collins@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'George Collins', 4, true),
('jemima@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Jemima Hayes', 4, true),
('rio.norris@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Rio Norris', 4, true),
('emily.cope@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Emily Cope', 4, true),
('sasha.du@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Sasha Du', 4, true),
('theo.osborn@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Theo Osborn', 4, true),
('donald.idendo@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Donald Idendo', 4, true),
('alec.lawrence@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Alec Lawrence', 4, true),
('ross@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Ross Laurie', 4, true),
('john.cyganek@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'John Cyganek', 4, true),
('ollie.watts@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Ollie Watts', 4, true),
('craig@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Craig Rieselson', 4, true),
('shaun@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Shaun Bains', 4, true),
('agnieszka@mfsuk.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Agnieszka Chmarowska', 4, true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify users were created
SELECT id, email, name, access_level, is_active, created_at FROM users ORDER BY access_level, email;
