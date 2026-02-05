# Salesforce Canvas Data Flow

## Overview
This document describes how data flows from Salesforce Canvas into the MFS Portal application.

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SALESFORCE SANDBOX                            │
│                  (mfsuk--dev.sandbox.lightning.force.com)            │
│                                                                       │
│  User opens MFS App in Salesforce Canvas (embedded iframe)           │
│  • Canvas App configured with recordId & action parameters           │
│  • Canvas App is embedded within a Salesforce Lightning page         │
└─────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Step 1: Canvas SDK initializes
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│              FRONTEND (React App on Vercel)                           │
│              index.html - Canvas Extraction Script                    │
│                                                                       │
│  1. Salesforce Canvas SDK loaded from CDN:                           │
│     https://mfsuk--dev.sandbox.lightning.force.com/canvas/sdk/...    │
│                                                                       │
│  2. initCanvasApp() called on page load                              │
│     - Checks if Sfdc.canvas.client is available                      │
│     - Calls Sfdc.canvas.client.refreshSignedRequest()                │
└─────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Step 2: Salesforce signs data
                                   │ Creates signed_request (signature.base64Envelope)
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (index.html)                                               │
│  Signed Request Structure:                                           │
│  ┌───────────────────────────────────────────────────────┐           │
│  │ signed_request = signature . base64EncodedEnvelope    │           │
│  │                                                       │           │
│  │ Envelope contains (after decode):                     │           │
│  │ {                                                     │           │
│  │   "client": {                                         │           │
│  │     "oauthToken": "...",                              │           │
│  │     "instanceUrl": "https://mfsuk--dev.sandbox...",   │           │
│  │     "targetOrigin": "..."                             │           │
│  │   },                                                  │           │
│  │   "context": {                                        │           │
│  │     "user": { userName, userId, email, ... },         │           │
│  │     "organization": { organizationId, name, ... },    │           │
│  │     "environment": {                                  │           │
│  │       "parameters": { recordId, action, ... }         │           │
│  │     }                                                 │           │
│  │   }                                                   │           │
│  │ }                                                     │           │
│  └───────────────────────────────────────────────────────┘           │
└─────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Step 3: Frontend sends to backend
                                   │ fetch('/api/canvas', {
                                   │   method: 'POST',
                                   │   body: { signed_request }
                                   │ })
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│              BACKEND (Express on Render)                             │
│              routes/canvas.js - POST /api/canvas                     │
│                                                                       │
│  Step 4: Verify Signature                                            │
│  ─────────────────────────────                                       │
│  • Split signed_request: signature & encodedEnvelope                 │
│  • Use CANVAS_CONSUMER_SECRET from environment                       │
│  • Calculate: HMAC-SHA256(CANVAS_CONSUMER_SECRET, encodedEnvelope)   │
│  • Compare: expectedSignature === receivedSignature                  │
│                                                                       │
│  Step 5: Decode & Extract Data                                       │
│  ──────────────────────────────                                      │
│  • Base64 decode the envelope                                        │
│  • Parse JSON                                                        │
│  • Extract:                                                          │
│    - canvasParameters (recordId, action, etc.)                       │
│    - User info (userName, userId, email)                            │
│    - Organization info (orgId, name)                                 │
│    - OAuth token & instance URL                                      │
│                                                                       │
│  Step 6: Return Verified Data to Frontend                            │
│  ──────────────────────────────────────                              │
│  return res.json({                                                   │
│    success: true,                                                    │
│    canvasParameters: { recordId, action, ... },                      │
│    context: { user, organization, ... },                            │
│    client: { oauthToken, instanceUrl, ... }                          │
│  })                                                                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Step 7: Frontend receives verified data
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│              FRONTEND (React - index.html)                           │
│                                                                       │
│  Step 8: Store in Window Object                                      │
│  ────────────────────────────────                                    │
│  window.canvasData = {                                               │
│    isAvailable: true,                                                │
│    parameters: { recordId, action, ... },                            │
│    user: { userName, userId, ... },                                  │
│    organization: { organizationId, ... },                            │
│    client: { oauthToken, instanceUrl, ... }                          │
│  }                                                                   │
│                                                                       │
│  Step 9: Dispatch Event to React                                     │
│  ──────────────────────────────                                      │
│  window.dispatchEvent(new CustomEvent('canvasDataReady', {           │
│    detail: window.canvasData                                         │
│  }))                                                                 │
└─────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Step 10: React components listen & display
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│              FRONTEND (React - HomePage.jsx)                         │
│                                                                       │
│  Step 11: React Event Listener                                       │
│  ─────────────────────────────                                       │
│  useEffect(() => {                                                   │
│    window.addEventListener('canvasDataReady', () => {                │
│      setCanvasData(window.canvasData)                                │
│    })                                                                │
│  }, [])                                                              │
│                                                                       │
│  Step 12: Display to User                                            │
│  ───────────────────────                                             │
│  ┌──────────────────────────────────────────────────┐                │
│  │        DASHBOARD - Canvas Section (Top)          │                │
│  │  ┌──────────────────────────────────────────┐    │                │
│  │  │ Record ID: 001D000000IZ3STAA4            │    │                │
│  │  │ Action: view                             │    │                │
│  │  │ [Other Canvas Parameters]                │    │                │
│  │  └──────────────────────────────────────────┘    │                │
│  │                                                  │                │
│  │        [Rest of Dashboard Below]                │                │
│  └──────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components in the Flow

