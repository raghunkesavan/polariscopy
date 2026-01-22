/**
 * BTL Input Form Component
 * Handles property value, monthly rent, and basic inputs
 */

import React from 'react';
import { parseNumber, formatCurrency } from '../../../utils/calculator/numberFormatting';
import '../../../styles/Calculator.scss';

export default function BTLInputForm({ 
  inputs, 
  onInputChange, 
  isReadOnly = false 
}) {
  const handleCurrencyChange = (field) => (e) => {
    const rawValue = e.target.value;
    const numericValue = parseNumber(rawValue);
    onInputChange(field, numericValue);
  };

  const handleNumberChange = (field) => (e) => {
    const value = e.target.value;
    onInputChange(field, value);
  };

  return (
    <div className="btl-input-form">
      <div className="slds-grid slds-gutters slds-wrap">
        {/* Property Value */}
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="propertyValue">
              <abbr className="slds-required" title="required">*</abbr>
              Property Value
            </label>
            <div className="slds-form-element__control">
              <input
                type="text"
                id="propertyValue"
                className="slds-input"
                placeholder="£0"
                value={inputs.propertyValue ? formatCurrency(inputs.propertyValue) : ''}
                onChange={handleCurrencyChange('propertyValue')}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>
        </div>

        {/* Monthly Rent */}
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="monthlyRent">
              <abbr className="slds-required" title="required">*</abbr>
              Monthly Rent
            </label>
            <div className="slds-form-element__control">
              <input
                type="text"
                id="monthlyRent"
                className="slds-input"
                placeholder="£0"
                value={inputs.monthlyRent ? formatCurrency(inputs.monthlyRent) : ''}
                onChange={handleCurrencyChange('monthlyRent')}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>
        </div>

        {/* Top Slicing */}
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="topSlicing">
              Top Slicing
            </label>
            <div className="slds-form-element__control">
              <input
                type="text"
                id="topSlicing"
                className="slds-input"
                placeholder="£0"
                value={inputs.topSlicing ? formatCurrency(inputs.topSlicing) : ''}
                onChange={handleCurrencyChange('topSlicing')}
                disabled={isReadOnly}
              />
            </div>
            <div className="slds-form-element__help">
              Optional: Additional income to supplement rental income
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
