import React from 'react';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { useUiPreferences } from '../../hooks/useUiPreferences';
import ModalShell from './ModalShell';

/**
 * ConfirmationModal - A reusable confirmation dialog
 * Replaces window.confirm with styled Salesforce Lightning modal
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Called when Cancel is clicked or modal is dismissed
 * @param {function} onConfirm - Called when Confirm button is clicked
 * @param {string} title - Modal header title
 * @param {string} message - Main confirmation message
 * @param {string} confirmText - Text for confirm button (default: 'Confirm')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 * @param {string} confirmButtonClass - CSS class for confirm button (default: 'slds-button_destructive' for destructive actions)
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'slds-button_destructive'
}) {
  const uiPrefs = useUiPreferences();
  
  // Keyboard shortcuts - only enabled if user preference allows
  useEscapeKey(() => {
    if (isOpen) {
      onClose();
    }
  }, isOpen && uiPrefs.keyboardShortcutsEnabled);
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const footerButtons = (
    <>
      <button className="slds-button slds-button_neutral" onClick={onClose}>
        {cancelText}
      </button>
      <button className={`slds-button ${confirmButtonClass}`} onClick={handleConfirm}>
        {confirmText}
      </button>
    </>
  );

  return (
    <ModalShell 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      footer={footerButtons}
    >
      <div className="slds-text-body_regular">
        {message}
      </div>
    </ModalShell>
  );
}
