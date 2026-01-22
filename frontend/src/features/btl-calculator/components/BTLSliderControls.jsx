/**
 * BTL Slider Controls Component
 * Renders slider controls for rolled months and deferred interest per column
 */

import React from 'react';
import '../../../styles/Calculator.scss';

export default function BTLSliderControls({
  columnKey,
  rolledMonths,
  deferredInterest,
  optimizedRolled,
  optimizedDeferred,
  isManualMode,
  onRolledChange,
  onDeferredChange,
  onReset,
  isReadOnly = false,
  maxRolledMonths = 18,
  maxDeferredPercent = 100
}) {
  const handleRolledChange = (e) => {
    if (isReadOnly) return;
    const value = Math.max(0, Number(e.target.value));
    onRolledChange(columnKey, value);
  };

  const handleDeferredChange = (e) => {
    if (isReadOnly) return;
    const value = Math.max(0, Number(e.target.value));
    onDeferredChange(columnKey, value);
  };

  const handleReset = () => {
    if (isReadOnly) return;
    onReset(columnKey);
  };

  // Use manual values if set, otherwise use optimized values
  const displayRolled = rolledMonths ?? optimizedRolled ?? 0;
  const displayDeferred = deferredInterest ?? optimizedDeferred ?? 0;

  return (
    <div className="btl-slider-controls">
      {/* Rolled Months Slider */}
      <div className="slds-form-element">
        <label className="slds-form-element__label" htmlFor={`rolled-${columnKey}`}>
          <span className="slds-text-title_caps">Rolled Months</span>
          <span className="slds-text-body_small slds-m-left_x-small">
            ({displayRolled} months)
          </span>
        </label>
        <div className="slds-form-element__control">
          <input
            type="range"
            id={`rolled-${columnKey}`}
            min="0"
            max={maxRolledMonths}
            step="1"
            value={displayRolled}
            onChange={handleRolledChange}
            disabled={isReadOnly}
            className="slds-slider"
          />
        </div>
      </div>

      {/* Deferred Interest Slider */}
      <div className="slds-form-element">
        <label className="slds-form-element__label" htmlFor={`deferred-${columnKey}`}>
          <span className="slds-text-title_caps">Deferred Interest</span>
          <span className="slds-text-body_small slds-m-left_x-small">
            ({displayDeferred}%)
          </span>
        </label>
        <div className="slds-form-element__control">
          <input
            type="range"
            id={`deferred-${columnKey}`}
            min="0"
            max={maxDeferredPercent}
            step="1"
            value={displayDeferred}
            onChange={handleDeferredChange}
            disabled={isReadOnly}
            className="slds-slider"
          />
        </div>
      </div>

      {/* Reset Button (only show if in manual mode) */}
      {isManualMode && !isReadOnly && (
        <div className="slds-text-align_center">
          <button
            type="button"
            className="slds-button slds-button_neutral slds-button_stretch"
            onClick={handleReset}
            title="Reset to optimized values"
          >
            Reset to Optimized
          </button>
        </div>
      )}

      {/* Show manual mode indicator */}
      {isManualMode && (
        <div className="slds-text-align_center manual-mode-indicator">
          <span className="slds-badge slds-theme_warning">Manual Mode</span>
        </div>
      )}
    </div>
  );
}
