# Reporting API Implementation Summary

## 🎯 What Was Built

A complete **API Key Authentication + Reporting API** system that allows your data team to access quotes data for Power BI reports without needing user accounts.

---

## 📁 New Files Created

### Backend
- **`backend/middleware/apiKeyAuth.js`** - API key authentication middleware
- **`backend/routes/reporting.js`** - Power BI optimized reporting endpoints  
- **`backend/routes/apiKeys.js`** - Admin routes for API key management
- **Updated `backend/server.js`** - Registered new routes
- **Updated `backend/middleware/rateLimiter.js`** - Added reporting rate limiter

### Database
- **`database/migrations/048_create_api_keys_table.sql`** - API keys storage table

### Documentation
- **`docs/POWER_BI_DATA_TEAM_GUIDE.md`** - Complete guide for data team
- **`docs/ADMIN_API_KEY_GUIDE.md`** - Admin guide for key management
- **`docs/REPORTING_API_SUMMARY.md`** - This file

---

## 🚀 Getting Started

### Step 1: Run Database Migration

```bash
# Connect to your Supabase database and run:
cd database/migrations
psql -d your_database -f 048_create_api_keys_table.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `048_create_api_keys_table.sql`
3. Run query

### Step 2: Start Backend Server

```bash
cd backend
npm install  # If any new dependencies needed
npm start
```

The server will now have the new reporting endpoints available.

### Step 3: Create First API Key (as Admin)

**Option A: Via API (Postman/cURL)**

```bash
curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Power BI - Data Team",
    "permissions": ["read:reports"],
    "expiresInDays": 365,
    "notes": "API key for Power BI reporting dashboard"
  }'
```

**Option B: Create Admin UI Component** (Future Enhancement)

You may want to create a React component in the admin panel for easier key management.

### Step 4: Share with Data Team

1. **Give them the API key** (shown only once during creation)
2. **Share documentation**: `docs/POWER_BI_DATA_TEAM_GUIDE.md`
3. **Provide base URL**: `https://your-domain.com/api/reporting`

---

## 🔌 API Endpoints

### For Data Team (API Key Authentication)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reporting/quotes` | GET | Get paginated quotes data |
| `/api/reporting/quotes/summary` | GET | Get summary statistics |
| `/api/reporting/health` | GET | Health check |

**Authentication:** Include `X-API-Key: pk_live_xxx` header

**Rate Limit:** 100 requests per hour per key

### For Admins (JWT Authentication)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/api-keys` | POST | Create new API key |
| `/api/admin/api-keys` | GET | List all API keys |
| `/api/admin/api-keys/:id/revoke` | PATCH | Revoke an API key |
| `/api/admin/api-keys/:id/activate` | PATCH | Activate an API key |
| `/api/admin/api-keys/:id` | DELETE | Delete an API key |

**Authentication:** Requires JWT token with access level 1 (admin)

---

## 🎯 Key Features

### Security
✅ **API Key Authentication** - Separate from user JWT tokens  
✅ **SHA-256 Hashing** - Keys stored as hashes, not plain text  
✅ **One-time Display** - Keys shown only during creation  
✅ **Expiration Support** - Optional expiry dates  
✅ **Revocation** - Instant deactivation without deletion  
✅ **Audit Logging** - All key operations logged  

### Performance
✅ **Pagination** - Handle large datasets (up to 5000 records per page)  
✅ **Flattened Data** - No nested objects, Power BI friendly  
✅ **Efficient Filtering** - By date, status, type, etc.  
✅ **Rate Limiting** - 100 requests/hour prevents abuse  
✅ **Metadata Included** - Total counts, page info in response  

### Power BI Optimized
✅ **Consistent Schema** - All fields always present (null if not applicable)  
✅ **ISO 8601 Dates** - Power BI compatible date format  
✅ **Numeric Types** - Proper numeric fields for calculations  
✅ **Flattened Structure** - Easy to expand in Power Query  

---

## 📊 Data Flow

```
┌─────────────┐
│  Power BI   │
│  Desktop    │
└──────┬──────┘
       │
       │ GET /api/reporting/quotes
       │ Header: X-API-Key: pk_live_xxx
       │
       ▼
┌─────────────────────────────────┐
│  Rate Limiter Middleware        │
│  (100 req/hour per key)         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  API Key Auth Middleware        │
│  - Hash provided key            │
│  - Lookup in api_keys table     │
│  - Check active & not expired   │
│  - Attach key info to req       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Reporting Route Handler         │
│  - Apply filters (date, status) │
│  - Query quotes + quote_results │
│  - Flatten data structure       │
│  - Paginate results             │
│  - Return JSON with metadata    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────┐
│ Supabase DB │
│  - quotes   │
│  - results  │
└─────────────┘
```

---

## 🧪 Testing

### Test API Key Creation

```bash
# 1. Login as admin to get JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your_password"}'

# Copy JWT token from response

# 2. Create API key
curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key", "permissions": ["read:reports"]}'

# Copy API key from response (pk_live_xxx)
```

### Test Reporting Endpoint

