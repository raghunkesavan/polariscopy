import React from 'react';
import '../../styles/keyboard-hints.css';

/**
 * KeyboardHint - Shows keyboard shortcut hint next to buttons/actions
 * 
 * @param {string} keys - The keyboard shortcut (e.g., "Ctrl+S", "Esc", "Enter")
 * @param {string} size - Size variant: 'small' | 'normal'
 */
export default function KeyboardHint({ keys, size = 'small' }) {
  if (!keys) return null;

  return (
    <span className={`keyboard-hint keyboard-hint_${size}`} aria-label={`Keyboard shortcut: ${keys}`}>
      {keys}
    </span>
  );
}
