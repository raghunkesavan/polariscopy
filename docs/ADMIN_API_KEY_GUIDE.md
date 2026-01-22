# Admin API Key Management Guide

## 🔐 Overview

This guide covers how to create, manage, and revoke API keys for external systems like Power BI. API keys provide secure, read-only access to reporting data without requiring user accounts.

**Access Required:** Admin (Access Level 1)

---

## 🎯 Quick Start

### Creating an API Key

1. **Navigate to API Key Management** (via admin panel)
2. **Click "Create New API Key"**
3. **Fill in details:**
   - Name: Descriptive name (e.g., "Power BI - Data Team")
   - Permissions: Select appropriate permissions
   - Expiration: Set expiration period (or leave blank for no expiry)
   - Notes: Optional context (e.g., "For monthly sales reports")
4. **Save and copy key** - Key is only shown once!
5. **Securely share** key with data team

---

## 📡 API Endpoints

### Base URL
```
Production: https://polaristest.onrender.com/api/admin/api-keys
Development: http://localhost:3001/api/admin/api-keys
```

All endpoints require JWT authentication with admin access level.

---

## 1️⃣ Create API Key

**Endpoint:** `POST /api/admin/api-keys`

**Request Body:**
```json
{
  "name": "Power BI - Data Team",
  "permissions": ["read:reports"],
  "expiresInDays": 365,
  "notes": "API key for Power BI reporting dashboard"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Descriptive name for the API key |
| `permissions` | array | No | Array of permission strings (default: `["read:reports"]`) |
| `expiresInDays` | integer | No | Days until expiration (omit for no expiry) |
| `notes` | string | No | Additional context or notes |

**Available Permissions:**
- `read:reports` - Read access to reporting endpoints
- `*` - Full access (use with caution)

**Response:**
```json
{
  "message": "API key created successfully. Store this key securely - it cannot be retrieved again.",
  "apiKey": "pk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
  "keyInfo": {
    "id": "uuid-here",
    "name": "Power BI - Data Team",
    "permissions": ["read:reports"],
    "expiresAt": "2027-01-05T10:00:00Z",
    "createdAt": "2026-01-05T10:00:00Z"
  }
}
```

**⚠️ IMPORTANT:** The plain text API key (`apiKey` field) is only returned once during creation. Store it securely immediately. It cannot be retrieved later.

**Example cURL:**
```bash
curl -X POST https://your-domain.com/api/admin/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Power BI - Data Team",
    "permissions": ["read:reports"],
    "expiresInDays": 365,
    "notes": "Monthly sales reporting dashboard"
  }'
```

---

## 2️⃣ List All API Keys

**Endpoint:** `GET /api/admin/api-keys`

**Response:**
```json
{
  "apiKeys": [
    {
      "id": "uuid-1",
      "name": "Power BI - Data Team",
      "permissions": ["read:reports"],
      "is_active": true,
      "created_at": "2026-01-05T10:00:00Z",
      "updated_at": "2026-01-05T10:00:00Z",
      "expires_at": "2027-01-05T10:00:00Z",
      "last_used_at": "2026-01-05T14:30:00Z",
      "notes": "Monthly sales reporting",
      "created_by": "uuid-admin",
      "created_by_email": "admin@example.com",
      "created_by_name": "John Admin"
    },
    {
      "id": "uuid-2",
      "name": "Tableau - Finance Team",
      "permissions": ["read:reports"],
      "is_active": false,
      "created_at": "2025-06-01T10:00:00Z",
      "updated_at": "2025-12-01T10:00:00Z",
      "expires_at": null,
      "last_used_at": "2025-11-30T16:45:00Z",
      "notes": "Deprecated - moved to Power BI",
      "created_by": "uuid-admin",
      "created_by_email": "admin@example.com",
      "created_by_name": "John Admin"
    }
  ]
}
```

**Example cURL:**
```bash
curl https://your-domain.com/api/admin/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 3️⃣ Revoke API Key

**Endpoint:** `PATCH /api/admin/api-keys/:id/revoke`

Deactivates an API key. The key can be reactivated later if needed.

