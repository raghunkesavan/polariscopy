import { useEffect, useState } from 'react';

const TYPOGRAPHY_KEY = 'app.typography.inter.enabled';

/**
 * Hook to manage Inter typography system
 * Adds/removes 'typography-inter-enabled' class on body
 */
export default function useTypography() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(TYPOGRAPHY_KEY);
      // Default to true if no stored preference
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  // Apply/remove the class on body when enabled changes
  useEffect(() => {
    if (enabled) {
      document.body.classList.add('typography-inter-enabled');
    } else {
      document.body.classList.remove('typography-inter-enabled');
    }
  }, [enabled]);

  // Listen for storage events (changes from other tabs/components)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === TYPOGRAPHY_KEY) {
        setEnabled(e.newValue === 'true');
      }
    };

    // Also listen for custom event for same-tab updates
    const handleCustom = () => {
      try {
        const stored = localStorage.getItem(TYPOGRAPHY_KEY);
        setEnabled(stored === 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('typographyUpdated', handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('typographyUpdated', handleCustom);
    };
  }, []);

  // Toggle function
  const toggle = (value) => {
    const newValue = typeof value === 'boolean' ? value : !enabled;
    setEnabled(newValue);
    localStorage.setItem(TYPOGRAPHY_KEY, String(newValue));
    window.dispatchEvent(new CustomEvent('typographyUpdated'));
  };

  return { enabled, toggle };
}

export { TYPOGRAPHY_KEY };
