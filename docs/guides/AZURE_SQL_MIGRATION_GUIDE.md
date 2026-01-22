# Azure SQL Database Migration Guide

## Overview
This guide provides step-by-step instructions to migrate from Supabase (PostgreSQL) to Azure SQL Database.

---

## 1. Azure SQL vs PostgreSQL Differences

### Key Differences to Address

| Feature | PostgreSQL (Supabase) | Azure SQL | Migration Action |
|---------|----------------------|-----------|------------------|
| UUID Generation | `gen_random_uuid()` | `NEWID()` | Replace function calls |
| JSON Type | `jsonb` | `nvarchar(max)` | Change column types, add JSON validation |
| Boolean Type | `boolean` | `bit` | Change column type |
| Auto Timestamp | `timestamp with time zone` | `datetimeoffset` | Change column type |
| String Type | `text` | `nvarchar(max)` | Change column type |
| Sequences | Native support | `IDENTITY` columns | Modify auto-increment |
| Row Level Security | Native RLS | Implement in app layer | Remove RLS, add app-level auth |
| Auth Schema | `auth.users` (built-in) | Custom users table | Already using custom table ✓ |

---

## 2. Pre-Migration Checklist

### Data Assessment
- [ ] Export current Supabase database schema
- [ ] Export all data from Supabase
- [ ] Identify data volume (tables, rows, size)
- [ ] Document all custom PostgreSQL functions
- [ ] List all foreign key relationships
- [ ] Document indexes and performance optimizations

### Azure SQL Setup
- [ ] Create Azure SQL Server instance
- [ ] Create Azure SQL Database
- [ ] Configure firewall rules (allow Azure services + your IP)
- [ ] Create database user for the application
- [ ] Set up SQL Server Management Studio (SSMS) or Azure Data Studio

---

## 3. Schema Conversion Strategy

### Step 1: Convert PostgreSQL Schema to T-SQL

I've analyzed your migrations and created converted schemas in:
- `database/azure-sql/schema/` (converted schemas)
- `database/azure-sql/migrations/` (step-by-step migration scripts)

### Step 2: Key Conversions Required

```sql
-- PostgreSQL → Azure SQL Mappings

-- UUID Type
uuid → uniqueidentifier

-- UUID Generation
gen_random_uuid() → NEWID()

-- Boolean
boolean → bit

-- Timestamps
timestamp with time zone → datetimeoffset
now() → SYSDATETIMEOFFSET()

-- JSON
jsonb → nvarchar(max) with JSON validation
-- Check constraints: (ISJSON(column_name) = 1)

-- Text
text → nvarchar(max)

-- Numeric
numeric → decimal(18,2) or float

-- Arrays (if any)
text[] → Convert to JSON array in nvarchar(max)
```

---

## 4. Data Migration Process

### Option A: Using Azure Data Migration Service (Recommended)
1. Install Azure Data Migration Service
2. Configure source (Supabase PostgreSQL)
3. Configure target (Azure SQL)
4. Map schemas and tables
5. Run assessment to identify issues
6. Perform migration with minimal downtime

### Option B: Manual Export/Import
1. Export from Supabase to CSV/JSON
2. Transform data format
3. Import using BCP utility or BULK INSERT

### Option C: Using Migration Scripts (Our Approach)
1. Export data from Supabase using Node.js script
2. Transform data during export
3. Import to Azure SQL using T-SQL scripts

---

## 5. Application Code Changes

### 5.1 Database Client Library

**Replace Supabase Client with MSSQL Driver**

```bash
# Install Azure SQL driver
npm install mssql --save
npm uninstall @supabase/supabase-js
```

### 5.2 Create Azure SQL Configuration

File: `backend/config/azuresql.js`

```javascript
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  port: parseInt(process.env.AZURE_SQL_PORT || '1433'),
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false,
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

// Create connection pool
let pool = null;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

export async function query(queryText, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(queryText);
    return result.recordset;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export { sql };
```

