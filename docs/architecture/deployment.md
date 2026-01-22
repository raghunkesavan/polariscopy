# Vercel Deployment Configuration

## Problem
The quotes page shows "Failed to list quotes" on Vercel but works locally.

## Root Cause
The code was using hardcoded `localhost:3001` URLs and relative paths like `/api/quotes` which work locally with Vite's proxy but don't work in production.

## Solution
All API calls now use the `VITE_API_URL` environment variable.

## Deployment Steps for Vercel

### 1. Backend on Render
Your Express backend is deployed on Render. Get your Render backend URL (e.g., `https://your-app.onrender.com`)

### 2. Configure Frontend Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
VITE_API_URL=https://your-app.onrender.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: 
- `VITE_API_URL` should be your Render backend URL WITHOUT a trailing slash
- Example: `https://polaris-backend.onrender.com`
- For local development, leave `VITE_API_URL` empty (it will use Vite's proxy)

### 3. Redeploy Frontend
After setting the environment variables, redeploy your frontend on Vercel.

## Local Development

For local development, create a `.env` file in the `frontend` directory:

```bash
# Leave VITE_API_URL empty for local dev (uses Vite proxy to localhost:3001)
VITE_API_URL=

# Your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The Vite proxy (configured in `vite.config.js`) will automatically forward `/api/*` requests to `http://localhost:3001`.

## Files Changed

1. **frontend/src/config/api.js** (NEW) - Centralized API URL configuration
2. **frontend/src/utils/quotes.js** - Updated to use API_BASE_URL
3. **frontend/src/components/BTL_Calculator.jsx** - Updated all hardcoded URLs
4. **frontend/src/components/BridgingCalculator.jsx** - Updated all hardcoded URLs

## Testing

After deployment:
1. Navigate to the Quotes page
2. Verify quotes are loading
3. Try creating a new quote
4. Try generating PDFs

If you see CORS errors, you may need to configure CORS on your backend to allow requests from your Vercel domain.

## Backend CORS Configuration (Render)

Make sure your backend (on Render) has CORS configured to accept requests from your Vercel frontend domain. 

In your `backend/server.js`, ensure you have:

```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000', // Local development
  'https://your-app.vercel.app', // Your Vercel domain
  // Add any other domains you need
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

After updating CORS settings, redeploy your backend on Render.
