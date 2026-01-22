import React, { useEffect, useMemo } from 'react';
import CollapsibleSection from '../CollapsibleSection';
import { formatCurrencyInput } from '../../../utils/calculator/numberFormatting';
import HelpIcon from '../../ui/HelpIcon';

/**
 * LoanDetailsSection - Handles loan input fields for Bridging calculator
 * Property value, gross loan, first charge value (for second charge), term, etc.
 */
const LoanDetailsSection = ({ 
  expanded, 
  onToggle,
  propertyValue,
  onPropertyValueChange,
  grossLoan,
  onGrossLoanChange,
  chargeType,
  firstChargeValue,
  onFirstChargeValueChange,
  monthlyRent,
  onMonthlyRentChange,
  topSlicing,
  onTopSlicingChange,
  useSpecificNet,
  onUseSpecificNetChange,
  specificNetLoan,
  onSpecificNetLoanChange,
  term,
  onTermChange,
  commitmentFee,
  onCommitmentFeeChange,
  exitFeePercent,
  onExitFeePercentChange,
  termRange = { min: 1, max: 24 },
  isReadOnly = false,
  loanCalculationRequested = 'Gross loan',
  onLoanCalculationRequestedChange,
  subProductLimits = {},
  subProduct
}) => {
  // When loan calculation type changes, handle field visibility
  useEffect(() => {
    if (loanCalculationRequested === 'Net loan') {
      onGrossLoanChange('0');
      if (useSpecificNet !== 'Yes') {
        onUseSpecificNetChange('Yes');
      }
    } else {
      // Gross loan selected
      if (useSpecificNet !== 'No') {
        onUseSpecificNetChange('No');
      }
      onSpecificNetLoanChange('');
    }
  }, [loanCalculationRequested, useSpecificNet, onGrossLoanChange, onUseSpecificNetChange, onSpecificNetLoanChange]);

  // Get info box content based on selected sub-product
  const subProductInfo = useMemo(() => {
    let info = { loanSize: null, ltv: null };
    
    if (!subProduct || !subProductLimits) return info;

    // Normalize sub-product name for lookup
    const normalizedSubProduct = subProduct.trim().toLowerCase();
    
    // Check for second charge
    const isSecondCharge = chargeType && chargeType.toLowerCase().includes('second');
    
    // Find the matching limits
    let lim = null;
    for (const [key, limits] of Object.entries(subProductLimits)) {
      const normalizedKey = key.trim().toLowerCase();
      if (isSecondCharge) {
        // For second charge, look for keys containing 'second'
        if (normalizedKey.includes('second') && normalizedKey.includes(normalizedSubProduct)) {
          lim = limits;
          break;
        }
      } else {
        // For first charge, match the sub-product name
        if (normalizedKey === normalizedSubProduct || normalizedKey.includes(normalizedSubProduct)) {
          lim = limits;
          break;
        }
      }
    }

    if (lim) {
      if (lim.minLoanSize !== null || lim.maxLoanSize !== null) {
        const min = lim.minLoanSize != null ? `£${lim.minLoanSize.toLocaleString('en-GB')}` : '—';
        const max = lim.maxLoanSize != null ? `£${lim.maxLoanSize.toLocaleString('en-GB')}` : '—';
        info.loanSize = `Loan size: ${min} – ${max}`;
      }
      if (lim.minLtv !== null || lim.maxLtv !== null) {
        const min = lim.minLtv != null ? `${lim.minLtv}%` : '—';
        const max = lim.maxLtv != null ? `${lim.maxLtv}%` : '—';
        info.ltv = `Loan to Value: ${min} – ${max}`;
      }
    }

    return info;
  }, [subProduct, subProductLimits, chargeType]);

  return (
    <CollapsibleSection 
      title="Loan details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="loan-details-grid">
        {/* Row 1: Loan calculation requested, First charge value, Info box (spans 2) */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span> Loan calculation requested
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={loanCalculationRequested} 
              onChange={(e) => onLoanCalculationRequestedChange(e.target.value)} 
              disabled={isReadOnly}
            >
              <option value="Gross loan">Gross loan</option>
              <option value="Net loan">Net loan</option>
            </select>
          </div>
        </div>

        {chargeType === 'Second' ? (
          <div className="slds-form-element first-charge-warning">
            <label className="slds-form-element__label first-charge-label">
              <span className="required-asterisk">*</span> First charge value
              <span className="first-charge-hint"></span>
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input first-charge-input" 
                value={firstChargeValue} 
                onChange={(e) => onFirstChargeValueChange(formatCurrencyInput(e.target.value))} 
                placeholder="£0" 
                disabled={isReadOnly} 
              />
            </div>
          </div>
        ) : (
          <div className="slds-form-element"></div>
        )}

        {/* Info box - spans 2 columns */}
        <div className="slds-form-element" style={{ gridColumn: 'span 2' }}>
          <div className="loan-info-box " >
            <svg style={{ width: '20px', height: '20px', flexShrink: 0, fill: 'var(--token-interactive)' }} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <div style={{ width: '100%' }}>
              {subProductInfo.loanSize ? (
                <div style={{ marginBottom: '4px' }}>{subProductInfo.loanSize}</div>
              ) : (
                <div style={{ marginBottom: '4px' }}>Choose a calculation type to begin. The selection determines which rules and fields the calculator uses to model the loan.</div>
              )}
              {subProductInfo.ltv && <div>{subProductInfo.ltv}</div>}
            </div>
          </div>
        </div>

        {/* Row 2: Property value, Monthly rent, Top slicing, Gross/Net loan required */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span> Property value
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={propertyValue} 
              onChange={(e) => onPropertyValueChange(formatCurrencyInput(e.target.value))} 
              placeholder="£" 
              disabled={isReadOnly} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">Monthly rent</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={monthlyRent} 
              onChange={(e) => onMonthlyRentChange(formatCurrencyInput(e.target.value))} 
              placeholder="£" 
              disabled={isReadOnly} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            Top slicing
            <HelpIcon 
              content="Additional income used to top up rental income for affordability calculations."
              align="right"
            />
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={topSlicing} 
              onChange={(e) => onTopSlicingChange(formatCurrencyInput(e.target.value))} 
              placeholder="£" 
              disabled={isReadOnly} 
            />
          </div>
        </div>

        {loanCalculationRequested === 'Gross loan' ? (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span> Gross loan required
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={grossLoan} 
                onChange={(e) => onGrossLoanChange(formatCurrencyInput(e.target.value))} 
                placeholder="£" 
                disabled={isReadOnly} 
              />
            </div>
          </div>
        ) : (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span> Net loan required
            </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={specificNetLoan} 
                onChange={(e) => onSpecificNetLoanChange(formatCurrencyInput(e.target.value))} 
                placeholder="£" 
                disabled={isReadOnly} 
              />
            </div>
          </div>
        )}

        {/* Row 3: Bridging loan term slider (spans 2), Commitment fee, Exit fee */}
        <div className="slds-form-element" style={{ gridColumn: 'span 2' }}>
          <label className="slds-form-element__label">
            Bridging loan term
            <span style={{ marginLeft: '8px', color: 'var(--token-text-secondary)' }}>
              {termRange.min} months - {termRange.max} months
            </span>
          </label>
          <div className="slds-form-element__control">
            <input 
              type="range"
              min={termRange.min}
              max={termRange.max}
              value={term || 12}
              onChange={(e) => onTermChange(e.target.value)}
              disabled={isReadOnly}
              style={{ width: '100%' }}
            />
            <div style={{ 
              textAlign: 'center', 
              marginTop: '4px', 
              fontSize: 'var(--token-font-size-sm)',
              color: 'var(--token-text-secondary)'
            }}>
              {term || 12} months
            </div>
          </div>
        </div>

        {/* Row 3 continued: Commitment fee, Exit fee */}
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span> Commitment fee
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={commitmentFee} 
              onChange={(e) => onCommitmentFeeChange(formatCurrencyInput(e.target.value))} 
              placeholder="£" 
              disabled={isReadOnly} 
            />
          </div>
        </div>

        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span> Exit fee
          </label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={exitFeePercent} 
              onChange={(e) => onExitFeePercentChange(e.target.value)} 
              placeholder="%" 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        
        {/*
          Sub-product type and Charge type are driven from the Criteria section.
          We derive `subProduct` and `chargeType` from the selected answers there so
          users pick these via Criteria controls instead of separate Loan details fields.
        */}
      </div>
    </CollapsibleSection>
  );
};

export default LoanDetailsSection;
