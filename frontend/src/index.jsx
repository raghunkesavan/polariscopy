import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
//import canvasRoute from '.../routes/canvas.js';

// Polyfill Buffer for @react-pdf/renderer
window.Buffer = Buffer;
//const canvasRoute = require('./routes/canvas');
//App.use('/canvas', canvasRoute);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SupabaseProvider>
      <AppSettingsProvider>
        <App />
      </AppSettingsProvider>
    </SupabaseProvider>
  </React.StrictMode>
);

// Register service worker for cache control
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Silent fail - service worker is optional
    });
  });
}