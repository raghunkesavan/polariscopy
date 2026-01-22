# Power BI Reporting API - Quick Start Guide

## 🎯 What You Got

A complete **API authentication system** that lets your data team access quotes data from Power BI **without needing user accounts**. It's secure, rate-limited, and optimized for Power BI's Web connector.

---

## ⚡ Quick Implementation (5 Steps)

### 1️⃣ Run Database Migration (2 minutes)

```bash
# Option A: Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of: database/migrations/048_create_api_keys_table.sql
# 3. Run query

# Option B: psql CLI
cd database/migrations
psql -h your-db-host -d postgres -f 048_create_api_keys_table.sql
```

### 2️⃣ Deploy Backend (if not auto-deployed)

```bash
git add .
git commit -m "feat: Add Power BI reporting API"
git push origin main
```

### 3️⃣ Create API Key

```bash
# Login as admin
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpass"}'

# Copy JWT token, then create key
curl -X POST https://your-domain.com/api/admin/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Power BI - Data Team",
    "permissions": ["read:reports"],
    "expiresInDays": 365
  }'

# SAVE THE API KEY - It's only shown once!
# Result: pk_live_xxxxxxxxxxxxxxxxxxxx
```

### 4️⃣ Test API Key

```bash
# Health check
curl https://your-domain.com/api/reporting/health \
  -H "X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxx"

# Get quotes data
curl "https://your-domain.com/api/reporting/quotes?pageSize=5" \
  -H "X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxx"
```

### 5️⃣ Connect Power BI

1. **Power BI Desktop** → **Get Data** → **Web**
2. **URL:** `https://your-domain.com/api/reporting/quotes?pageSize=1000`
3. **Advanced** → Add header:
   - Name: `X-API-Key`
   - Value: `pk_live_xxxxxxxxxxxxxxxxxxxx`
4. **Connect** → Expand `data` column → Select fields → **Load**

**Done!** 🎉

---

## 📁 What Was Created

### Backend Files
```
backend/
├── middleware/
│   └── apiKeyAuth.js           # API key authentication logic
├── routes/
│   ├── reporting.js            # Power BI endpoints (/quotes, /summary, /health)
│   └── apiKeys.js              # Admin key management (CRUD)
└── test-reporting-api.js       # Test script
```

### Database
```
database/
└── migrations/
    └── 048_create_api_keys_table.sql  # API keys storage
```

### Documentation
```
docs/
├── POWER_BI_DATA_TEAM_GUIDE.md       # For data analysts
├── ADMIN_API_KEY_GUIDE.md            # For admins
├── REPORTING_API_SUMMARY.md          # Technical details
└── POWER_BI_ARCHITECTURE_DIAGRAM.md  # Visual diagrams
```

### Workspace Root
```
POWER_BI_IMPLEMENTATION_CHECKLIST.md  # Implementation steps
POWER_BI_QUICK_START.md               # This file
```

---

## 🔌 API Endpoints

### For Data Team (API Key Auth)

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `GET /api/reporting/quotes` | Get paginated quotes | 100/hour |
| `GET /api/reporting/quotes/summary` | Get aggregated stats | 100/hour |
| `GET /api/reporting/health` | Health check | 100/hour |

**Authentication:** `X-API-Key: pk_live_xxx` header

### For Admins (JWT Auth)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/admin/api-keys` | Create API key |
| `GET /api/admin/api-keys` | List all keys |
| `PATCH /api/admin/api-keys/:id/revoke` | Revoke key |
| `PATCH /api/admin/api-keys/:id/activate` | Reactivate key |
| `DELETE /api/admin/api-keys/:id` | Delete key permanently |

**Authentication:** `Authorization: Bearer <JWT>` (admin access level 1)

---

## 🎓 Common Use Cases

### Use Case 1: Daily Dashboard Refresh

**Scenario:** Data team wants daily sales dashboard  
**Solution:**
```
Power BI Query: 
https://your-domain.com/api/reporting/quotes?from=2025-01-01&pageSize=5000

Schedule: Daily at 6 AM
Rate Impact: 1 request/day (well within 100/hour limit)
```

### Use Case 2: Real-Time Monitoring

**Scenario:** Hourly refresh for operational reports  
**Solution:**
```
Power BI Query:
https://your-domain.com/api/reporting/quotes?from=2026-01-05&pageSize=1000

Schedule: Every hour
Rate Impact: 24 requests/day (safe)
```

### Use Case 3: Historical Analysis

**Scenario:** Quarterly review of all quotes  
**Solution:**
```
Power BI Query (page through all data):
Page 1: ?page=1&pageSize=5000
Page 2: ?page=2&pageSize=5000
...

Manual refresh as needed
Rate Impact: ~6 requests (if 30,000 total records)
```

### Use Case 4: Filtered Reports

