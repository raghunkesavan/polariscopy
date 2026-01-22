import React from 'react';
import CollapsibleSection from '../CollapsibleSection';
import { formatCurrencyInput } from '../../../utils/calculator/numberFormatting';
import HelpIcon from '../../ui/HelpIcon';

/**
 * BTLLoanDetailsSection - Handles loan calculation inputs for BTL Calculator
 * Property value, monthly rent, top slicing, loan type, and conditional inputs
 */
const BTLLoanDetailsSection = ({ 
  expanded, 
  onToggle,
  propertyValue,
  onPropertyValueChange,
  monthlyRent,
  onMonthlyRentChange,
  topSlicing,
  onTopSlicingChange,
  maxTopSlicingPct = 20,
  maxTopSlicingValue = 0,
  loanType,
  onLoanTypeChange,
  productSelectControl,
  // Conditional fields based on loanType
  specificNetLoan,
  onSpecificNetLoanChange,
  maxLtvInput,
  onMaxLtvInputChange,
  ltvMin,
  ltvMax,
  ltvPercent,
  specificGrossLoan,
  onSpecificGrossLoanChange,
  isReadOnly = false,
  publicMode = false
}) => {
  // Format max top slicing value for display
  const formatMaxTopSlicing = () => {
    if (!maxTopSlicingValue || maxTopSlicingValue <= 0) return '£0';
    return `£${maxTopSlicingValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get info box content based on loan type
  const getInfoBoxContent = () => {
    switch(loanType) {
      case 'Net loan required':
        return 'Used when the borrower needs a specific net loan after fees. The calculator checks if the requested amount fits within rental, stress rate, and LTV limits.';
      case 'Max gross loan':
        return 'Calculates the highest loan available based on property value, rent and policy rules. Gives an immediate view of maximum borrowing capacity, subject to valuation and underwriting.';
      case 'Specific LTV required':
        return 'Allows the user to set a target LTV. The calculator returns the maximum loan available at that LTV, ensuring it meets rental and policy requirements.';
      case 'Specific gross loan':
        return 'For cases where a borrower wants a specific gross loan before fees. The calculator validates if the request fits affordability, rent coverage, and lending policy.';
      default:
        return 'Choose a calculation type to begin. The selection determines which rules and fields the calculator uses to model the loan..';
    }
  };

  return (
    <CollapsibleSection 
      title="Loan details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="loan-details-grid">
        {/* Row 1: Loan calculation dropdown, dynamic input, info box, empty */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Loan calculation requested
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={loanType} 
              onChange={(e) => onLoanTypeChange(e.target.value)}
              disabled={isReadOnly}
            >
              <option value="">Select loan type...</option>
              <option value="Max gross loan">Max Gross Loan</option>
              <option value="Net loan required">Net loan required</option>
              {!publicMode && <option value="Specific LTV required">Specific LTV Required</option>}
              {!publicMode && <option value="Specific gross loan">Specific Gross Loan</option>}
            </select>
          </div>
        </div>

        {/* Dynamic input field based on loan type selection */}
        {loanType === 'Net loan required' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span>Net loan required
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={specificNetLoan} 
                onChange={(e) => onSpecificNetLoanChange(formatCurrencyInput(e.target.value))} 
                placeholder="£425,000"
                disabled={isReadOnly}
              />
              <div className="helper-text">Maximum GLA £9,000,000</div>
            </div>
          </div>
        )}

        {loanType === 'Specific LTV required' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span>Target LTV (%)
            </label>
            <div className="slds-form-element__control">
              <input
                type="range"
                min={ltvMin}
                max={ltvMax}
                value={maxLtvInput}
                onChange={(e) => onMaxLtvInputChange(Number(e.target.value))}
                disabled={isReadOnly}
                aria-valuemin={ltvMin}
                aria-valuemax={ltvMax}
                aria-valuenow={maxLtvInput}
                className="ltv-slider"
                style={{ background: `linear-gradient(90deg, var(--token-info) ${ltvPercent}%, var(--token-ui-background-subtle) ${ltvPercent}%)` }}
              />
              <div className="helper-text">
                Selected: <strong>{maxLtvInput}%</strong> (Max available: <strong>{ltvMax}%</strong>)
              </div>
            </div>
          </div>
        )}

        {loanType === 'Specific gross loan' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span>Specific gross loan
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={specificGrossLoan} 
                onChange={(e) => onSpecificGrossLoanChange(formatCurrencyInput(e.target.value))} 
                placeholder="£550,000"
                disabled={isReadOnly}
              />
              <div className="helper-text">Enter desired gross loan amount</div>
            </div>
          </div>
        )}

        {(loanType === 'Max gross loan' || !loanType) && (
          <div className="slds-form-element">
            {/* Empty placeholder when Max gross loan selected or no selection */}
          </div>
        )}

        {/* Info box */}
        <div className="slds-form-element" style={{ gridColumn: 'span 2' }}>
          <div className="loan-info-box">
            <HelpIcon 
              content={getInfoBoxContent()} 
              align="bottom"
              label="Loan calculation information"
            />
            <div className="info-text">
              {getInfoBoxContent()}
            </div>
          </div>
        </div>

        {/* Row 2: Property value, Monthly rent, Top slicing, Select your product */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Property value
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={propertyValue} 
              onChange={(e) => onPropertyValueChange(formatCurrencyInput(e.target.value))} 
              placeholder="£1,200,000"
              disabled={isReadOnly}
            />
            <div className="helper-text">Subject to valuation</div>
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Monthly rent
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={monthlyRent} 
              onChange={(e) => onMonthlyRentChange(formatCurrencyInput(e.target.value))} 
              placeholder="£3,000"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {!publicMode && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              Top slicing
              <HelpIcon 
                content="Additional monthly income that can be used to supplement rental income for affordability calculations. Maximum top slicing is calculated as a percentage of the monthly rent." 
                align="top"
                label="Top slicing information"
              />
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={topSlicing} 
                onChange={(e) => onTopSlicingChange(e.target.value)} 
                placeholder="e.g. 600"
                disabled={isReadOnly}
              />
              <div className="helper-text">
                Maximum top slicing: {formatMaxTopSlicing()} ({maxTopSlicingPct}% of monthly rent)
              </div>
            </div>
          </div>
        )}

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>Select your product
          </label>
          <div className="slds-form-element__control">
            {productSelectControl}
            <div className="helper-text">Default is first product for the selected product scope</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default BTLLoanDetailsSection;
