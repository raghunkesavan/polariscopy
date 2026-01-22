# Azure SQL Migration - Quick Start Guide

## 📋 What Has Been Prepared

### 1. Documentation
- ✅ `AZURE_SQL_MIGRATION_GUIDE.md` - Complete 15-section migration guide
- ✅ `AZURE_MIGRATION_GUIDE.md` - Updated with Azure SQL option

### 2. Database Schema Conversion
- ✅ `database/azure-sql/migrations/master_migration.sql` - Full T-SQL schema
  - Converted all PostgreSQL types to Azure SQL equivalents
  - Created all 10 core tables
  - Added triggers for auto-updating timestamps
  - Includes default admin user

### 3. Backend Configuration
- ✅ `backend/config/azuresql.js` - Azure SQL client (replaces Supabase)
  - Connection pooling
  - Parameterized queries
  - Transaction support
  - Auto type detection

### 4. Data Migration Scripts
- ✅ `database/azure-sql/data-export/export-from-supabase.js` - Export from Supabase
- ✅ `database/azure-sql/data-export/import-to-azure-sql.js` - Import to Azure SQL

---

## 🚀 Quick Start Steps

### Phase 1: Get Azure SQL Credentials (Contact David)

Email David requesting:
```
Subject: Azure SQL Database Setup for Calculator Application

Hi David,

As per our migration plan, I need Azure SQL Database credentials:

1. Azure SQL Server: <server-name>.database.windows.net
2. Database Name: polaris-calculator (or your preference)
3. Username: polaris_app
4. Password: <strong-password>
5. Firewall Rule: Add my IP <your-ip-address>

Recommended Tier: Standard S2 (50 DTUs) for production

Thanks!
```

### Phase 2: Set Up Environment Variables

Add to `backend/.env`:
```bash
# Azure SQL Database
AZURE_SQL_SERVER=<server-name>.database.windows.net
AZURE_SQL_DATABASE=polaris-calculator
AZURE_SQL_USER=polaris_app
AZURE_SQL_PASSWORD=<password>
AZURE_SQL_PORT=1433
```

### Phase 3: Install Dependencies

```powershell
# Install Azure SQL driver
cd backend
npm install mssql

# Install migration script dependencies
cd ../database/azure-sql
npm install
```

### Phase 4: Create Database Schema