**Response:**
```json
{
  "message": "API key revoked successfully",
  "apiKey": {
    "id": "uuid-here",
    "name": "Power BI - Data Team",
    "is_active": false,
    "updated_at": "2026-01-05T15:00:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X PATCH https://your-domain.com/api/admin/api-keys/uuid-here/revoke \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4️⃣ Activate API Key

**Endpoint:** `PATCH /api/admin/api-keys/:id/activate`

Reactivates a previously revoked API key.

**Response:**
```json
{
  "message": "API key activated successfully",
  "apiKey": {
    "id": "uuid-here",
    "name": "Power BI - Data Team",
    "is_active": true,
    "updated_at": "2026-01-05T15:30:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X PATCH https://your-domain.com/api/admin/api-keys/uuid-here/activate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5️⃣ Delete API Key

**Endpoint:** `DELETE /api/admin/api-keys/:id`

Permanently deletes an API key. This action cannot be undone.

**Response:**
```json
{
  "message": "API key deleted successfully"
}
```

**Example cURL:**
```bash
curl -X DELETE https://your-domain.com/api/admin/api-keys/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔄 Common Workflows

### Workflow 1: Onboarding Data Team

1. **Create API key:**
   ```bash
   POST /api/admin/api-keys
   {
     "name": "Power BI - Q1 2026",
     "permissions": ["read:reports"],
     "expiresInDays": 90,
     "notes": "Q1 reporting project"
   }
   ```

2. **Securely share** the API key with data team lead

3. **Provide documentation:**
   - Share [POWER_BI_DATA_TEAM_GUIDE.md](./POWER_BI_DATA_TEAM_GUIDE.md)
   - Include base URL and example queries

4. **Monitor usage:**
   - Check `last_used_at` timestamp
   - Review logs for errors

### Workflow 2: Key Rotation

**Quarterly or after team member departure:**

1. **Create new key** with updated expiration:
   ```bash
   POST /api/admin/api-keys
   {
     "name": "Power BI - Q2 2026",
     "permissions": ["read:reports"],
     "expiresInDays": 90
   }
   ```

2. **Update Power BI credentials:**
   - Data team updates credential in Power BI Service
   - Test refresh to verify new key works

3. **Revoke old key** after grace period:
   ```bash
   PATCH /api/admin/api-keys/{old-key-id}/revoke
   ```

4. **Delete old key** after 30 days (audit trail):
   ```bash
   DELETE /api/admin/api-keys/{old-key-id}
   ```

### Workflow 3: Emergency Revocation

**If key is compromised:**

1. **Immediately revoke:**
   ```bash
   PATCH /api/admin/api-keys/{compromised-key-id}/revoke
   ```

2. **Check logs** for suspicious activity:
   - Review `last_used_at` timestamp
   - Check API access logs

3. **Create replacement key**

4. **Notify data team** to update credentials

5. **Delete compromised key** after investigation

---

## 🔒 Security Best Practices

### Key Creation
- ✅ **Use descriptive names** including team and purpose
- ✅ **Set expiration dates** for temporary access (90-365 days)
- ✅ **Add detailed notes** for future reference
- ✅ **Use least privilege** permissions
- ❌ **Don't share keys via email/Slack** (use secure password manager)

### Key Storage
- ✅ **Document key locations** (which team has which key)
- ✅ **Use secure credential stores** (Power BI Service, Azure Key Vault)
- ✅ **Never commit keys to Git**
- ❌ **Don't store keys in plain text files**

### Key Rotation
- ✅ **Rotate quarterly** or after team changes
- ✅ **Maintain overlap period** (don't revoke immediately)
- ✅ **Update documentation** when rotating
- ✅ **Audit key usage** before/after rotation

### Monitoring
- ✅ **Review `last_used_at`** monthly for inactive keys
- ✅ **Check expiration dates** and renew proactively
- ✅ **Monitor API logs** for unusual patterns
- ✅ **Revoke unused keys** to reduce attack surface

---

## 📊 Monitoring & Auditing

### Key Usage Dashboard

Monitor these metrics for each API key:

| Metric | Description | Action Threshold |
|--------|-------------|------------------|
| `last_used_at` | Last authentication | Alert if >30 days inactive |
| Request count | API calls per hour | Alert if >90/hour (near limit) |
| Error rate | Failed authentications | Alert if >5% errors |
| Expiration | Days until expiry | Notify 30 days before expiry |

### Audit Log Review

**Monthly tasks:**
1. Review list of all API keys
2. Verify each key is still needed
3. Check for unused keys (no `last_used_at` activity)
4. Confirm expiration dates are appropriate
5. Revoke/delete deprecated keys

**Quarterly tasks:**
1. Rotate all active keys
2. Review permission scopes
3. Update documentation
4. Verify team members still need access

---

## 🆘 Troubleshooting

### Issue: Key creation fails

**Possible causes:**
- Not logged in as admin (access level 1)
- JWT token expired
- Database connection issue

**Solution:**
1. Verify JWT token is valid and not expired
2. Check user has `access_level = 1`
3. Review server logs for detailed error

### Issue: Key not working after creation

**Possible causes:**
- Key copied incorrectly (whitespace, truncation)
- `is_active = false`
- Key expired
- Wrong header name

**Solution:**
1. Verify API key matches exactly (copy from creation response)
2. Check key status: `GET /api/admin/api-keys`
3. Confirm not expired: check `expires_at`
4. Verify header is `X-API-Key` (case-sensitive)

### Issue: Rate limit exceeded

**Possible causes:**
- Data team refresh frequency too high
- Multiple reports using same key
- Inefficient queries fetching all data repeatedly

**Solution:**
1. Review refresh schedules (reduce if possible)
2. Create separate keys per report/team for tracking
3. Optimize queries with date filters
4. Consider increasing rate limit if legitimate need

---

## 📝 Change Log

**2026-01-05** - Initial release
- API key CRUD operations
- Revoke/activate functionality
- Audit logging
- Usage tracking

---

## 🔗 Related Documentation
- Data Team Guide: [POWER_BI_DATA_TEAM_GUIDE.md](./POWER_BI_DATA_TEAM_GUIDE.md)
- API Reference: [API_REFERENCE.md](./API_REFERENCE.md)
- Security Policy: [SECURITY.md](../SECURITY.md)