### 5.3 Update Backend Routes

**Example: Converting a Supabase Query**

**BEFORE (Supabase):**
```javascript
// backend/routes/quotes.js
import { supabase } from '../config/supabase.js';

router.get('/quotes', async (req, res) => {
  const { data, error } = await supabase
    .from('btl_quotes')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
```

**AFTER (Azure SQL):**
```javascript
// backend/routes/quotes.js
import { query } from '../config/azuresql.js';

router.get('/quotes', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM btl_quotes 
       WHERE user_id = @userId 
       ORDER BY created_at DESC`,
      { userId: req.user.id }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 6. Environment Variables Update

### Add to `.env` (Backend)

```plaintext
# Azure SQL Database Configuration
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=polaris-calculator
AZURE_SQL_USER=polaris_app
AZURE_SQL_PASSWORD=<strong-password>
AZURE_SQL_PORT=1433

# Optional: Connection String (alternative to individual vars)
AZURE_SQL_CONNECTION_STRING=Server=tcp:your-server.database.windows.net,1433;Initial Catalog=polaris-calculator;Persist Security Info=False;User ID=polaris_app;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;

# Keep for migration period (dual database support)
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

### Update Azure Key Vault Variables

```plaintext
AZURE_SQL_SERVER
AZURE_SQL_DATABASE
AZURE_SQL_USER
AZURE_SQL_PASSWORD
```

---

## 7. Migration Timeline

### Phase 1: Preparation (Week 1)
- [ ] Day 1-2: Set up Azure SQL Database
- [ ] Day 3-4: Convert schemas and test locally
- [ ] Day 5: Set up migration scripts

### Phase 2: Code Migration (Week 2)
- [ ] Day 1-2: Update backend database client
- [ ] Day 3-4: Convert all API routes
- [ ] Day 5: Update authentication logic

### Phase 3: Data Migration (Week 3)
- [ ] Day 1: Export data from Supabase
- [ ] Day 2: Transform and validate data
- [ ] Day 3: Import to Azure SQL
- [ ] Day 4-5: Validation and testing

### Phase 4: Testing & Deployment (Week 4)
- [ ] Day 1-2: Integration testing
- [ ] Day 3: Staging deployment
- [ ] Day 4: Production cutover
- [ ] Day 5: Monitoring and optimization

---

## 8. Rollback Plan

### During Migration
1. Keep Supabase database active (read-only mode)
2. Run both databases in parallel initially
3. Compare results from both databases
4. Switch gradually (feature flags)

### Emergency Rollback
1. Switch environment variables back to Supabase
2. Redeploy previous version
3. DNS cutover (if domain changed)

---

## 9. Testing Strategy

### Unit Tests
- [ ] Test database connection
- [ ] Test CRUD operations for each table
- [ ] Test JSON column handling
- [ ] Test transaction rollbacks

### Integration Tests
- [ ] BTL calculator with database
- [ ] Bridging calculator with database
- [ ] Quote generation and retrieval
- [ ] PDF generation with database data
- [ ] User authentication flow

### Performance Tests
- [ ] Query performance comparison
- [ ] Concurrent user simulation
- [ ] Load testing with realistic data volume

---

## 10. Post-Migration Tasks

### Optimization
- [ ] Analyze query execution plans
- [ ] Add missing indexes
- [ ] Set up query performance insights
- [ ] Configure automatic tuning (Azure SQL feature)

### Monitoring
- [ ] Set up Azure Monitor alerts
- [ ] Configure query performance tracking
- [ ] Monitor DTU/vCore usage
- [ ] Track slow queries

### Security
- [ ] Enable Azure SQL Auditing
- [ ] Set up Advanced Threat Protection
- [ ] Configure firewall rules (whitelist only)
- [ ] Enable Transparent Data Encryption (TDE)
- [ ] Implement Dynamic Data Masking (for sensitive fields)

---

## 11. Cost Considerations

### Azure SQL Pricing Tiers

**Development/Testing:**
- Basic: $5/month (2GB, 5 DTUs)
- Standard S0: $15/month (250GB, 10 DTUs)

**Production (Recommended):**
- Standard S2: $75/month (250GB, 50 DTUs)
- Standard S3: $150/month (250GB, 100 DTUs)

**High Performance:**
- Premium P1: $465/month (500GB, 125 DTUs)
- vCore-based: 2-4 vCores ($350-700/month)

### Cost Optimization
- Use elastic pools if multiple databases
- Scale down during off-hours (Azure Automation)
- Use reserved capacity (1-3 year commitment for discount)
- Monitor DTU usage and adjust tier accordingly

---

## 12. Known Challenges & Solutions

### Challenge 1: Row Level Security (RLS)
**Problem:** Azure SQL RLS is different from PostgreSQL  
**Solution:** Implement authorization in application layer using middleware

### Challenge 2: JSON Handling
**Problem:** No native `jsonb` type  
**Solution:** Use `nvarchar(max)` with JSON functions (`ISJSON`, `JSON_VALUE`, `JSON_QUERY`)

### Challenge 3: UUID vs GUID
**Problem:** Slightly different behavior  
**Solution:** Use `uniqueidentifier` type, ensure string format compatibility

### Challenge 4: Auth Schema
**Problem:** No built-in `auth.users` like Supabase  
**Solution:** Already using custom `users` table ✓

### Challenge 5: Boolean Type
**Problem:** Azure SQL uses `bit` instead of `boolean`  
**Solution:** Convert in queries: `WHERE is_active = 1` instead of `= true`

---

## 13. Migration Scripts Location

All migration scripts are in:
```
database/
├── azure-sql/
│   ├── schema/
│   │   ├── 001_create_btl_quotes.sql
│   │   ├── 002_create_bridging_quotes.sql
│   │   ├── 003_create_users.sql
│   │   ├── 004_create_rates.sql
│   │   └── ... (all tables)
│   ├── migrations/
│   │   └── master_migration.sql (complete schema)
│   ├── data-export/
│   │   └── export-from-supabase.js (Node.js export script)
│   ├── data-import/
│   │   └── import-to-azure-sql.js (Node.js import script)
│   └── validation/
│       └── compare-data.js (validation script)
```

---

## 14. Next Immediate Steps

### Step 1: Coordinate with David (Database Owner)
**Email David with:**
- Request Azure SQL Server credentials
- Request Database name and server endpoint
- Request admin access for initial setup
- Confirm database tier/size (recommend Standard S2 for production)

### Step 2: Set Up Local Azure SQL Connection
```bash
# Install Azure Data Studio (recommended) or SSMS
winget install Microsoft.AzureDataStudio

# Test connection from your machine
# You'll need your IP whitelisted on Azure SQL firewall
```

### Step 3: Run Schema Conversion Script
```bash
# I'll create conversion scripts for you
cd database/azure-sql/migrations
# Review master_migration.sql
# Execute in Azure Data Studio
```

### Step 4: Update Backend Code
```bash
cd backend
npm install mssql
# I'll update the config and routes
```

### Step 5: Test with Staging Data
- Create test environment in Azure SQL
- Import sample data
- Run application against Azure SQL
- Validate all features work

---

## 15. Support & Resources

### Microsoft Documentation
- [Azure SQL Database Documentation](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [Migrate PostgreSQL to Azure SQL](https://learn.microsoft.com/en-us/azure/dms/tutorial-postgresql-azure-sql-online)
- [mssql Node.js Driver](https://github.com/tediousjs/node-mssql)

### Tools
- Azure Data Studio (cross-platform)
- SQL Server Management Studio (Windows)
- Azure Data Migration Assistant
- Azure Database Migration Service

---

**Document Version**: 1.0  
**Last Updated**: December 9, 2025  
**Migration Owner**: Development Team + David (Database Team)
