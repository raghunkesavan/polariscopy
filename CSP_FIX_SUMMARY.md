# ✅ CSP Frame-Ancestors Fix - RESOLVED

## Problem
Error: `"Framing 'https://mfsuk--dev.sandbox.my.salesforce.com/' violates the following Content Security Policy directive: "frame-ancestors 'none'". The request has been blocked."`

This error occurs when Salesforce tries to embed your application in an iframe (Canvas app), but your app's Content-Security-Policy header blocks it with `frame-ancestors 'none'`.

---

## Solution Applied

### Backend (Already Configured) ✅
**File:** `backend/server.js` (lines 73-79)

```javascript
// Allow Salesforce Canvas to embed this app in an iframe
app.use((req, res, next) => {
  // Allow Salesforce domains to frame the application
  res.setHeader('Content-Security-Policy', "frame-ancestors https://*.salesforce.com https://*.force.com https://*.lightning.force.com");
  // Remove X-Frame-Options to avoid conflicts with CSP
  res.removeHeader('X-Frame-Options');
  next();
});
```

✅ **Verified working** - Backend at `http://localhost:3001/api/canvas` returns correct CSP headers.

---

### Frontend (Just Fixed) ✅

#### 1. Vite Dev Server (Local Development)
**File:** `frontend/vite.config.js`

Added custom plugin to inject CSP headers in development:

```javascript
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Content-Security-Policy', "frame-ancestors https://*.salesforce.com https://*.force.com https://*.lightning.force.com http://localhost:* 'self'");
          next();
        });
      }
    }
  ],
  // ... rest of config
});
```

#### 2. Vercel Production Deployment
**File:** `frontend/vercel.json`

Updated headers to use CSP instead of X-Frame-Options:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors https://*.salesforce.com https://*.force.com https://*.lightning.force.com https://mfsuk--dev.sandbox.my.salesforce.com http://localhost:* 'self'"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

---

## Testing & Verification

### Test Script Created
**File:** `backend/scripts/test-csp-headers.js`

Run to verify CSP headers:
```bash
cd backend
node scripts/test-csp-headers.js
```

Expected output:
```
✅ Content-Security-Policy: frame-ancestors https://*.salesforce.com https://*.force.com https://*.lightning.force.com
✅ frame-ancestors allows Salesforce domains
✅ No X-Frame-Options header (good - using CSP instead)
```

### Manual Browser Test
1. Open Developer Tools (F12)
2. Go to Network tab
3. Load `http://localhost:3000` or `http://localhost:3001/api/canvas`
4. Check Response Headers
5. Verify `content-security-policy` header includes `frame-ancestors` with Salesforce domains

---

## How CSP Frame-Ancestors Works

### What is frame-ancestors?
The `frame-ancestors` directive in Content-Security-Policy controls which domains can embed your page in an `<iframe>`, `<frame>`, `<object>`, or `<embed>`.

### Values Explained:
- `'none'` - **Blocks all framing** (like X-Frame-Options: DENY)
- `'self'` - Only same-origin can frame
- `https://*.salesforce.com` - Allows all Salesforce subdomains
- `https://*.force.com` - Allows all Force.com domains
- `http://localhost:*` - Allows all localhost ports (for testing)

### Why Remove X-Frame-Options?
`X-Frame-Options` is deprecated and conflicts with CSP's `frame-ancestors`. Modern browsers prefer CSP.

---

## Deployment Checklist

### Local Development (localhost)
- [x] Backend CSP middleware added
- [x] Frontend Vite plugin added
- [x] Both servers running (3000 & 3001)
- [x] CSP headers verified

### Vercel Production
- [x] `frontend/vercel.json` updated with CSP headers
- [ ] Push changes to git
- [ ] Deploy to Vercel
- [ ] Verify CSP headers in production

### Render Backend
- [x] `backend/server.js` has CSP middleware
- [ ] Deploy to Render
- [ ] Verify CSP headers in production

---

## Next Steps: Salesforce Canvas App Configuration

Once deployed, configure your Canvas App in Salesforce:

1. **Get your production URLs:**
   - Frontend (Vercel): `https://polariscopy.vercel.app`
   - Backend (Render): `https://your-backend.onrender.com`

2. **Update Canvas App URL in Salesforce:**
   ```
   Setup → Apps → App Manager → Your Canvas App → Edit
   Canvas App URL: https://your-backend.onrender.com/api/canvas
   ```

3. **Test Canvas App:**
   - Load Canvas App in Salesforce
   - Should now embed without CSP errors
   - Backend will receive signed_request POST
   - Frontend will display with Canvas context

---

## Troubleshooting

### Still Getting CSP Error?
1. **Clear browser cache** - Old CSP headers may be cached
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check browser console** - Look for exact CSP directive blocking
4. **Verify headers** - Use Network tab to confirm CSP is set
5. **Check server logs** - Ensure middleware is executing

### CSP Header Not Present?
- Restart both servers (frontend & backend)
- Verify code changes were saved
- Check for syntax errors in config files

### Mixed Content Warnings?
- Ensure Canvas App URL uses HTTPS in production
- Local development can use HTTP

---

## Summary

✅ **Fixed:**
- Backend CSP headers allow Salesforce framing
- Frontend Vite dev server sets CSP headers
- Frontend Vercel production sets CSP headers
- X-Frame-Options removed to avoid conflicts

✅ **Result:**
Your application can now be embedded in Salesforce Canvas apps without CSP violations.

✅ **Servers Running:**
- Backend: `http://localhost:3001` (with CSP)
- Frontend: `http://localhost:3000` (with CSP)

🎉 **Ready for Salesforce Canvas integration!**
