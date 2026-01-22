#!/usr/bin/env node
/**
 * Generate Users Seed Script with Bcrypt Hashes
 * This script creates a SQL file with properly hashed passwords
 * 
 * Usage: node generateUsersSeed.js
 */

import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Test123!'; // Change this for production!

// Define test users
const users = [
  // Admin Users (Level 1)
  { email: 'admin@test.com', name: 'Admin User', accessLevel: 1 },
  { email: 'john.admin@test.com', name: 'John Admin', accessLevel: 1 },
  
  // UW Team Lead (Level 2)
  { email: 'teamlead@test.com', name: 'Team Lead User', accessLevel: 2 },
  { email: 'sarah.lead@test.com', name: 'Sarah Team Lead', accessLevel: 2 },
  
  // Head of UW (Level 3)
  { email: 'headofuw@test.com', name: 'Head of UW', accessLevel: 3 },
  { email: 'mike.head@test.com', name: 'Mike Head', accessLevel: 3 },
  
  // Underwriter (Level 4)
  { email: 'underwriter@test.com', name: 'Underwriter User', accessLevel: 4 },
  { email: 'jane.uw@test.com', name: 'Jane Underwriter', accessLevel: 4 },
  { email: 'bob.uw@test.com', name: 'Bob Underwriter', accessLevel: 4 },
  
  // Product Team (Level 5)
  { email: 'product@test.com', name: 'Product User', accessLevel: 5 },
  { email: 'alex.product@test.com', name: 'Alex Product', accessLevel: 5 },
];

async function generateSeedScript() {
  console.log('🔐 Generating bcrypt hashes...');
  console.log(`📝 Default password: ${DEFAULT_PASSWORD}`);
  console.log('');

  // Generate password hash once (same for all users in this example)
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  
  // Build SQL script
  let sql = `-- Seed Users Script
-- Generated: ${new Date().toISOString()}
-- Default password for all users: "${DEFAULT_PASSWORD}"
-- Access Levels: 1=Admin, 2=UW Team Lead, 3=Head of UW, 4=Underwriter, 5=Product Team

-- IMPORTANT: Change passwords immediately in production!

-- Clear existing test users (optional - uncomment if needed)
-- DELETE FROM users WHERE email LIKE '%@test.com';

-- Insert test users
INSERT INTO users (email, password_hash, name, access_level, is_active) VALUES\n`;

  const userValues = [];
  for (const user of users) {
    // Each user gets the same hash (same password)
    // In production, you might want unique passwords
    userValues.push(
      `('${user.email}', '${passwordHash}', '${user.name}', ${user.accessLevel}, true)`
    );
  }

  sql += userValues.join(',\n');
  
  sql += `\nON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify users were created
SELECT id, email, name, access_level, is_active, created_at FROM users ORDER BY access_level, email;\n`;

  // Write to file
  const outputPath = path.join(__dirname, '..', '..', 'database', 'seeds', 'seed_users_generated.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  
  console.log('✅ SQL seed file generated successfully!');
  console.log(`📁 Location: ${outputPath}`);
  console.log('');
  console.log('📋 Users created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach(u => {
    const role = ['', 'Admin', 'UW Team Lead', 'Head of UW', 'Underwriter', 'Product Team'][u.accessLevel];
    console.log(`  ${u.email.padEnd(30)} | ${role}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🚀 To apply this seed:');
  console.log('   1. Open Supabase SQL Editor');
  console.log('   2. Copy the contents of seed_users_generated.sql');
  console.log('   3. Run the SQL');
  console.log('   4. Users will appear in your UI immediately');
  console.log('');
  console.log('🔑 Login credentials for all users:');
  console.log(`   Password: ${DEFAULT_PASSWORD}`);
  console.log('');
}

// Run the generator
generateSeedScript().catch(err => {
  console.error('❌ Error generating seed script:', err);
  process.exit(1);
});
