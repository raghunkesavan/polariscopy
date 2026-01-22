/**
 * BTL Range Toggle Component
 * Toggles between Core and Specialist product ranges
 */

import React from 'react';
import '../../../styles/Calculator.scss';

export default function BTLRangeToggle({ 
  selectedRange, 
  onRangeChange, 
  isReadOnly = false 
}) {
  return (
    <div className="slds-button-group_segmented" role="group">
      <button
        className={`slds-button ${selectedRange === 'specialist' ? 'slds-is-selected' : ''}`}
        onClick={() => !isReadOnly && onRangeChange('specialist')}
        type="button"
        disabled={isReadOnly}
      >
        Specialist range
      </button>
      <button
        className={`slds-button ${selectedRange === 'core' ? 'slds-is-selected' : ''}`}
        onClick={() => !isReadOnly && onRangeChange('core')}
        type="button"
        disabled={isReadOnly}
      >
        Core range
      </button>
    </div>
  );
}