1. Download [Azure Data Studio](https://aka.ms/azuredatastudio)
2. Connect to Azure SQL Server
3. Open `database/azure-sql/migrations/master_migration.sql`
4. Execute the script (F5)
5. Verify tables created (should see 10 tables)

### Phase 5: Export Data from Supabase

```powershell
cd database/azure-sql
node data-export/export-from-supabase.js
```

This creates `exported-data/` folder with JSON files.

### Phase 6: Import Data to Azure SQL

```powershell
node data-export/import-to-azure-sql.js
```

Imports all data in correct order (respects foreign keys).

### Phase 7: Update Backend Code

Replace Supabase client with Azure SQL in routes:

**Before:**
```javascript
import { supabase } from '../config/supabase.js';
const { data } = await supabase.from('btl_quotes').select('*');
```

**After:**
```javascript
import { query } from '../config/azuresql.js';
const data = await query('SELECT * FROM btl_quotes');
```

### Phase 8: Test Application

```powershell
cd backend
npm start
```

Test all features:
- [ ] Login works
- [ ] BTL calculator saves quotes
- [ ] Bridging calculator saves quotes
- [ ] PDF generation works
- [ ] Admin panel accessible

---

## ⚡ Key Differences: PostgreSQL → Azure SQL

| PostgreSQL | Azure SQL | Your Action |
|------------|-----------|-------------|
| `uuid` | `uniqueidentifier` | ✅ Auto-converted |
| `boolean` | `bit` | ✅ Auto-converted |
| `jsonb` | `nvarchar(max)` | ✅ JSON validation added |
| `text` | `nvarchar(max)` | ✅ Auto-converted |
| `timestamp with time zone` | `datetimeoffset` | ✅ Auto-converted |
| `gen_random_uuid()` | `NEWID()` | ✅ Done in schema |
| Row Level Security | App-layer auth | ⚠️ Implement in routes |

---

## 🔒 Security Notes

### Remove Row Level Security (RLS)
Supabase's RLS policies won't work in Azure SQL. You MUST:

1. **Check user permissions in each API route:**
```javascript
// backend/routes/quotes.js
router.get('/quotes', authenticateToken, async (req, res) => {
  // ✅ Check authorization
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // ✅ Filter by user
  const quotes = await query(
    'SELECT * FROM btl_quotes WHERE user_id = @userId',
    { userId: req.user.id }
  );
  
  res.json(quotes);
});
```

2. **Admin-only routes:**
```javascript
router.get('/admin/users', authenticateToken, async (req, res) => {
  // ✅ Check admin access level
  if (req.user.access_level !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const users = await query('SELECT * FROM users');
  res.json(users);
});
```

---

## 🎯 Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Get Azure SQL credentials | 1-2 days | David |
| Create schema | 1 hour | Credentials |
| Export data | 1 hour | None |
| Import data | 1-2 hours | Schema created |
| Update backend routes | 2-3 days | All tables working |
| Testing | 2-3 days | Routes updated |
| **Total** | **1-2 weeks** | - |

---

## 🆘 Troubleshooting

### Connection Issues
```
Error: Login failed for user 'polaris_app'
```
**Solution:** Check firewall rules, verify IP whitelisted

### Import Errors
```
Error: Cannot insert explicit value for identity column
```
**Solution:** Check if table has IDENTITY columns, may need `SET IDENTITY_INSERT ON`

### JSON Validation Errors
```
Error: CHECK constraint 'chk_btl_quotes_criteria_json' failed
```
**Solution:** Ensure JSON columns contain valid JSON or NULL

### Type Conversion Issues
```
Error: Conversion failed when converting varchar to uniqueidentifier
```
**Solution:** Verify GUID format matches Azure SQL (lowercase, hyphens)

---

## 📊 Cost Estimate

### Azure SQL Database Pricing

**Development:**
- Basic: $5/month (2GB) - For testing only

**Production (Recommended):**
- Standard S2: $75/month (50 DTUs, 250GB)
- Standard S3: $150/month (100 DTUs, 250GB)

**Enterprise:**
- Premium P1: $465/month (125 DTUs, 500GB)

💡 **Tip:** Start with Standard S2, scale up if needed

---

## ✅ Pre-Flight Checklist

Before going live with Azure SQL:

- [ ] All tables created in Azure SQL
- [ ] Data exported from Supabase
- [ ] Data imported to Azure SQL
- [ ] Row counts match (Supabase vs Azure SQL)
- [ ] Backend configured with Azure SQL credentials
- [ ] All routes updated to use `azuresql.js` client
- [ ] Authorization checks added to all routes (RLS replacement)
- [ ] Login/authentication tested
- [ ] BTL calculator tested (save, load, PDF)
- [ ] Bridging calculator tested (save, load, PDF)
- [ ] Admin panel tested
- [ ] Rate management tested
- [ ] Support requests tested
- [ ] Performance tested (query response times)
- [ ] Backup strategy configured
- [ ] Monitoring/alerts set up (Azure Monitor)
- [ ] Rollback plan documented

---

## 🔄 Rollback Plan

If issues arise:

1. **Switch environment variables back:**
   ```bash
   # Comment out Azure SQL
   # AZURE_SQL_SERVER=...
   
   # Re-enable Supabase
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

2. **Revert backend config:**
   ```javascript
   // Use Supabase client instead of Azure SQL
   import { supabase } from '../config/supabase.js';
   ```

3. **Restart application**

4. **Monitor for issues**

---

## 📞 Support Contacts

| Issue Type | Contact | Priority |
|------------|---------|----------|
| Azure SQL credentials | David | High |
| Database connectivity | David | High |
| Application errors | Development Team | Medium |
| CI/CD pipeline | Vishnu | Medium |
| Cost/billing | Azure Admin | Low |

---

## 📚 Additional Resources

- [Azure SQL Documentation](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [mssql Node.js Driver Docs](https://github.com/tediousjs/node-mssql)
- [PostgreSQL to Azure SQL Migration](https://learn.microsoft.com/en-us/azure/dms/tutorial-postgresql-azure-sql-online)
- [Azure Data Studio Download](https://aka.ms/azuredatastudio)

---

**Last Updated:** December 9, 2025  
**Migration Status:** Ready for Execution  
**Owner:** Development Team
