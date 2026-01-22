# Salesforce Embedding Implementation Guide

## Overview

The navigation has been extracted into separate, reusable components to support future Salesforce iframe embedding. The app now detects when it's running inside an iframe and conditionally shows/hides navigation based on the embedding context.

## Architecture

### New Components

#### 1. **AppShell** (`frontend/src/components/AppShell.jsx`)
Main layout wrapper that:
- Detects embedded mode (iframe + `?embedded=1` query parameter)
- Conditionally renders navigation based on context
- Sends ready message to Salesforce host when embedded
- Applies appropriate layout classes for standalone vs embedded modes

#### 2. **AppNav** (`frontend/src/components/AppNav.jsx`)
Consolidated navigation component containing:
- Header with app title
- Theme toggle
- User profile button
- Sidebar navigation (from existing Navigation component)

#### 3. **Embedding Utilities** (`frontend/src/utils/embedding.js`)
Helper functions for:
- Detecting iframe context
- Checking embedded query parameter
- Sending messages to parent window (Salesforce)
- Listening for host messages (postMessage API)

### File Structure

```
frontend/src/
├── components/
│   ├── AppShell.jsx          (NEW - layout wrapper)
│   ├── AppNav.jsx             (NEW - navigation component)
│   └── Navigation.jsx         (EXISTING - sidebar nav)
├── styles/
│   ├── app-shell.scss         (NEW - layout styles)
│   └── app-nav.scss           (NEW - nav styles)
├── utils/
│   └── embedding.js           (NEW - embedding detection)
└── App.jsx                    (UPDATED - uses AppShell)
```

## How It Works

### Standalone Mode (Normal Use)
When the app runs standalone (not in an iframe):
- Full navigation is visible (header + sidebar)
- Standard layout with all controls
- Access via: `http://localhost:5173/calculator/btl`

### Embedded Mode (Salesforce iframe)
When the app runs embedded in Salesforce:
- Navigation is completely hidden
- Layout adjusts to maximize content area
- Salesforce host controls navigation
- Access via: `http://localhost:5173/calculator/btl?embedded=1`

### Detection Logic
Embedded mode is activated when BOTH conditions are true:
1. App is running inside an iframe (`window.self !== window.top`)
2. URL contains `?embedded=1` parameter

## Salesforce Integration

### Embedding the App

In Salesforce, create a Lightning Web Component (LWC) or Visualforce page with an iframe:

```html
<iframe 
  src="https://your-app-domain.com/calculator/btl?embedded=1"
  width="100%"
  height="800px"
  frameborder="0"
  title="Project Polaris Calculator"
></iframe>
```

### Host-App Communication

The app uses the `postMessage` API for cross-frame communication:

#### App → Salesforce (Outbound Messages)
```javascript
// Example: App ready notification
{
  source: 'polaris-calculator',
  type: 'app-ready',
  data: {
    version: '1.0.0',
    features: ['btl-calculator', 'bridging-calculator', 'quotes']
  },
  timestamp: 1234567890
}
```

#### Salesforce → App (Inbound Messages)
To listen for messages from the app in Salesforce:

```javascript
// In your Salesforce Lightning Component
window.addEventListener('message', (event) => {
  // Validate origin in production
  // if (event.origin !== 'https://your-app-domain.com') return;
  
  if (event.data.source === 'polaris-calculator') {
    console.log('Message from calculator:', event.data);
    
    switch(event.data.type) {
      case 'app-ready':
        // App has loaded successfully
        break;
      // Add more cases as needed
    }
  }
});
```

### Navigation Control from Salesforce

To control navigation from the Salesforce host, send messages to the iframe:

```javascript
// In Salesforce - send navigation command to iframe
const iframe = document.querySelector('iframe[title="Project Polaris Calculator"]');
iframe.contentWindow.postMessage({
  type: 'navigate',
  route: '/calculator/bridging'
}, 'https://your-app-domain.com');
```

Then add a listener in the app (in `AppShell.jsx` or a dedicated hook):

```javascript
useEffect(() => {
  const cleanup = listenToHostMessages((message) => {
    if (message.type === 'navigate') {
      navigate(message.route);
    }
  });
  
  return cleanup;
}, [navigate]);
```

## Testing

### Test Standalone Mode
1. Start the dev server: `npm run dev`
2. Visit: `http://localhost:5173/calculator/btl`
3. ✅ Navigation should be visible

### Test Embedded Mode
1. Start the dev server: `npm run dev`
2. Visit: `http://localhost:5173/calculator/btl?embedded=1`
3. ✅ Navigation should be HIDDEN
4. ✅ Content should fill the viewport

### Test with Iframe
Create a simple HTML file to simulate Salesforce:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Salesforce Host Simulator</title>
  <style>
    body { margin: 0; font-family: sans-serif; }
    .host-nav { background: #032d60; color: white; padding: 1rem; }
    iframe { width: 100%; height: calc(100vh - 60px); border: none; }
  </style>
</head>
<body>
  <div class="host-nav">
    <h1>Salesforce (Simulated Host)</h1>
    <button onclick="navigateTo('/calculator/btl')">BTL Calculator</button>
    <button onclick="navigateTo('/calculator/bridging')">Bridging Calculator</button>
  </div>
  
  <iframe id="app" src="http://localhost:5173/calculator/btl?embedded=1"></iframe>
  
  <script>
    // Listen for messages from app
    window.addEventListener('message', (event) => {
      console.log('Message from app:', event.data);
    });
    
    // Send navigation commands
    function navigateTo(route) {
      document.getElementById('app').contentWindow.postMessage({
        type: 'navigate',
        route: route
      }, 'http://localhost:5173');
    }
  </script>
</body>
</html>
```

## Security Considerations

### Production Deployment

1. **Origin Validation**: Update `embedding.js` to validate message origins:
   ```javascript
   // Replace '*' with specific Salesforce domain
   if (event.origin !== 'https://your-salesforce-domain.com') return;
   ```

2. **Content Security Policy**: Update headers to allow framing from Salesforce:
   ```
   Content-Security-Policy: frame-ancestors 'self' https://your-salesforce-domain.com
   ```

3. **CORS Configuration**: Ensure backend allows requests from Salesforce domain

## Benefits

✅ **Future-proof**: Clean separation allows easy integration with any host platform
✅ **Flexible**: Works in standalone mode and embedded mode seamlessly
✅ **Maintainable**: Navigation logic is centralized in dedicated components
✅ **Testable**: Easy to test both modes independently
✅ **Extensible**: postMessage bridge allows bidirectional communication

## Next Steps

1. ✅ Navigation extracted to separate components
2. ✅ Embedding detection implemented
3. ✅ Layout adjusts based on context
4. 🔲 Implement navigation message listener in AppShell
5. 🔲 Add more postMessage events as needed
6. 🔲 Deploy to staging and test with actual Salesforce instance
7. 🔲 Update origin validation for production security

## Related Files

- Component architecture: This file
- Copilot instructions: `.github/copilot-instructions.md`
- Deployment guide: `DEPLOYMENT.md`
