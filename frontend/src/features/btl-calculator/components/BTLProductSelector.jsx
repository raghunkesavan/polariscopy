/**
 * BTL Product Selector Component
 * Handles product scope, retention options, and displays tier
 */

import React from 'react';
import '../../../styles/Calculator.scss';

export default function BTLProductSelector({ 
  inputs,
  onInputChange,
  productScopes = [],
  currentTier = 2,
  isReadOnly = false
}) {
  return (
    <div className="btl-product-selector">
      <div className="top-filters">
        {/* Product Type - Always BTL */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">Product Type</label>
          <div className="slds-form-element__control">
            <div><strong>BTL</strong></div>
          </div>
        </div>

        {/* Product Scope */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <abbr className="slds-required" title="required">*</abbr>
            Product Scope
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={inputs.productScope} 
              onChange={(e) => onInputChange('productScope', e.target.value)} 
              disabled={isReadOnly}
              required
            >
              <option value="">-- Select Product Scope --</option>
              {productScopes.map((ps) => (
                <option key={ps} value={ps}>{ps}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Retention Choice */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">Retention?</label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={inputs.retentionChoice} 
              onChange={(e) => onInputChange('retentionChoice', e.target.value)} 
              disabled={isReadOnly}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {/* Retention LTV - Only shown when retention is Yes */}
        {inputs.retentionChoice === 'Yes' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">Retention LTV</label>
            <div className="slds-form-element__control">
              <select 
                className="slds-select" 
                value={inputs.retentionLtv} 
                onChange={(e) => onInputChange('retentionLtv', e.target.value)} 
                disabled={isReadOnly}
              >
                <option value="65">65%</option>
                <option value="75">75%</option>
              </select>
            </div>
          </div>
        )}

        {/* Tier Display */}
        <div className="tier-display">
          <span className="tier-label">Based on the criteria:</span>
          <strong className={"tier-value" + (Number(currentTier) === 1 ? " tier-1" : "")}>
            Tier {currentTier}
          </strong>
        </div>
      </div>
    </div>
  );
}
