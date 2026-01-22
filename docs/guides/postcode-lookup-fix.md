# Postcode Lookup Fix for Vercel Deployment

## Problem
The postcode lookup was calling the external API directly from the frontend, which caused:
- CORS issues on Vercel
- Exposed API keys in client-side code
- Potential rate limiting problems

## Solution
Created a backend proxy endpoint to handle postcode lookups securely.

## Files Changed

### Backend
1. **`backend/routes/postcodeLookup.js`** (NEW)
   - Proxy endpoint for postcode lookups
   - Route: `GET /api/postcode-lookup/:postcode`
   - Keeps API key on server-side

2. **`backend/server.js`**
   - Added postcode lookup router registration

### Frontend
1. **`frontend/src/components/IssueDIPModal.jsx`**
   - Updated `handlePostcodeLookup` to call backend API instead of external API
   - Now uses `VITE_API_URL` environment variable

## Deployment Steps

### 1. Backend Deployment (Vercel/Render/etc.)

Add environment variable:
```
IDEAL_POSTCODES_API_KEY=iddqd
```
(Or get a real API key from https://ideal-postcodes.co.uk/)

The backend is already configured to accept requests from Vercel domains (`.vercel.app`)

### 2. Frontend Deployment (Vercel)

Add environment variable in Vercel dashboard:
```
VITE_API_URL=https://your-backend-api-url.vercel.app
```

**Example:**
If your backend is at `https://polaristest-backend.vercel.app`, set:
```
VITE_API_URL=https://polaristest-backend.vercel.app
```

### 3. Local Development

Create `frontend/.env` file:
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

Create `backend/.env` file:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
IDEAL_POSTCODES_API_KEY=iddqd
```

## Testing

1. **Local Test:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Test Postcode Lookup:**
   - Open Issue DIP modal
   - Enter a valid UK postcode (e.g., "KT3 4NX")
   - Click "Find Address"
   - Should see address suggestions

3. **Backend API Test:**
   ```bash
   curl http://localhost:3001/api/postcode-lookup/KT34NX
   ```

## How It Works

```
┌─────────┐      ┌─────────┐      ┌──────────────┐
│ Browser │ ---> │ Backend │ ---> │ Ideal        │
│         │      │  Proxy  │      │ Postcodes    │
│         │ <--- │  API    │ <--- │ API          │
└─────────┘      └─────────┘      └──────────────┘
```

Benefits:
- ✅ No CORS issues
- ✅ API key stays secure on server
- ✅ Rate limiting controlled server-side
- ✅ Works on Vercel deployment
- ✅ Easier to switch to different postcode API provider

## Troubleshooting

### Error: "Could not find addresses for this postcode"

**On Vercel:**
1. Check backend is deployed and running
2. Verify `VITE_API_URL` is set in Vercel frontend environment variables
3. Check backend logs for errors
4. Verify CORS is allowing requests from frontend domain

**Locally:**
1. Ensure backend is running on port 3001
2. Check `VITE_API_URL=http://localhost:3001` in frontend/.env
3. Check browser console for fetch errors

### API Key Issues

If using the test key `iddqd` and hitting rate limits:
1. Sign up for free account at https://ideal-postcodes.co.uk/
2. Get your API key
3. Set `IDEAL_POSTCODES_API_KEY` environment variable on backend

## Alternative: Free Postcode API

If you want to avoid API keys entirely, you can switch to:
- **Postcodes.io** (free, no key required): https://postcodes.io/
  - Update `backend/routes/postcodeLookup.js` to use their API

Example for Postcodes.io:
```javascript
const apiUrl = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`;
```
