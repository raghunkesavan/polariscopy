# Power BI Reporting API - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            POWER BI ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────┐     ┌───────────────┐     ┌──────────────────┐      │
│  │   Power BI    │     │   Power BI    │     │  Power BI Mobile │      │
│  │   Desktop     │     │   Service     │     │                  │      │
│  │               │     │ (Scheduled    │     │                  │      │
│  │  - Dev/Test   │────▶│  Refreshes)   │────▶│   - Dashboard    │      │
│  │  - Initial    │     │               │     │   - Reports      │      │
│  │    Setup      │     │               │     │                  │      │
│  └───────┬───────┘     └───────┬───────┘     └──────────────────┘      │
│          │                     │                                         │
│          │  HTTP Requests      │                                         │
│          │  with API Key       │                                         │
└──────────┼─────────────────────┼─────────────────────────────────────────┘
           │                     │
           │                     │
           │ Header: X-API-Key: pk_live_xxxxx
           │                     │
           ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    REPORTING ENDPOINTS                           │   │
│  │                                                                   │   │
│  │  GET /api/reporting/quotes?page=1&pageSize=1000&from=2025-01-01│   │
│  │  GET /api/reporting/quotes/summary                               │   │
│  │  GET /api/reporting/health                                       │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                             │
│                             ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  MIDDLEWARE CHAIN                                 │  │
│  │                                                                    │  │
│  │  1. Rate Limiter (100 req/hour per key)                          │  │
│  │     ├─ Check: request count < 100 in past hour?                  │  │
│  │     ├─ If yes: Continue                                           │  │
│  │     └─ If no: Return 429 Too Many Requests                        │  │
│  │                                                                    │  │
│  │  2. API Key Authentication                                        │  │
│  │     ├─ Extract X-API-Key header                                   │  │
│  │     ├─ Hash key with SHA-256                                      │  │
│  │     ├─ Query api_keys table for matching hash                     │  │
│  │     ├─ Verify: is_active = true                                   │  │
│  │     ├─ Verify: expires_at > now (if set)                          │  │
│  │     ├─ Update last_used_at timestamp                              │  │
│  │     ├─ Attach key info to request                                 │  │
│  │     └─ Continue or return 401 Unauthorized                        │  │
│  │                                                                    │  │
│  │  3. Permission Check                                              │  │
│  │     ├─ Check: key has "read:reports" permission?                  │  │
│  │     ├─ If yes: Continue                                           │  │
│  │     └─ If no: Return 403 Forbidden                                │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│                             │                                             │
│                             ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  ROUTE HANDLER                                    │  │
│  │                                                                    │  │
│  │  1. Parse query parameters (page, pageSize, filters)             │  │
│  │  2. Apply filters to Supabase query                               │  │
│  │  3. Fetch quotes from database                                    │  │
│  │  4. For each quote, fetch related quote_results                   │  │
│  │  5. Flatten data structure (no nested objects)                    │  │
│  │  6. Paginate results                                              │  │
│  │  7. Build response with metadata                                  │  │
│  │  8. Return JSON                                                   │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│                             │                                             │
└─────────────────────────────┼─────────────────────────────────────────────┘
                              │
                              │ Supabase Client
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (Supabase)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐   │
│  │  api_keys       │    │    quotes        │    │  quote_results  │   │
│  │  ─────────────  │    │    ──────────    │    │  ──────────────  │   │
│  │  - id           │    │    - id          │    │  - id           │   │
│  │  - name         │    │    - name        │◀───┤  - quote_id     │   │
│  │  - key_hash     │    │    - ref_number  │    │  - fee_column   │   │
│  │  - permissions  │    │    - loan_amount │    │  - gross_loan   │   │
│  │  - is_active    │    │    - ltv         │    │  - net_loan     │   │
│  │  - expires_at   │    │    - status      │    │  - rates...     │   │
│  │  - last_used_at │    │    - payload     │    │  - fees...      │   │
│  │  - created_by   │    │    - created_at  │    │                 │   │
│  │  - notes        │    │    - user_id     │    │                 │   │
│  └─────────────────┘    └──────────────────┘    └─────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Admin Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN USER WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────┐                                                       │
│  │   Admin       │                                                       │
│  │   (Browser)   │                                                       │
│  └───────┬───────┘                                                       │
│          │                                                                │
│          │ 1. Login to get JWT token                                     │
│          │    POST /api/auth/login                                       │
│          │    { email, password }                                        │
│          │                                                                │
│          ▼                                                                │
│  ┌────────────────────────────┐                                         │
│  │ JWT Token Received          │                                         │
│  │ Bearer eyJhbGc...           │                                         │
│  └───────┬────────────────────┘                                         │
│          │                                                                │
│          │ 2. Create API Key                                             │
│          │    POST /api/admin/api-keys                                   │
│          │    Authorization: Bearer <JWT>                                │
│          │    {                                                           │
│          │      "name": "Power BI - Data Team",                          │
│          │      "permissions": ["read:reports"],                         │
│          │      "expiresInDays": 365                                     │
│          │    }                                                           │
│          │                                                                │
│          ▼                                                                │
│  ┌────────────────────────────────────────────────┐                     │
│  │              API KEY GENERATED                  │                     │
│  │                                                  │                     │
│  │  Plain Key: pk_live_aBcDeFgHiJkLmNoPqRsTuVwX    │                     │
│  │  (shown only once!)                             │                     │
│  │                                                  │                     │
│  │  Database stores:                               │                     │
│  │  - key_hash: SHA-256(plain_key)                 │                     │
│  │  - name, permissions, expires_at                │                     │
│  │  - is_active: true                              │                     │
│  └────────┬───────────────────────────────────────┘                     │
│           │                                                               │
│           │ 3. Securely share with data team                             │
│           │    (Password manager, encrypted channel)                     │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                     │
│  │   Data Team     │                                                     │
│  │   Receives Key  │                                                     │
│  └─────────────────┘                                                     │
│                                                                           │
│                                                                           │
│  ┌───────────────┐                                                       │
│  │   Admin       │  4. Monitor Usage                                     │
│  │   (Later)     │     GET /api/admin/api-keys                           │
│  └───────┬───────┘                                                       │
│          │                                                                │
│          ▼                                                                │
│  ┌────────────────────────────────────────────────┐                     │
│  │           API KEYS LIST                         │                     │
│  │                                                  │                     │
│  │  Name: Power BI - Data Team                     │                     │
│  │  Active: ✓                                      │                     │
│  │  Last Used: 2026-01-05 14:30                    │                     │
│  │  Expires: 2027-01-05                            │                     │
│  │  Permissions: read:reports                      │                     │
│  │                                                  │                     │
│  │  [Revoke] [Delete]                              │                     │
│  └────────────────────────────────────────────────┘                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      API KEY AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Power BI Request:                                                       │
│  ─────────────────                                                       │
│  GET /api/reporting/quotes?page=1                                        │
│  Headers:                                                                │
│    X-API-Key: pk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ                         │
│                                                                           │
│                              │                                            │
│                              ▼                                            │
│  ┌────────────────────────────────────────────────┐                     │
│  │         1. Extract API Key                      │                     │
│  │            from X-API-Key header                │                     │
│  │                                                  │                     │
│  │  const apiKey = req.headers['x-api-key'];       │                     │
│  │  // "pk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ"        │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │         2. Hash the API Key                     │                     │
│  │                                                  │                     │
│  │  const keyHash = crypto                         │                     │
│  │    .createHash('sha256')                        │                     │
│  │    .update(apiKey)                              │                     │
│  │    .digest('hex');                              │                     │
│  │  // "a1b2c3d4e5f6..."                           │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │         3. Query Database                       │                     │
│  │                                                  │                     │
│  │  SELECT * FROM api_keys                         │                     │
│  │  WHERE key_hash = 'a1b2c3d4e5f6...'             │                     │
│  │    AND is_active = true                         │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│         ┌─────────┴──────────┐                                           │
│         │                     │                                           │
│    Found?                  Not Found                                     │
│         │                     │                                           │
│         ▼                     ▼                                           │
│  ┌─────────────┐      ┌──────────────────┐                              │
│  │  4a. Check  │      │  4b. Return 401   │                              │
│  │  Expiration │      │  Unauthorized     │                              │
│  │             │      └──────────────────┘                              │
│  │  IF         │                                                          │
│  │  expires_at │                                                          │
│  │  > now      │                                                          │
│  │  OR null    │                                                          │
│  └─────┬───────┘                                                          │
│        │                                                                  │
│    Valid?                                                                │
│        │                                                                  │
│        ▼                                                                  │
│  ┌─────────────────────────────┐                                         │
│  │  5. Update last_used_at      │                                         │
│  │     (async, don't wait)      │                                         │
│  │                              │                                         │
│  │  UPDATE api_keys              │                                         │
│  │  SET last_used_at = NOW()     │                                         │
│  │  WHERE id = '...'             │                                         │
│  └─────────────┬─────────────────┘                                         │
│                │                                                          │
│                ▼                                                          │
│  ┌─────────────────────────────┐                                         │
│  │  6. Attach to request        │                                         │
│  │                              │                                         │
│  │  req.apiKey = {              │                                         │
│  │    name: "Power BI - ...",   │                                         │
│  │    permissions: ["read:..."],│                                         │
│  │    id: "uuid"                │                                         │
│  │  }                           │                                         │
│  └─────────────┬─────────────────┘                                         │
│                │                                                          │
│                ▼                                                          │
│  ┌─────────────────────────────┐                                         │
│  │  7. Continue to route        │                                         │
│  │     handler                  │                                         │
│  │                              │                                         │
│  │  next();                     │                                         │
│  └──────────────────────────────┘                                         │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       QUOTES DATA RETRIEVAL FLOW                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Request: GET /api/reporting/quotes?page=1&pageSize=1000&from=2025-01-01│
│                                                                           │
│                              │                                            │
│                              ▼                                            │
│  ┌────────────────────────────────────────────────┐                     │
│  │         1. Parse Query Parameters               │                     │
│  │                                                  │                     │
│  │  page = 1                                        │                     │
│  │  pageSize = 1000                                 │                     │
│  │  from = "2025-01-01"                             │                     │
│  │  calculator_type = undefined                     │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │         2. Build Supabase Query                 │                     │
│  │                                                  │                     │
│  │  let query = supabase                            │                     │
│  │    .from('quotes')                               │                     │
│  │    .select('*', { count: 'exact' })              │                     │
│  │    .gte('created_at', '2025-01-01')              │                     │
│  │    .order('created_at', { desc: true })          │                     │
│  │    .range(0, 999)  // page 1, size 1000          │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │         3. Execute Query                        │                     │
│  │                                                  │                     │
│  │  Returns:                                        │                     │
│  │  - data: Array of quote objects                  │                     │
│  │  - count: Total number of matching records       │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │  4. For Each Quote, Fetch Results               │                     │
│  │                                                  │                     │
│  │  for (const quote of quotes) {                   │                     │
│  │    const results = await supabase                │                     │
│  │      .from('quote_results')                      │                     │
│  │      .select('*')                                │                     │
│  │      .eq('quote_id', quote.id)                   │                     │
│  │                                                  │                     │
│  │    // Flatten and combine                        │                     │
│  │    results.forEach(result => {                   │                     │
│  │      rows.push({                                 │                     │
│  │        ...quote_data,                            │                     │
│  │        ...result_data                            │                     │
│  │      })                                           │                     │
│  │    })                                            │                     │
│  │  }                                               │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │  5. Build Response with Metadata                │                     │
│  │                                                  │                     │
│  │  {                                               │                     │
│  │    "metadata": {                                 │                     │
│  │      "page": 1,                                  │                     │
│  │      "pageSize": 1000,                           │                     │
│  │      "totalRecords": 5432,                       │                     │
│  │      "totalPages": 6,                            │                     │
│  │      "filters": {...},                           │                     │
│  │      "timestamp": "2026-01-05T10:30:00Z"         │                     │
│  │    },                                            │                     │
│  │    "data": [                                     │                     │
│  │      { /* flattened quote + result */ },         │                     │
│  │      { /* flattened quote + result */ },         │                     │
│  │      ...                                         │                     │
│  │    ]                                             │                     │
│  │  }                                               │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │         6. Return JSON Response                 │                     │
│  │            Status: 200 OK                        │                     │
│  │            Content-Type: application/json        │                     │
│  └─────────────────────────────────────────────────┘                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Rate Limiting Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RATE LIMITING MECHANISM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Configuration: 100 requests per hour per API key                        │
│                                                                           │
│  Tracking Key: API Key Name (not IP address)                            │
│  Window: 1 hour (3600 seconds)                                          │
│                                                                           │
│                              │                                            │
│                              ▼                                            │
│  ┌────────────────────────────────────────────────┐                     │
│  │    Request arrives at /api/reporting/*          │                     │
│  └────────────────┬───────────────────────────────┘                     │
│                   │                                                       │
│                   ▼                                                       │
│  ┌────────────────────────────────────────────────┐                     │
│  │    Rate Limiter Middleware                      │                     │
│  │                                                  │                     │
│  │  1. Check request count for this API key        │                     │
│  │     in the last hour                            │                     │
│  │                                                  │                     │
│  │  2. If < 100: Allow request                     │                     │
│  │     Increment counter                           │                     │
│  │     Add RateLimit headers to response:          │                     │
│  │       RateLimit-Limit: 100                      │                     │
│  │       RateLimit-Remaining: 73                   │                     │
│  │       RateLimit-Reset: <timestamp>              │                     │
│  │                                                  │                     │
│  │  3. If >= 100: Block request                    │                     │
│  │     Return 429 Too Many Requests                │                     │
│  │     {                                            │                     │
│  │       "error": "Rate limit exceeded...",         │                     │
│  │       "retryAfter": "1 hour"                     │                     │
│  │     }                                            │                     │
│  └─────────────────────────────────────────────────┘                     │
│                                                                           │
│  Example Timeline:                                                       │
│  ───────────────────                                                     │
│  10:00:00 - Request  1/100 ✓                                             │
│  10:00:05 - Request  2/100 ✓                                             │
│  ...                                                                     │
│  10:30:00 - Request 100/100 ✓ (last allowed)                            │
│  10:30:15 - Request 101 ✗ (429 Too Many Requests)                       │
│  10:45:00 - Request 102 ✗ (429 Too Many Requests)                       │
│  11:00:01 - Request 1/100 ✓ (new hour, counter reset)                   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

**Legend:**
- ✓ = Success
- ✗ = Blocked/Error
- ─▶ = Data flow direction
- ┌─┐ = System component
- { } = JSON object
