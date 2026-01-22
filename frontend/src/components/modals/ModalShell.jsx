import React, { useEffect } from 'react';
import '../../styles/Modal.css';

// ModalShell: reusable modal framing component
// Props:
// - isOpen: boolean
// - onClose: fn
// - title: string (header title)
// - children: modal body
// - footer: optional JSX for footer area (buttons)
// - maxWidth / maxHeight optional styling overrides
export default function ModalShell({ isOpen, onClose, title, children, footer, maxWidth = '800px', maxHeight = '90vh' }) {
  // Add Escape key listener to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="slds-backdrop slds-backdrop_open">
      <div
        className="slds-modal__container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, maxHeight }}
      >
        <div className="slds-modal__header" style={{ background: 'var(--token-brand-header)', padding: 'var(--token-spacing-lg) var(--token-spacing-xl)' }}>
          <h2 className="slds-modal__title" style={{ margin: 0, fontSize: 'var(--token-font-size-lg)', fontWeight: 700, color: 'var(--token-text-inverse)' }}>{title}</h2>
        </div>

        <div className="slds-modal__content" style={{ padding: 'var(--token-spacing-lg) var(--token-spacing-xl)', overflowY: 'auto' }}>
          {children}
        </div>

        <div className="slds-modal__footer">
          {footer}
        </div>
      </div>
    </div>
  );
}
