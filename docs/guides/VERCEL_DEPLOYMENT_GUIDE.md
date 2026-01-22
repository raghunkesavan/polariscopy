# Vercel Deployment Fix for Data Health & Data Access Pages

## Problem
Data Health and Data Access pages work locally but fail on Vercel because the frontend can't reach the backend API.

## Root Cause
- **Locally**: Vite proxies `/api` requests to `http://localhost:3001`
- **On Vercel**: No proxy exists, and `VITE_API_URL` environment variable is not set

## Solution

### Step 1: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL from Render (e.g., `https://polaristest-backend.onrender.com`)
   - **Environments**: Production, Preview, Development (check all)

### Step 2: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click the **⋯** menu → **Redeploy**
4. OR push a new commit to trigger automatic deployment

### Step 3: Verify

After redeployment:
1. Open your Vercel app
2. Navigate to Admin → Data Health
3. Navigate to Admin → Data Access
4. Both pages should now load correctly

## What Changed

### Updated Files:
- **vercel.json**: Added CORS headers configuration for API routes (already committed)
- **backend/server.js**: Already has CORS configured to allow `.vercel.app` domains ✅

### Architecture:
```
Vercel (Frontend) → VITE_API_URL → Render (Backend)
     ↓                                    ↓
  index.html                         Express API
     ↓                                    ↓
  React App  -------- API Calls ----→  /api/admin/data-health
                                       /api/admin/api-keys
                                       /api/reporting/*
```

## Troubleshooting

### If pages still don't work:

1. **Check browser console** for error messages
2. **Verify environment variable** is set correctly in Vercel
3. **Check backend logs** on Render for CORS errors
4. **Ensure backend is running** on Render (check service status)

### Common Errors:

- **404 Not Found**: Backend URL is incorrect or backend is down
- **CORS Error**: Backend CORS configuration issue (should already be fixed)
- **Network Error**: Backend URL is wrong or not accessible

## Environment Variables Checklist

### Vercel (Frontend):
- ✅ `VITE_API_URL` - Backend URL from Render
- ✅ `VITE_SUPABASE_URL` - Your Supabase project URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Render (Backend):
- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- ✅ `FRONTEND_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

## Notes

- The backend CORS configuration already allows all `.vercel.app` domains
- Environment variables prefixed with `VITE_` are embedded in the frontend build
- Always redeploy after changing environment variables
