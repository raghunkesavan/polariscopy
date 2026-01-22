# Rate Limiting Setup

## Overview
Rate limiting has been configured but is currently **commented out** to avoid breaking the existing setup. Follow the steps below to enable it.

## Installation

Run the following command in the `backend` directory:

```powershell
cd backend
npm install express-rate-limit
```

## Enabling Rate Limiting

After installing `express-rate-limit`, uncomment the following lines in `backend/server.js`:

### 1. Import Statement (around line 9)
```javascript
// Uncomment this line:
import { apiLimiter, exportLimiter, pdfLimiter } from './middleware/rateLimiter.js';
```

### 2. General API Rate Limiter (around line 45)
```javascript
// Uncomment this line:
app.use('/api', apiLimiter);
```

### 3. PDF and Export Rate Limiters (around lines 75-85)
```javascript
// Uncomment these lines:
app.use('/api/dip/pdf', pdfLimiter);
app.use('/api/quote/pdf', pdfLimiter);
app.use('/api/export', exportLimiter);
```

## Rate Limiting Configuration

The following rate limits are configured in `backend/middleware/rateLimiter.js`:

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/*` (general) | 100 requests | 15 minutes | Protects all API endpoints |
| `/api/export/*` | 20 requests | 15 minutes | Resource-intensive exports |
| `/api/dip/pdf/*` | 10 requests | 1 minute | CPU-intensive PDF generation |
| `/api/quote/pdf/*` | 10 requests | 1 minute | CPU-intensive PDF generation |

## Customizing Rate Limits

Edit `backend/middleware/rateLimiter.js` to adjust:
- `windowMs`: Time window in milliseconds
- `max`: Maximum number of requests per window
- `message`: Error message shown to users

Example:
```javascript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Adjust this number
  message: {
    error: 'Custom error message',
    retryAfter: '15 minutes'
  }
});
```

## Testing Rate Limits

After enabling rate limiting, test it with:

```powershell
# Make multiple requests quickly
for ($i=1; $i -le 15; $i++) {
  curl http://localhost:3001/api/quotes
  Write-Host "Request $i completed"
}
```

You should see rate limit errors after exceeding the configured limit.

## Response Headers

When rate limiting is active, responses include headers:
- `RateLimit-Limit`: Maximum number of requests
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Time when the limit resets (Unix timestamp)

## Monitoring

Check rate limit headers in browser DevTools Network tab or with curl:

```powershell
curl -I http://localhost:3001/api/quotes
```

Look for `RateLimit-*` headers in the response.

## Production Considerations

1. **IP-based limiting**: Rate limits are per IP address by default
2. **Reverse proxy**: If behind a proxy (Nginx, CloudFlare), configure `trust proxy`:
   ```javascript
   app.set('trust proxy', 1);
   ```
3. **Shared storage**: For multiple servers, use Redis store:
   ```javascript
   import RedisStore from 'rate-limit-redis';
   import { createClient } from 'redis';
   
   const client = createClient({ /* redis config */ });
   
   export const apiLimiter = rateLimit({
     store: new RedisStore({ client }),
     // ... other options
   });
   ```

## Disabling Rate Limiting

To disable rate limiting:
1. Comment out the import statement in `server.js`
2. Comment out all `app.use()` lines that reference rate limiters
3. Restart the server

## Troubleshooting

**Issue**: "Cannot find module 'express-rate-limit'"
- **Solution**: Run `npm install express-rate-limit` in the backend directory

**Issue**: Rate limit triggered too easily during development
- **Solution**: Increase the `max` value or `windowMs` in `rateLimiter.js`

**Issue**: Rate limits not working
- **Solution**: Ensure the middleware is applied BEFORE route handlers in `server.js`

## Documentation

Full documentation: https://github.com/express-rate-limit/express-rate-limit
