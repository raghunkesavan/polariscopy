# Power BI Reporting API - Implementation Checklist

## ✅ Pre-Implementation (Done)

- [x] API key authentication middleware created
- [x] Reporting routes created (quotes, summary, health)
- [x] Admin routes for API key management created
- [x] Database migration file created
- [x] Rate limiter configured (100/hour)
- [x] Documentation written (3 guides)
- [x] Test script created

---

## 🚀 Implementation Steps

### 1. Database Setup

- [ ] Run database migration to create `api_keys` table
  
  **Supabase Dashboard Method:**
  ```sql
  -- Go to Supabase Dashboard → SQL Editor
  -- Copy contents of database/migrations/048_create_api_keys_table.sql
  -- Run query
  ```
  
  **Or via CLI:**
  ```bash
  cd database/migrations
  psql -h your-supabase-host -d postgres -U postgres -f 048_create_api_keys_table.sql
  ```

- [ ] Verify table created successfully
  ```sql
  SELECT * FROM api_keys LIMIT 1;
  ```

### 2. Backend Deployment

- [ ] Ensure all new files are committed to Git
  ```bash
  git status
  git add backend/middleware/apiKeyAuth.js
  git add backend/routes/reporting.js
  git add backend/routes/apiKeys.js
  git add backend/test-reporting-api.js
  git add database/migrations/048_create_api_keys_table.sql
  git add docs/*.md
  git commit -m "feat: Add Power BI reporting API with API key auth"
  ```

- [ ] Deploy backend to production (Vercel, AWS, Azure, etc.)
  ```bash
  # Your deployment command here
  # e.g., git push origin main (if auto-deploy configured)
  ```

- [ ] Verify deployment successful
  ```bash
  curl https://your-domain.com/health
  ```

### 3. Test in Development (Local)

- [ ] Start backend server
  ```bash
  cd backend
  npm start
  ```

- [ ] Run test script
  ```bash
  node backend/test-reporting-api.js
  ```

- [ ] Verify all tests pass
  - Login successful
  - API key created
  - Health check works
  - Quotes endpoint returns data
  - Summary endpoint works
  - API key listed
  - Key revoked successfully

### 4. Create Production API Key

- [ ] Login as admin via API or UI
  
  **Via API:**
  ```bash
  curl -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"your_password"}'
  ```
  
- [ ] Create API key for data team
  ```bash
  curl -X POST https://your-domain.com/api/admin/api-keys \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Power BI - Data Team",
      "permissions": ["read:reports"],
      "expiresInDays": 365,
      "notes": "Production API key for Power BI reporting dashboards"
    }'
  ```

