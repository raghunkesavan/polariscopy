import React from 'react';
import ActionButtons from '../ActionButtons';

/**
 * TopFiltersSection - Product type, scope, retention, and tier display
 * Used in BTL Calculator for top-level filtering controls
 * 
 * @param {string} productScope - Current product scope selection
 * @param {function} onProductScopeChange - Handler for product scope changes
 * @param {array} productScopes - Available product scope options
 * @param {string} retentionChoice - 'Yes' or 'No'
 * @param {function} onRetentionChoiceChange - Handler for retention choice
 * @param {string} retentionLtv - '65' or '75'
 * @param {function} onRetentionLtvChange - Handler for retention LTV
 * @param {number} currentTier - Current tier number to display
 * @param {boolean} isReadOnly - Whether fields are read-only
 * @param {object} actionButtonsProps - Props to pass to ActionButtons component
 */
export default function TopFiltersSection({
  productScope,
  onProductScopeChange,
  productScopes,
  retentionChoice,
  onRetentionChoiceChange,
  retentionLtv,
  onRetentionLtvChange,
  currentTier,
  isReadOnly,
  actionButtonsProps
}) {
  return (
    <div className="top-filters">
      <div className="slds-form-element">
        <label className="slds-form-element__label">Product Type</label>
        <div className="slds-form-element__control">
          <div><strong>BTL</strong></div>
        </div>
      </div>

      <div className="slds-form-element">
        <label className="slds-form-element__label">Product Scope</label>
        <div className="slds-form-element__control">
          <select 
            className="slds-select" 
            value={productScope} 
            onChange={(e) => onProductScopeChange(e.target.value)} 
            disabled={isReadOnly}
          >
            {productScopes.map((ps) => (
              <option key={ps} value={ps}>{ps}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="slds-form-element">
        <label className="slds-form-element__label">Retention?</label>
        <div className="slds-form-element__control">
          <select 
            className="slds-select" 
            value={retentionChoice} 
            onChange={(e) => onRetentionChoiceChange(e.target.value)} 
            disabled={isReadOnly}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      </div>

      {retentionChoice === 'Yes' && (
        <div className="slds-form-element">
          <label className="slds-form-element__label">Retention LTV</label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={retentionLtv} 
              onChange={(e) => onRetentionLtvChange(e.target.value)} 
              disabled={isReadOnly}
            >
              <option value="65">65%</option>
              <option value="75">75%</option>
            </select>
          </div>
        </div>
      )}

      <div className="tier-display">
        <span className="tier-label">Based on the criteria:</span>
        <strong className="tier-value">Tier {currentTier}</strong>
      </div>

      <ActionButtons {...actionButtonsProps} />
    </div>
  );
}
