/**
 * BTL Additional Fees Component
 * Handles additional broker fee inputs
 */

import React from 'react';
import { parseNumber, formatCurrency } from '../../../utils/calculator/numberFormatting';
import '../../../styles/Calculator.scss';

export default function BTLAdditionalFees({ 
  inputs,
  onInputChange,
  isReadOnly = false
}) {
  const handleFeeAmountChange = (e) => {
    const value = e.target.value;
    onInputChange('additionalFeeAmount', value);
  };

  return (
    <div className="btl-additional-fees">
      <div className="slds-form-element">
        <div className="slds-form-element__control">
          <div className="slds-checkbox">
            <input
              type="checkbox"
              id="addFeesToggle"
              checked={inputs.addFeesToggle}
              onChange={(e) => onInputChange('addFeesToggle', e.target.checked)}
              disabled={isReadOnly}
            />
            <label className="slds-checkbox__label" htmlFor="addFeesToggle">
              <span className="slds-checkbox_faux"></span>
              <span className="slds-form-element__label">Any additional fees to be added?</span>
            </label>
          </div>
        </div>
      </div>

      <div className="slds-grid slds-gutters slds-wrap fees-grid">
        {/* Fee Calculation Type */}
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="feeCalculationType">
              Fee calculated as
            </label>
            <div className="slds-form-element__control">
              <select
                id="feeCalculationType"
                className="slds-select"
                value={inputs.feeCalculationType}
                onChange={(e) => onInputChange('feeCalculationType', e.target.value)}
                disabled={isReadOnly || !inputs.addFeesToggle}
              >
                <option value="percentage">Percent %</option>
                <option value="pound">GBP £</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fee Amount */}
        <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label" htmlFor="additionalFeeAmount">
              {inputs.feeCalculationType === 'percentage' ? 'Additional fee amount (%)' : 'Additional fee amount (£)'}
            </label>
            <div className="slds-form-element__control">
              <input
                type="text"
                id="additionalFeeAmount"
                className="slds-input"
                placeholder={inputs.feeCalculationType === 'percentage' ? 'e.g. 1.5' : 'e.g. 500'}
                value={inputs.additionalFeeAmount}
                onChange={handleFeeAmountChange}
                disabled={isReadOnly || !inputs.addFeesToggle}
              />
            </div>
            <div className="slds-form-element__help">
              {inputs.feeCalculationType === 'percentage' 
                ? 'Percentage of gross loan amount' 
                : 'Fixed fee amount in pounds'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
