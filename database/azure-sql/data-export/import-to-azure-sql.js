/**
 * Import Data from JSON files to Azure SQL Database
 * Run this script after:
 * 1. Running master_migration.sql to create tables
 * 2. Running export-from-supabase.js to export data
 * 
 * Usage: node import-to-azure-sql.js
 */

import sql from 'mssql';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../../backend/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Azure SQL configuration
const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  port: parseInt(process.env.AZURE_SQL_PORT || '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 60000, // Increased for large imports
  },
};

// Validate configuration
if (!config.server || !config.database || !config.user || !config.password) {
  console.error('❌ Missing Azure SQL credentials');
  console.error('Make sure these environment variables are set:');
  console.error('- AZURE_SQL_SERVER');
  console.error('- AZURE_SQL_DATABASE');
  console.error('- AZURE_SQL_USER');
  console.error('- AZURE_SQL_PASSWORD');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, 'exported-data');

// Import order (respects foreign key dependencies)
const IMPORT_ORDER = [
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
 * Convert PostgreSQL data types to Azure SQL compatible values
 */
function convertValue(value, columnName) {
  if (value === null || value === undefined) {
    return null;
  }

  // Convert boolean to bit
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  // Convert JSON objects/arrays to string
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  // Convert PostgreSQL timestamps
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(value);
  }

  return value;
}

/**
 * Import a single table
 */
async function importTable(pool, tableName) {
  console.log(`📤 Importing ${tableName}...`);

  try {
    // Read JSON file
    const filename = path.join(DATA_DIR, `${tableName}.json`);
    const fileContent = await fs.readFile(filename, 'utf8');
    const records = JSON.parse(fileContent);

    if (records.length === 0) {
      console.log(`  └─ ⚠️  No records to import`);
      return { table: tableName, count: 0, success: true };
    }

    // Get column names from first record
    const columns = Object.keys(records[0]);

    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      let importedCount = 0;
      const batchSize = 100;

      // Import in batches
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        for (const record of batch) {
          const request = new sql.Request(transaction);

          // Build parameterized INSERT query
          const columnList = columns.join(', ');
          const paramList = columns.map(col => `@${col}`).join(', ');
          const query = `INSERT INTO ${tableName} (${columnList}) VALUES (${paramList})`;

          // Add parameters
          columns.forEach(col => {
            const value = convertValue(record[col], col);
            
            // Detect and set appropriate SQL type
            if (value === null) {
              request.input(col, sql.NVarChar, null);
            } else if (typeof value === 'number') {
              if (Number.isInteger(value)) {
                request.input(col, sql.Int, value);
              } else {
                request.input(col, sql.Float, value);
              }
            } else if (value instanceof Date) {
              request.input(col, sql.DateTimeOffset, value);
            } else if (typeof value === 'string') {
              // Check if it's a GUID
              if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                request.input(col, sql.UniqueIdentifier, value);
              } else {
                request.input(col, sql.NVarChar, value);
              }
            } else {
              request.input(col, sql.NVarChar, String(value));
            }
          });

          await request.query(query);
          importedCount++;
        }

        console.log(`  ├─ Imported ${importedCount}/${records.length} records`);
      }

      await transaction.commit();
      console.log(`  └─ ✓ Successfully imported ${importedCount} records`);

      return {
        table: tableName,
        count: importedCount,
        success: true,
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error(`  └─ ❌ Error importing ${tableName}:`, error.message);
    return {
      table: tableName,
      count: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main import function
 */
async function importAllTables() {
  console.log('🚀 Starting Azure SQL Data Import');
  console.log('='.repeat(50));

  // Check if data directory exists
  try {
    await fs.access(DATA_DIR);
    console.log(`📁 Data directory: ${DATA_DIR}\n`);
  } catch (error) {
    console.error('❌ Data directory not found!');
    console.error('Please run export-from-supabase.js first');
    process.exit(1);
  }

  // Connect to Azure SQL
  let pool;
  try {
    console.log('🔌 Connecting to Azure SQL...');
    pool = await sql.connect(config);
    console.log('✅ Connected to Azure SQL Database\n');
  } catch (error) {
    console.error('❌ Failed to connect to Azure SQL:', error.message);
    process.exit(1);
  }

  const results = [];

  // Import each table in order
  for (const tableName of IMPORT_ORDER) {
    const result = await importTable(pool, tableName);
    results.push(result);
    console.log(''); // Empty line for readability
  }

  // Close connection
  await pool.close();

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Import Summary:');
  console.log('='.repeat(50));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  successful.forEach(result => {
    console.log(`✓ ${result.table.padEnd(30)} ${result.count.toString().padStart(6)} records`);
  });

  if (failed.length > 0) {
    console.log('\n❌ Failed Imports:');
    failed.forEach(result => {
      console.log(`✗ ${result.table.padEnd(30)} ${result.error}`);
    });
  }

  const totalRecords = successful.reduce((sum, r) => sum + r.count, 0);
  console.log('='.repeat(50));
  console.log(`Total Records Imported: ${totalRecords}`);
  console.log(`Success: ${successful.length}/${IMPORT_ORDER.length} tables`);
  console.log('='.repeat(50));

  console.log('\n✅ Import complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Verify data in Azure SQL Database');
  console.log('2. Update backend configuration to use Azure SQL');
  console.log('3. Test application with new database');
  console.log('4. Run validation queries to compare data');
}

// Run import
importAllTables()
  .then(() => {
    console.log('\n✅ Import process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import process failed:', error);
    process.exit(1);
  });