**Scenario:** BTL-only report for specific team  
**Solution:**
```
Power BI Query:
https://your-domain.com/api/reporting/quotes?calculator_type=btl&pageSize=5000

Schedule: Daily
Rate Impact: 1 request/day
```

---

## 🛡️ Security Features

✅ **API Keys Hashed** - SHA-256 hashing, plain text never stored  
✅ **One-Time Display** - Keys shown only during creation  
✅ **Expiration Support** - Optional expiry dates  
✅ **Instant Revocation** - Deactivate compromised keys immediately  
✅ **Read-Only Access** - Can't modify data through reporting API  
✅ **Rate Limiting** - 100 requests/hour prevents abuse  
✅ **Audit Logging** - All authentication attempts logged  
✅ **Usage Tracking** - `last_used_at` timestamp updated on each request

---

## 📊 Sample Power BI Report Structure

```
Dashboard: "Polaris Mortgage Quotes"
├── Page 1: Overview
│   ├── Card: Total Quotes (COUNT of reference_number)
│   ├── Card: Total Loan Value (SUM of gross_loan)
│   ├── Chart: Quotes by Status (status, COUNT)
│   └── Chart: Quotes by Type (calculator_type, COUNT)
│
├── Page 2: BTL Analysis
│   ├── Table: Top 10 Loans by Value
│   ├── Chart: LTV Distribution (ltv_percentage bins)
│   ├── Chart: ICR Distribution (icr bins)
│   └── Slicer: Date Range
│
├── Page 3: Rate Analysis
│   ├── Chart: Average Rates Over Time
│   ├── Table: Rate Comparison by Fee Column
│   └── Chart: Product Fee Distribution
│
└── Page 4: Broker Performance
    ├── Table: Quotes by User (user_id, COUNT)
    ├── Chart: Quote Status Breakdown
    └── Chart: Average Loan Size by User
```

---

## 🆘 Quick Troubleshooting

### Problem: "API key required"
**Fix:** Add `X-API-Key` header (case-sensitive)

### Problem: "Invalid or inactive API key"
**Fix:** Check with admin if key is active and not expired

### Problem: "Rate limit exceeded"
**Fix:** Wait 1 hour or reduce refresh frequency

### Problem: "No data returned"
**Fix:** Remove filters first, verify quotes exist in database

### Problem: Connection timeout
**Fix:** Reduce `pageSize` parameter or add date filters

---

## 📞 Who to Contact

**Data Team Issues:**
- API key not working → Admin
- Need different data fields → Development team
- Power BI connection help → Check `docs/POWER_BI_DATA_TEAM_GUIDE.md`

**Admin Tasks:**
- Create/revoke API keys → Check `docs/ADMIN_API_KEY_GUIDE.md`
- Monitor usage → Check `/api/admin/api-keys` endpoint
- Key rotation → Follow quarterly rotation workflow

**Implementation Issues:**
- Database migration errors → DBA or DevOps
- Deployment problems → DevOps team
- Code issues → Development team

---

## 🚀 Next Steps

### Immediate
1. ✅ Run database migration
2. ✅ Create first API key
3. ✅ Test with data team
4. ✅ Set up first Power BI report

### Short Term (Week 1-2)
- [ ] Create admin UI for key management (optional)
- [ ] Document common report templates
- [ ] Train additional users
- [ ] Monitor usage patterns

### Long Term (Month 1-3)
- [ ] Add bridging quotes to reporting API
- [ ] Create pre-aggregated summary views
- [ ] Implement incremental refresh support
- [ ] Build webhook support for real-time updates

---

## 📚 Documentation Index

| Document | For | Purpose |
|----------|-----|---------|
| **POWER_BI_QUICK_START.md** _(this file)_ | Everyone | Quick implementation guide |
| **POWER_BI_DATA_TEAM_GUIDE.md** | Data Team | How to use API in Power BI |
| **ADMIN_API_KEY_GUIDE.md** | Admins | How to manage API keys |
| **REPORTING_API_SUMMARY.md** | Developers | Technical implementation details |
| **POWER_BI_ARCHITECTURE_DIAGRAM.md** | Technical | Visual architecture diagrams |
| **POWER_BI_IMPLEMENTATION_CHECKLIST.md** | Implementers | Detailed checklist |

---

## ✨ Key Benefits

🎯 **No User Accounts Needed** - Data team uses API keys, not user logins  
🔒 **Secure** - API keys hashed, rate-limited, revocable  
⚡ **Fast** - Optimized queries with pagination  
📊 **Power BI Ready** - Flattened data, consistent schema  
🔧 **Easy Management** - Simple admin endpoints for key CRUD  
📈 **Scalable** - Handles large datasets with pagination  
🛡️ **Auditable** - All access logged and tracked  

---

**Questions?** Check the full guides in the `docs/` folder!

**Ready to start?** Jump to [Quick Implementation](#-quick-implementation-5-steps) above! 🚀
