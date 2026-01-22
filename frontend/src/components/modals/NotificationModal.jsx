import React from 'react';
import ModalShell from './ModalShell';

/**
 * NotificationModal - Reusable modal for displaying messages to users
 * Replaces browser alert() with a consistent UI modal
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title (default: 'Notification')
 * @param {string} message - Message to display
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info' (default: 'info')
 */
export default function NotificationModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}) {
  // Determine icon and color based on type
  const getTypeStyle = () => {
    switch (type) {
      case 'success':
        return { icon: '✓', color: 'var(--token-success)', bgColor: 'var(--token-success-bg)' };
      case 'error':
        return { icon: '✕', color: 'var(--token-error)', bgColor: 'var(--token-error-bg)' };
      case 'warning':
        return { icon: '⚠', color: 'var(--token-warning)', bgColor: 'var(--token-warning-bg)' };
      case 'info':
      default:
        return { icon: 'ℹ', color: 'var(--token-info)', bgColor: 'var(--token-info-bg)' };
    }
  };

  const typeStyle = getTypeStyle();
  
  // Default title based on type if not provided
  const defaultTitle = title || (
    type === 'success' ? 'Success' :
    type === 'error' ? 'Error' :
    type === 'warning' ? 'Warning' :
    'Notification'
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={defaultTitle}
      maxWidth="500px"
      footer={(
        <button className="slds-button slds-button_brand" onClick={onClose}>
          OK
        </button>
      )}
    >
      <div className="flex gap-lg" style={{ 
        alignItems: 'flex-start',
        padding: 'var(--token-spacing-sm) 0'
      }}>
        <div style={{ 
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: typeStyle.bgColor,
          color: typeStyle.color,
          flexShrink: 0
        }} className="flex-center text-lg">
          {typeStyle.icon}
        </div>
        <div style={{ 
          flex: 1,
          paddingTop: 'var(--token-spacing-sm)',
          lineHeight: 'var(--token-line-height-base)',
          whiteSpace: 'pre-wrap'
        }} className="notification-message-text">
          {message}
        </div>
      </div>
    </ModalShell>
  );
}
