/**
 * Export Data from Supabase to JSON files
 * Run this script before migrating to Azure SQL
 * 
 * Usage: node export-from-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../../backend/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Output directory for exported data
const OUTPUT_DIR = path.join(__dirname, 'exported-data');

// Tables to export
const TABLES = [
  'users',
  'btl_quotes',
  'bridging_quotes',
  'rates',
  'app_constants',
  'support_requests',
  'audit_logs',
  'password_reset_tokens',
  'rate_audit_log',
  'uw_requirements',
];

/**
 * Export a single table to JSON file
 */
async function exportTable(tableName) {
  console.log(`📥 Exporting ${tableName}...`);
  
  try {
    // Fetch all records in batches
    let allRecords = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, from + batchSize - 1);

      if (error) {
        throw error;
      }

      allRecords = allRecords.concat(data);
      
      console.log(`  ├─ Fetched ${data.length} records (${allRecords.length} total)`);
      
      hasMore = data.length === batchSize;
      from += batchSize;
    }

    // Write to file
    const filename = path.join(OUTPUT_DIR, `${tableName}.json`);
    await fs.writeFile(
      filename,
      JSON.stringify(allRecords, null, 2),
      'utf8'
    );

    console.log(`  └─ ✓ Exported ${allRecords.length} records to ${tableName}.json`);
    
    return {
      table: tableName,
      count: allRecords.length,
      success: true,
    };
  } catch (error) {
    console.error(`  └─ ❌ Error exporting ${tableName}:`, error.message);
    return {
      table: tableName,
      count: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main export function
 */
async function exportAllTables() {
  console.log('🚀 Starting Supabase Data Export');
  console.log('='.repeat(50));
  
  // Create output directory
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  } catch (error) {
    console.error('❌ Failed to create output directory:', error);
    process.exit(1);
  }

  // Export metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    supabaseUrl: supabaseUrl,
    tables: [],
  };

  // Export each table
  for (const tableName of TABLES) {
    const result = await exportTable(tableName);
    metadata.tables.push(result);
    console.log(''); // Empty line for readability
  }

  // Write metadata file
  await fs.writeFile(
    path.join(OUTPUT_DIR, '_metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf8'
  );

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Export Summary:');
  console.log('='.repeat(50));
  
  const successful = metadata.tables.filter(t => t.success);
  const failed = metadata.tables.filter(t => !t.success);
  
  successful.forEach(table => {
    console.log(`✓ ${table.table.padEnd(30)} ${table.count.toString().padStart(6)} records`);
  });
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Exports:');
    failed.forEach(table => {
      console.log(`✗ ${table.table.padEnd(30)} ${table.error}`);
    });
  }
  
  const totalRecords = successful.reduce((sum, t) => sum + t.count, 0);
  console.log('='.repeat(50));
  console.log(`Total Records Exported: ${totalRecords}`);
  console.log(`Success: ${successful.length}/${TABLES.length} tables`);
  console.log('='.repeat(50));
  
  console.log('\n✅ Export complete!');
  console.log(`📁 Data saved to: ${OUTPUT_DIR}`);
  console.log('\n📋 Next Steps:');
  console.log('1. Review exported JSON files');
  console.log('2. Run Azure SQL migration script to create tables');
  console.log('3. Run import-to-azure-sql.js to import data');
}

// Run export
exportAllTables()
  .then(() => {
    console.log('\n✅ Export process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Export process failed:', error);
    process.exit(1);
  });