| Component | File | Role |
|-----------|------|------|
| **Canvas SDK Loader** | `frontend/index.html` | Loads Salesforce Canvas SDK from CDN |
| **Extraction Script** | `frontend/index.html` (lines 23-115) | Calls `refreshSignedRequest()` and POSTs to backend |
| **Backend Verifier** | `backend/routes/canvas.js` | Verifies HMAC-SHA256 signature and decodes envelope |
| **React Display** | `frontend/src/pages/HomePage.jsx` | Listens for `canvasDataReady` event and displays recordId/action |

---

## Security: Signature Verification

The signed request from Salesforce uses HMAC-SHA256 to ensure data integrity:

```javascript
// Salesforce creates:
signature = HMAC-SHA256(CONSUMER_SECRET, envelope)

// Backend verifies:
const expectedSignature = crypto
  .createHmac('sha256', CANVAS_CONSUMER_SECRET)
  .update(encodedEnvelope)
  .digest('base64');

// Must match for data to be trusted
if (expectedSignature !== receivedSignature) {
  return error('Invalid signature - verification failed')
}
```

---

## Data Available After Flow Completes

✅ **Canvas Parameters** - recordId, action, any custom parameters  
✅ **User Information** - userName, userId, email, fullName  
✅ **Organization Info** - organizationId, name, type  
✅ **OAuth Token** - Can be used to call Salesforce APIs  
✅ **Instance URL** - Salesforce org endpoint  

This data is stored in `window.canvasData` and accessible to all React components via the `canvasDataReady` event.

---

## Step-by-Step Summary

1. **User opens MFS Portal in Salesforce Canvas** → Canvas SDK loads
2. **Frontend requests signed data** → Calls `refreshSignedRequest()`
3. **Salesforce returns signed request** → Contains encrypted context and parameters
4. **Frontend POSTs to backend** → Sends `signed_request` to `/api/canvas`
5. **Backend verifies signature** → Ensures data came from Salesforce
6. **Backend decodes envelope** → Extracts user, org, and parameters
7. **Backend returns verified data** → Sends JSON response
8. **Frontend stores in window.canvasData** → Makes available globally
9. **Frontend dispatches event** → Notifies React components
10. **React components listen** → Update state with Canvas data
11. **HomePage displays recordId and action** → Shown in prominent blue banner at top
12. **User sees Canvas context** → Dashboard displays which Salesforce record they're viewing

---

**Date Generated:** January 24, 2026  
**Environment:** Salesforce Sandbox (mfsuk--dev)  
**Frontend:** Vercel (https://polaristest-theta.vercel.app)  
**Backend:** Render (separate Express API)  
**Database:** Supabase PostgreSQL
