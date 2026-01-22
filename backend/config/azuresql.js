import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Azure SQL Database Configuration
 * Replaces Supabase PostgreSQL client
 */

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  port: parseInt(process.env.AZURE_SQL_PORT || '1433', 10),
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false, // False for production
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Validate configuration
if (!config.server || !config.database || !config.user || !config.password) {
  throw new Error('Missing Azure SQL credentials. Check environment variables.');
}

// Connection pool
let pool = null;

/**
 * Get or create connection pool
 * @returns {Promise<sql.ConnectionPool>}
 */
export async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log('✅ Connected to Azure SQL Database');
      
      // Handle pool errors
      pool.on('error', err => {
        console.error('❌ Azure SQL Pool Error:', err);
        pool = null; // Reset pool on error
      });
    } catch (error) {
      console.error('❌ Failed to connect to Azure SQL:', error);
      throw error;
    }
  }
  return pool;
}

/**
 * Execute a SQL query with parameters
 * @param {string} queryText - SQL query string
 * @param {Object} params - Parameters object { paramName: value }
 * @returns {Promise<Array>} Query results
 */
export async function query(queryText, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Add parameters to request
    Object.keys(params).forEach(key => {
      const value = params[key];
      
      // Auto-detect parameter type
      if (typeof value === 'string') {
        request.input(key, sql.NVarChar, value);
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          request.input(key, sql.Int, value);
        } else {
          request.input(key, sql.Float, value);
        }
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value ? 1 : 0);
      } else if (value instanceof Date) {
        request.input(key, sql.DateTimeOffset, value);
      } else if (value === null || value === undefined) {
        request.input(key, sql.NVarChar, null);
      } else {
        // For objects/arrays, convert to JSON string
        request.input(key, sql.NVarChar, JSON.stringify(value));
      }
    });
    
    const result = await request.query(queryText);
    return result.recordset;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', queryText);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a query and return a single row
 * @param {string} queryText - SQL query string
 * @param {Object} params - Parameters object
 * @returns {Promise<Object|null>} Single row or null
 */
export async function queryOne(queryText, params = {}) {
  const results = await query(queryText, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Begin a transaction
 * @returns {Promise<sql.Transaction>}
 */
export async function beginTransaction() {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  return transaction;
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Async function receiving transaction
 * @returns {Promise<any>} Result from callback
 */
export async function transaction(callback) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  
  try {
    await tx.begin();
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

/**
 * Close database connection pool
 * Call this on application shutdown
 */
export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('✅ Azure SQL connection pool closed');
  }
}

// Graceful shutdown
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

export { sql };
