# Cache Control & Development Guide

## Problem
Browser caching was causing issues where changes made to the code weren't visible in the regular browser, but were visible in incognito mode.

## Solutions Implemented

### 1. Meta Tags (index.html)
Added cache control meta tags to prevent aggressive browser caching:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 2. Vite Build Configuration (vite.config.js)
Added hash-based file naming for cache busting:
```javascript
build: {
  rollupOptions: {
    output: {
      entryFileNames: `assets/[name].[hash].js`,
      chunkFileNames: `assets/[name].[hash].js`,
      assetFileNames: `assets/[name].[hash].[ext]`
    }
  }
}
```

### 3. Service Worker (public/service-worker.js)
Registered a service worker that:
- Clears all caches on activation
- Always fetches from network (no caching during development)
- Auto-updates on new deployments

### 4. Keyboard Shortcut (App.jsx)
Added **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac) to:
- Clear all browser caches
- Force a hard reload
- See changes immediately

## How to Use

### For Development:
1. **Make changes to your code**
2. **Press Ctrl+Shift+R** (or Cmd+Shift+R on Mac) to force clear cache and reload
3. **Or** simply press F5 to reload (cache control headers should prevent stale cache)

### For Testing:
- Use **Incognito/Private mode** for a completely fresh environment
- Or use **Ctrl+Shift+R** in your regular browser

### For Production:
- The hash-based file naming ensures users always get the latest version
- Service worker automatically clears old caches

## Removed Console Logs
All `console.log` statements have been removed from:
- `BTLQuotePDF.jsx` (removed 16 console.log calls)

This improves performance and reduces noise in the browser console.

## Browser Hard Refresh Shortcuts

| Browser | Windows/Linux | Mac |
|---------|--------------|-----|
| Chrome | Ctrl+Shift+R or Ctrl+F5 | Cmd+Shift+R |
| Firefox | Ctrl+Shift+R or Ctrl+F5 | Cmd+Shift+R |
| Edge | Ctrl+Shift+R or Ctrl+F5 | Cmd+Shift+R |
| Safari | - | Cmd+Option+R |

## Clearing All Browser Data
If you still see cached data:
1. Open DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Clear storage" or "Clear site data"
4. Check all options and click "Clear"

## Notes
- The service worker registration is optional and fails silently if not supported
- Cache control headers work in all modern browsers
- Hash-based naming ensures production users always get latest files