```bash
# 3. Test health check
curl http://localhost:3001/api/reporting/health \
  -H "X-API-Key: pk_live_xxx"

# 4. Test quotes endpoint
curl "http://localhost:3001/api/reporting/quotes?pageSize=10" \
  -H "X-API-Key: pk_live_xxx"

# 5. Test with filters
curl "http://localhost:3001/api/reporting/quotes?from=2025-01-01&calculator_type=btl&pageSize=5" \
  -H "X-API-Key: pk_live_xxx"
```

### Test Rate Limiting

```bash
# Make 101 requests quickly - should see rate limit error on 101st
for i in {1..101}; do
  curl http://localhost:3001/api/reporting/health \
    -H "X-API-Key: pk_live_xxx" &
done
```

---

## 🔄 Power BI Connection

### Quick Setup

1. **Open Power BI Desktop**

2. **Home → Get Data → Web**

3. **Enter URL:**
   ```
   http://localhost:3001/api/reporting/quotes?pageSize=1000
   ```

4. **Click "Advanced"**

5. **Add HTTP Request Header:**
   - Name: `X-API-Key`
   - Value: `pk_live_xxx` (your actual key)

6. **OK → Connect**

7. **In Power Query Editor:**
   - Expand the `data` column
   - Select columns you want
   - Set data types

8. **Close & Load**

---

## 🎨 Future Enhancements

### Short Term
- [ ] **Admin UI Component** - React component for API key management in admin panel
- [ ] **Usage Dashboard** - Show API call volume per key
- [ ] **Email Notifications** - Alert admins when keys expire soon

### Medium Term
- [ ] **Webhook Support** - Push data changes to Power BI
- [ ] **Custom Permissions** - More granular permission system
- [ ] **Query Builder** - UI to help data team build filters

### Long Term
- [ ] **OData Support** - Native Power BI connector
- [ ] **GraphQL Endpoint** - More flexible querying
- [ ] **Real-time Streaming** - Live dashboard updates

---

## 🐛 Known Limitations

1. **Bridging Quotes Not Included** - Currently only BTL quotes in reporting endpoint (see line 37 in `routes/reporting.js`)
   - **Fix:** Extend `getReportingData()` to include bridging quotes similar to existing export route

2. **No Incremental Sync** - Full refresh required each time
   - **Workaround:** Use date filters (`from` parameter) to fetch only recent data
   - **Future:** Add `updated_at` filter for incremental loads

3. **Single Table Response** - Quotes and results are flattened
   - **Impact:** Duplicate quote data for each result row
   - **Benefit:** Simpler Power BI setup (no relationships needed)

4. **No Aggregation Endpoint** - Summary endpoint is basic
   - **Workaround:** Do aggregations in Power BI
   - **Future:** Add pre-aggregated views for complex calculations

---

## 📚 Documentation

| Document | Audience | Purpose |
|----------|----------|---------|
| [POWER_BI_DATA_TEAM_GUIDE.md](./POWER_BI_DATA_TEAM_GUIDE.md) | Data Analysts | How to connect Power BI and use API |
| [ADMIN_API_KEY_GUIDE.md](./ADMIN_API_KEY_GUIDE.md) | Admins | How to create/manage API keys |
| [REPORTING_API_SUMMARY.md](./REPORTING_API_SUMMARY.md) | Developers | Technical implementation details |

---

## 🔒 Security Considerations

### API Key Storage
- ✅ Keys hashed with SHA-256 before storage
- ✅ Plain text key shown only once during creation
- ✅ No way to retrieve plain text key from database

### Authentication
- ✅ Separate from user JWT tokens
- ✅ Read-only permissions by default
- ✅ Can be revoked instantly

### Rate Limiting
- ✅ 100 requests/hour prevents abuse
- ✅ Rate limit per API key (not per IP)
- ✅ Sufficient for hourly Power BI refreshes

### Monitoring
- ✅ `last_used_at` tracks key usage
- ✅ All authentication attempts logged
- ✅ Admin can review key usage history

---

## 🆘 Support

### For Data Team
**Issue:** Can't connect from Power BI  
**Solution:** Check [POWER_BI_DATA_TEAM_GUIDE.md](./POWER_BI_DATA_TEAM_GUIDE.md) troubleshooting section

**Issue:** Rate limit exceeded  
**Solution:** Reduce refresh frequency or contact admin to discuss limits

**Issue:** Missing data fields  
**Solution:** Request from development team to add to reporting endpoint

### For Admins
**Issue:** Need to create API key  
**Solution:** See [ADMIN_API_KEY_GUIDE.md](./ADMIN_API_KEY_GUIDE.md)

**Issue:** Key compromised  
**Solution:** Immediately revoke via `PATCH /api/admin/api-keys/:id/revoke`

**Issue:** Need to rotate keys  
**Solution:** Follow key rotation workflow in admin guide

---

## 📞 Contact

For questions or issues:
- **Data Team:** Contact your admin for API key issues
- **Admins:** Review admin guide or contact development team
- **Developers:** See technical implementation in route files

---

**Last Updated:** 2026-01-05  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
