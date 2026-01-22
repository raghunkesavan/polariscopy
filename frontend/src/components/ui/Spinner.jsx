import React from 'react';

export default function Spinner({ size = 'small', label = 'Loading' }) {
  const sizeClass = size === 'small' ? 'slds-spinner_small' : size === 'medium' ? 'slds-spinner_medium' : 'slds-spinner_large';
  return (
    <div className={`slds-spinner ${sizeClass} slds-spinner_brand`} role="status" aria-live="polite">
      <span className="slds-assistive-text">{label}</span>
      <div className="slds-spinner__dot-a"></div>
      <div className="slds-spinner__dot-b"></div>
    </div>
  );
}
