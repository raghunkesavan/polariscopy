# Canvas Auto-Redirect Implementation

## Overview
The Canvas component now automatically redirects to `index.html` with all Salesforce Canvas parameters passed as URL query parameters and stored in `sessionStorage`.

## Changes Made

### 1. Canvas Component Updated (`frontend/src/components/Canvas.jsx`)
**Behavior Change:**
- ✅ Detects Salesforce Canvas context
- ✅ Sends context to backend for authentication
- ✅ Automatically redirects to `index.html?...` with all parameters
- ✅ Stores full context in `sessionStorage` for cross-page access
- ✅ Shows loading spinner during redirect

**Parameters Passed to index.html:**
```
/index.html?canvasToken=xyz...&canvas_recordId=a123&canvas_action=view&userId=005&userName=john@example.com&orgId=00d&orgName=Acme&instanceUrl=https://mfsuk...
```

### 2. Canvas Context Hook Created (`frontend/src/hooks/useCanvasContext.js`)
Use this hook in any component to access Canvas parameters:

```jsx
import useCanvasContext from '../hooks/useCanvasContext';

function MyComponent() {
  const { canvasContext, isFromCanvas, recordId, userId, orgId } = useCanvasContext();

  if (!isFromCanvas) {
    return <div>Not running from Canvas</div>;
  }

  return (
    <div>
      <p>Record ID: {canvasContext.environment.recordId}</p>
      <p>User: {canvasContext.user.userName}</p>
    </div>
  );
}
```

### 3. Canvas Styling Updated (`frontend/src/styles/canvas.scss`)
- Added redirect section styling
- Added loading spinner animation
- Blue theme for "connecting" state

## How It Works

### Flow Diagram
```
Salesforce Canvas
       ↓
   /canvas route
       ↓
Canvas Component initializes
       ↓
Detects window.canvasData
       ↓
Sends to backend (/api/canvas)
       ↓
Backend returns context + token
       ↓
Build query string with all params
       ↓
Store in sessionStorage
       ↓
Redirect to /index.html?...
       ↓
App loads with Canvas parameters
```

## Available Parameters

### URL Query String Format
```
canvasToken=<jwt_token>
canvas_<param_name>=<value>    # Custom Canvas parameters
userId=<sf_user_id>
userName=<sf_username>
userEmail=<sf_email>
orgId=<sf_org_id>
orgName=<sf_org_name>
instanceUrl=<sf_instance_url>
recordId=<sf_record_id>
```

### SessionStorage Format
```javascript
sessionStorage.getItem('canvasContext')
// Returns:
{
  "parameters": {
    "recordId": "a12345",
    "action": "view"
    // ... any custom Canvas parameters
  },
  "user": {
    "userId": "005xx000001Sv1",
    "userName": "john@example.com",
    "email": "john@example.com"
  },
  "organization": {
    "organizationId": "00Dxx0000000000",
    "name": "Acme Corp"
  },
  "environment": {
    "instanceUrl": "https://mfsuk--dev.sandbox.lightning.force.com",
    "recordId": "a12345"
  }
}
```

## Usage Examples

### 1. Access in Any Component
```jsx
import useCanvasContext from '../hooks/useCanvasContext';

export function HomePage() {
  const { isFromCanvas, recordId, userId, parameters } = useCanvasContext();

  return (
    <>
      {isFromCanvas && (
        <div>
          <p>Record ID: {recordId}</p>
          <p>User ID: {userId}</p>
          <pre>{JSON.stringify(parameters, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
```

### 2. Direct SessionStorage Access (if hook not imported)
```javascript
const canvasContext = JSON.parse(sessionStorage.getItem('canvasContext'));
if (canvasContext) {
  const recordId = canvasContext.environment.recordId;
  const userName = canvasContext.user.userName;
}
```

### 3. From URL Parameters (fallback)
```javascript
const params = new URLSearchParams(window.location.search);
const recordId = params.get('recordId');
const userId = params.get('userId');
```

## Integration Points

### LoginPage
- Use `useCanvasContext()` to pre-fill user info
- Check `isFromCanvas` to skip auth if coming from Canvas

### Calculator Pages
- Use `recordId` from Canvas to fetch related data
- Use `userId` to track changes

### Admin Pages
- Use `orgId` to scope admin functions to organization
- Use `instanceUrl` for Salesforce API calls

## Backend Changes

### Canvas Route (`backend/routes/canvas.js`)
- Accepts both development and production requests
- Returns Canvas context in response
- Frontend extracts token and parameters

### Development Mode
```bash
curl -X POST http://localhost:3001/api/canvas \
  -H "Content-Type: application/json" \
  -d '{
    "type": "canvas_context",
    "data": {
      "recordId": "a123",
      "action": "view"
    }
  }'
```

## Testing

### Test the Redirect
1. Start backend: `npm run dev` (backend folder)
2. Start frontend: `npm run dev` (frontend folder)
3. Open: `http://localhost:3000/canvas`
4. You should see:
   - Status changes from "initializing" → "sending-to-backend" → "connected"
   - Blue "Redirecting..." message with spinner
   - Then redirected to `index.html?...`

### Test Parameter Access
1. After redirect, open browser console
2. Run:
   ```javascript
   const { useCanvasContext } = await import('./hooks/useCanvasContext.js');
   const context = useCanvasContext();
   console.log(context.canvasContext);
   ```

## SessionStorage Persistence

Canvas context is stored in `sessionStorage` which means:
- ✅ Persists across page navigations (within same tab)
- ✅ Available to all components without re-fetching
- ✅ Cleared when tab/window closes
- ✅ Not shared across different tabs/windows

## Backward Compatibility

- ✅ Existing routes/pages work unchanged
- ✅ Hook returns `isFromCanvas: false` if not from Canvas
- ✅ No breaking changes to existing components
- ✅ Canvas route is optional - app works without it

## Files Changed

| File | Change | Impact |
|------|--------|--------|
| `frontend/src/components/Canvas.jsx` | Complete rewrite | Now redirects to index.html |
| `frontend/src/styles/canvas.scss` | Added redirect styling | Shows loading state |
| `frontend/src/hooks/useCanvasContext.js` | Created new hook | Access Canvas params anywhere |
| `backend/routes/canvas.js` | Enhanced (no breaking changes) | Already supports this |

## Next Steps

1. ✅ Test redirect locally at `http://localhost:3000/canvas`
2. ⏳ Integrate `useCanvasContext()` hook in relevant components
3. ⏳ Update LoginPage to use Canvas user context
4. ⏳ Update Calculator pages to use Canvas recordId
5. ⏳ Deploy to Vercel/Render with production Salesforce Canvas App

---

**Last Updated**: February 3, 2026