- [ ] **CRITICAL:** Save the API key securely (it's only shown once!)
  - Store in password manager
  - Document where it's stored
  - Note creation date and expiry

### 5. Share with Data Team

- [ ] Provide API key securely (not via email/Slack)
  - Use password manager sharing feature
  - Or share via encrypted channel
  
- [ ] Share documentation
  - [ ] `docs/POWER_BI_DATA_TEAM_GUIDE.md`
  - [ ] Base URL: `https://your-domain.com/api/reporting`
  - [ ] Example requests
  
- [ ] Schedule knowledge transfer meeting
  - Show how to use API in Power BI
  - Demonstrate filtering options
  - Explain rate limits
  - Show troubleshooting steps

### 6. Power BI Connection (Data Team)

- [ ] Open Power BI Desktop
- [ ] Get Data → Web
- [ ] Enter URL with filters
  ```
  https://your-domain.com/api/reporting/quotes?pageSize=1000&from=2025-01-01
  ```
- [ ] Add Advanced → HTTP Header
  - Name: `X-API-Key`
  - Value: `pk_live_xxxxxxxxxx`
- [ ] Connect and transform data
- [ ] Create initial report
- [ ] Publish to Power BI Service
- [ ] Configure scheduled refresh (e.g., every 1 hour)

### 7. Monitoring & Maintenance

- [ ] Set up monitoring dashboard
  - Track API key usage frequency
  - Monitor `last_used_at` timestamps
  - Check for expiring keys (30-day warning)
  
- [ ] Review API access logs weekly
  ```bash
  # Check backend logs for API key authentication
  tail -f backend/logs/combined.log | grep "API key authenticated"
  ```

- [ ] Schedule quarterly key rotation
  - Create new key
  - Update Power BI credentials
  - Revoke old key after grace period
  - Delete old key after audit period

### 8. Create Admin UI (Optional Enhancement)

- [ ] Create React component for API key management
  ```jsx
  // frontend/src/features/admin/components/ApiKeyManager.jsx
  ```
  
- [ ] Features to include:
  - List all API keys
  - Create new key
  - Revoke/activate keys
  - Delete keys
  - View usage statistics
  - Search and filter

- [ ] Add to admin panel navigation

---

## 🧪 Testing Checklist

### Functional Tests

- [ ] API key authentication works
- [ ] Invalid API key rejected
- [ ] Expired API key rejected
- [ ] Revoked API key rejected
- [ ] Quotes endpoint returns correct data
- [ ] Pagination works correctly
- [ ] Filters work (from, to, status, type)
- [ ] Summary endpoint returns aggregated stats
- [ ] Health endpoint responds
- [ ] Rate limiting enforced (101st request fails)

### Security Tests

- [ ] API key stored as hash (not plain text)
- [ ] Plain key only returned once during creation
- [ ] Cannot retrieve plain key from database
- [ ] JWT required for admin endpoints
- [ ] Non-admin users cannot access admin endpoints
- [ ] API key logs access attempts
- [ ] `last_used_at` updates on each use

### Performance Tests

- [ ] Large result sets paginate correctly
- [ ] Query with 5000 records responds in <2 seconds
- [ ] Multiple concurrent requests handled
- [ ] Rate limiter doesn't block legitimate usage

### Power BI Tests

- [ ] Connection works from Power BI Desktop
- [ ] Data refresh succeeds
- [ ] Scheduled refresh works in Power BI Service
- [ ] Incremental refresh with date filter
- [ ] Multiple reports can use same API key

---

## 📚 Documentation Checklist

- [x] Data team guide created (`POWER_BI_DATA_TEAM_GUIDE.md`)
- [x] Admin guide created (`ADMIN_API_KEY_GUIDE.md`)
- [x] Implementation summary created (`REPORTING_API_SUMMARY.md`)
- [x] Implementation checklist created (this file)
- [ ] Update main README.md with reporting API section
- [ ] Add to project architecture documentation
- [ ] Create video walkthrough (optional)

---

## 🐛 Troubleshooting Reference

### Issue: Migration fails

**Symptom:** SQL error when running migration  
**Cause:** Table already exists or missing dependencies  
**Solution:**
```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'api_keys';

-- If exists, drop and recreate
DROP TABLE IF EXISTS api_keys CASCADE;

-- Then run migration again
```

### Issue: Cannot create API key

**Symptom:** 401 Unauthorized when calling `/api/admin/api-keys`  
**Cause:** Not logged in as admin (access level 1)  
**Solution:**
1. Verify JWT token is valid: `jwt.verify(token, JWT_SECRET)`
2. Check user access level: `SELECT access_level FROM users WHERE email = '...'`
3. Ensure access level is 1 (admin)

### Issue: API key doesn't work

**Symptom:** 401 Unauthorized when using API key  
**Cause:** Key inactive, expired, or incorrect format  
**Solution:**
1. Check key is active: `SELECT is_active FROM api_keys WHERE key_hash = hash('...')`
2. Check expiration: `SELECT expires_at FROM api_keys WHERE ...`
3. Verify header name is `X-API-Key` (case-sensitive)
4. Ensure no whitespace in key

### Issue: Rate limit too restrictive

**Symptom:** 429 Too Many Requests before data refresh completes  
**Cause:** Power BI making too many requests or multiple reports using same key  
**Solution:**
1. Optimize queries with date filters
2. Increase page size (up to 5000)
3. Create separate keys per report for better tracking
4. Adjust rate limit in `backend/middleware/rateLimiter.js` if needed

### Issue: Missing data in Power BI

**Symptom:** Some quotes or fields not appearing  
**Cause:** Filters applied or incomplete data  
**Solution:**
1. Test without filters first
2. Check date range covers expected data
3. Verify quotes exist in database: `SELECT COUNT(*) FROM quotes WHERE ...`
4. Check if bridging quotes needed (currently only BTL in reporting)

---

## 📈 Success Metrics

After implementation, track these metrics:

### Usage
- [ ] Number of API keys created
- [ ] Number of API requests per day
- [ ] Number of Power BI reports using the API
- [ ] Average response time for queries

### Reliability
- [ ] Uptime of reporting API (target: 99.9%)
- [ ] Error rate (target: <1%)
- [ ] Failed refresh count (target: 0 per week)

### Business Value
- [ ] Time saved vs manual reporting (hours/week)
- [ ] Number of stakeholders with access to data
- [ ] Frequency of report updates (vs previous manual cadence)

---

## 🎯 Next Steps After Implementation

### Immediate (Week 1)
- [ ] Monitor first Power BI refresh
- [ ] Verify data accuracy in reports
- [ ] Collect feedback from data team
- [ ] Fix any issues discovered

### Short Term (Month 1)
- [ ] Create admin UI for API key management
- [ ] Add additional reporting endpoints as requested
- [ ] Document common Power BI report templates
- [ ] Train additional team members

### Long Term (Quarter 1)
- [ ] Add bridging quotes to reporting API
- [ ] Implement webhook support for real-time updates
- [ ] Create pre-aggregated views for complex calculations
- [ ] Build OData endpoint for native Power BI connector

---

## 🆘 Support Contacts

**For Implementation Issues:**
- Developer: [Your contact]
- DevOps: [Your contact]

**For Database Issues:**
- DBA: [Your contact]
- Supabase Support: [Link to support]

**For Power BI Issues:**
- Data Team Lead: [Your contact]
- Power BI Admin: [Your contact]

---

## ✅ Sign-Off

**Implemented By:** _________________  
**Date:** _________________  
**Reviewed By:** _________________  
**Production Ready:** ☐ Yes  ☐ No  
**Notes:** _________________

---

**Last Updated:** 2026-01-05  
**Version:** 1.0.0
