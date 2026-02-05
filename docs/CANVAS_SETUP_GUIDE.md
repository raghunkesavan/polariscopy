# Canvas Integration Setup Guide

## Overview
This guide explains how to test the Salesforce Canvas integration with your localhost environment.

## Architecture

```
Frontend (React)          Backend (Express)       Salesforce Canvas
localhost:3000    ----→   localhost:3001    ←----   (Production)
  |                          |
  └─ /canvas              /api/canvas
     (Canvas Component)     (Route Handler)
```

## Frontend Setup

### Canvas Component
- **Location**: `frontend/src/components/Canvas.jsx`
- **Route**: `http://localhost:3000/canvas`
- **Features**:
  - Detects Canvas context from `window.canvasData`
  - Sends Canvas parameters to backend
  - Displays connection status and responses
  - Dark mode support

### Canvas Styles
- **Location**: `frontend/src/styles/canvas.scss`
- Uses design tokens for consistent styling
- Responsive layout with status indicators

## Backend Setup

### Canvas API Route
- **Location**: `backend/routes/canvas.js`
- **Endpoint**: `POST /api/canvas`
- **Handlers**:
  - **Development**: Accepts `{ type: 'canvas_context', data: {...} }`
  - **Production**: Handles Salesforce signed requests with HMAC-SHA256 verification

## Testing Locally

### 1. Start Backend Server
```bash
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

### 2. Start Frontend Dev Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. Access Canvas Component
```
http://localhost:3000/canvas
```

### 4. Send Test Request to Backend (Optional)
```bash
curl -X POST http://localhost:3001/api/canvas \
  -H "Content-Type: application/json" \
  -d '{
    "type": "canvas_context",
    "data": {
      "recordId": "a12345",
      "action": "view"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Canvas context received",
  "timestamp": "2026-02-03T10:30:00Z",
  "data": {
    "recordId": "a12345",
    "action": "view"
  },
  "receivedAt": "2026-02-03T10:30:00.123Z"
}
```

## Environment Variables

### Frontend (.env or .env.local)
```
VITE_API_URL=http://localhost:3001
```

### Backend (.env)
```
CANVAS_CONSUMER_SECRET=your_consumer_secret_here
PORT=3001
```

## Debugging

### Check Connection Status
- **Initializing**: Component is starting up
- **Checking Canvas Data**: Looking for Salesforce Canvas context
- **Sending to Backend**: Making API call
- **Connected**: Successfully received backend response
- **Error States**: Check browser console for details

### Browser Console Logs
```javascript
// Component initialization
[Canvas Component] Canvas data available from window

// Backend communication
[Canvas Component] Sending canvas data to backend: {...}
[Canvas Component] Backend response: {...}
```

### Backend Logs
```
[Canvas] Received POST request
[Canvas] Request body: {...}
[Canvas] Received canvas context from frontend
[Canvas] Canvas parameters: {...}
```

## Production Deployment

### Salesforce Canvas Configuration
1. Create Canvas App in Salesforce Setup
2. Set Canvas App URL to your Vercel frontend URL
3. Configure parameters to pass: `recordId`, `action`, etc.
4. Set Consumer Secret in your environment variables

### Flow
1. User opens record in Salesforce
2. Canvas App loads your frontend at production URL
3. Salesforce sends signed request with HMAC-SHA256 signature
4. Frontend sends Canvas context to backend
5. Backend verifies signature and returns authenticated context

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/components/Canvas.jsx` | Main Canvas component |
| `frontend/src/styles/canvas.scss` | Canvas styling |
| `backend/routes/canvas.js` | Canvas API handler |
| `frontend/index.html` | Canvas parameter extraction script |
| `backend/server.js` | Backend server with Canvas route registration |

## Troubleshooting

### Canvas Data Not Available
- Check browser console for `[CANVAS]` logs
- Verify Salesforce Canvas SDK is loaded
- Ensure app is running inside Salesforce Canvas iframe

### Backend Connection Failed
- Check backend is running on correct port (default: 3001)
- Verify `VITE_API_URL` is set correctly in frontend
- Check CORS configuration in `backend/server.js`

### Signature Verification Failed (Production)
- Verify `CANVAS_CONSUMER_SECRET` matches Salesforce setup
- Check request format matches Salesforce Canvas specs
- Ensure HMAC-SHA256 calculation is correct

---

**Last Updated**: February 3, 2026
