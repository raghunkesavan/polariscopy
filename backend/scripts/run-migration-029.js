import { supabase } from './config/supabase.js';
import fs from 'fs';

const sql = fs.readFileSync('./database/migrations/029_add_funding_line.sql', 'utf8');

// Split by semicolons and execute each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s !== '');

console.log(`Executing ${statements.length} SQL statements...`);

for (const statement of statements) {
  if (statement) {
    console.log(`Executing: ${statement.substring(0, 80)}...`);
    const { data, error } = await supabase.rpc('exec', { query: statement });
    if (error) {
      console.error('Error executing statement:', error);
      console.error('Statement was:', statement);
    } else {
      console.log('✓ Success');
    }
  }
}

console.log('Migration complete!');
process.exit(0);
