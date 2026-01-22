import { useEffect, useState } from 'react';
import { UI_PREFERENCES, LOCALSTORAGE_CONSTANTS_KEY } from '../config/constants';

/**
 * Custom hook to access UI preferences from localStorage
 * Listens for storage events to update in real-time when Constants are changed
 */
export function useUiPreferences() {
  const [preferences, setPreferences] = useState(UI_PREFERENCES);

  useEffect(() => {
    // Load from localStorage on mount
    const loadPreferences = () => {
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_CONSTANTS_KEY);
        if (raw) {
          const overrides = JSON.parse(raw);
          if (overrides.uiPreferences) {
            setPreferences(prev => ({ ...prev, ...overrides.uiPreferences }));
          }
        }
      } catch (e) {
        // Failed to load preferences
      }
    };

    loadPreferences();

    // Listen for custom uiPreferencesChanged event (same-window changes)
    const handleUiPreferencesChange = (event) => {
      if (event.detail) {
        setPreferences(prev => ({ ...prev, ...event.detail }));
      }
    };

    // Listen for storage events (changes from other tabs)
    const handleStorageChange = (event) => {
      if (event.key === LOCALSTORAGE_CONSTANTS_KEY || event.key === null) {
        loadPreferences();
      }
    };

    window.addEventListener('uiPreferencesChanged', handleUiPreferencesChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('uiPreferencesChanged', handleUiPreferencesChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return preferences;
}
