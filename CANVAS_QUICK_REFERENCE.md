# Canvas Integration - Quick Reference

## Files Created/Modified

### ✅ Created
- `frontend/src/components/Canvas.jsx` — Main Canvas component
- `frontend/src/styles/canvas.scss` — Canvas styling
- `backend/scripts/test-canvas.js` — Test script
- `docs/CANVAS_SETUP_GUIDE.md` — Complete setup guide
- `CANVAS_INTEGRATION_CHANGES.md` — This change summary

### ✅ Modified
- `frontend/src/App.jsx` — Added Canvas import & route
- `backend/routes/canvas.js` — Enhanced request handling

## Quick Start

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Test (optional)
cd backend && node scripts/test-canvas.js
```

**Access**: http://localhost:3000/canvas

## Test Endpoint

```bash
curl -X POST http://localhost:3001/api/canvas \
  -H "Content-Type: application/json" \
  -d '{
    "type": "canvas_context",
    "data": { "recordId": "a123", "action": "view" }
  }'
```

## Component Flow

1. **Component loads** → `initializing`
2. **Checks for Canvas data** → `checking-canvas-data`
3. **Sends to backend** → `sending-to-backend`
4. **Receives response** → `connected` ✅

## Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| initializing | Gray | Starting up |
| checking-canvas-data | Yellow | Looking for Canvas context |
| sending-to-backend | Blue | Making API call |
| connected | Green | Successfully connected |
| error | Red | Something went wrong |

## Key Differences

### Development Mode (localhost)
- ✅ No Salesforce Canvas SDK required
- ✅ Simple JSON payload: `{ type: 'canvas_context', data: {...} }`
- ✅ Instant response
- ✅ Perfect for testing

### Production Mode (Salesforce)
- ✅ Salesforce Canvas SDK loads frontend in iframe
- ✅ Signed request with HMAC-SHA256 signature
- ✅ Full security verification
- ✅ User context from Salesforce

## Environment Setup

### Frontend
```env
VITE_API_URL=http://localhost:3001
```

### Backend
```env
CANVAS_CONSUMER_SECRET=your_secret_here
PORT=3001
```

## Support Files

| File | Purpose |
|------|---------|
| `docs/CANVAS_SETUP_GUIDE.md` | Detailed setup & troubleshooting |
| `CANVAS_INTEGRATION_CHANGES.md` | Change summary & next steps |
| `frontend/src/components/Canvas.jsx` | Component implementation |
| `backend/routes/canvas.js` | Backend handler |

## Troubleshooting

### Can't connect to backend?
- ✅ Check backend is running: `npm run dev` in backend folder
- ✅ Verify `VITE_API_URL` in frontend
- ✅ Check CORS is enabled in backend

### No Canvas context detected?
- ✅ This is normal if not in Salesforce iframe
- ✅ Component shows status "no-canvas-context"
- ✅ Can still test with curl/test script

### Backend test fails?
- ✅ Run: `node backend/scripts/test-canvas.js http://localhost:3001`
- ✅ Check backend server logs
- ✅ Verify payload format matches docs

---

**Status**: ✅ Ready to test
**Last Updated**: February 3, 2026
