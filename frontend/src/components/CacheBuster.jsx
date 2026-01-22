import React, { useEffect } from 'react';

/**
 * CacheBuster component that forces a hard reload when version changes
 * Place this in your App.jsx to automatically clear cache on updates
 */
const CacheBuster = () => {
  useEffect(() => {
    // Check version in localStorage
    const currentVersion = '1.0.' + Date.now();
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      // Version changed, clear caches and reload
      
      // Clear localStorage except for important data
      const keysToKeep = ['supabase.auth.token', 'app.constants.override.v1'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear service worker caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Update version and force reload
      localStorage.setItem('app_version', currentVersion);
      window.location.reload(true);
    } else if (!storedVersion) {
      localStorage.setItem('app_version', currentVersion);
    }
  }, []);
  
  return null;
};

export default CacheBuster;
