import { useEffect } from 'react';

/**
 * useKeyboardShortcut - Hook to handle keyboard shortcuts
 * 
 * @param {string} key - The key to listen for (e.g., 's', 'Escape', 'Enter')
 * @param {function} callback - Function to call when shortcut is triggered
 * @param {object} options - Options: { ctrl: boolean, shift: boolean, alt: boolean, enabled: boolean }
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrl = false, shift = false, alt = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Check if the key matches
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      
      // Check modifiers
      const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        // Prevent default browser behavior
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrl, shift, alt, enabled]);
}

/**
 * useEscapeKey - Shortcut hook specifically for Escape key
 */
export function useEscapeKey(callback, enabled = true) {
  useKeyboardShortcut('Escape', callback, { enabled });
}

/**
 * useEnterKey - Shortcut hook specifically for Enter key
 */
export function useEnterKey(callback, options = {}) {
  useKeyboardShortcut('Enter', callback, options);
}

/**
 * useSaveShortcut - Shortcut hook for Ctrl+S (or Cmd+S on Mac)
 */
export function useSaveShortcut(callback, enabled = true) {
  useKeyboardShortcut('s', callback, { ctrl: true, enabled });
}
