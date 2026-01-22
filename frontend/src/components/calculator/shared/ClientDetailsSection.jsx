import React from 'react';
import ModernSwitch from '../../common/ModernSwitch';
import CollapsibleSection from '../CollapsibleSection';
import '../../../styles/Calculator.scss';

/**
 * Client Details Section Component
 * Handles client information form for both Direct and Broker types
 * Includes broker-specific fields like commission, route, and additional fees
 * Designed to work with useBrokerSettings hook
 * 
 * @param {Object} props - Component props
 * @param {string} props.clientType - 'Direct' or 'Broker'
 * @param {Function} props.setClientType - Client type setter
 * @param {string} props.clientFirstName - Client first name
 * @param {Function} props.setClientFirstName - First name setter
 * @param {string} props.clientLastName - Client last name
 * @param {Function} props.setClientLastName - Last name setter
 * @param {string} props.clientEmail - Client email
 * @param {Function} props.setClientEmail - Email setter
 * @param {string} props.clientContact - Client contact number
 * @param {Function} props.setClientContact - Contact setter
 * @param {string} props.brokerCompanyName - Broker company name
 * @param {Function} props.setBrokerCompanyName - Company name setter
 * @param {string} props.brokerRoute - Selected broker route
 * @param {Function} props.setBrokerRoute - Broker route setter
 * @param {number} props.brokerCommissionPercent - Broker commission percentage
 * @param {Function} props.handleBrokerCommissionChange - Commission change handler
 * @param {Function} props.getBrokerRoutesAndDefaults - Function to get broker config from localStorage
 * @param {string} props.calculatorType - 'btl' or 'bridge' to determine which proc fee to use
 * @param {boolean} props.addFeesToggle - Whether additional fees are enabled
 * @param {Function} props.setAddFeesToggle - Additional fees toggle setter
 * @param {string} props.feeCalculationType - 'pound' or 'percentage'
 * @param {Function} props.setFeeCalculationType - Fee calculation type setter
 * @param {string} props.additionalFeeAmount - Additional fee amount
 * @param {Function} props.setAdditionalFeeAmount - Fee amount setter
 * @param {boolean} props.expanded - Whether section is expanded
 * @param {Function} props.onToggle - Toggle handler
 * @param {boolean} props.isReadOnly - Whether form fields are read-only
 */
export default function ClientDetailsSection({
  clientType,
  setClientType,
  clientFirstName,
  setClientFirstName,
  clientLastName,
  setClientLastName,
  clientEmail,
  setClientEmail,
  clientContact,
  setClientContact,
  brokerCompanyName,
  setBrokerCompanyName,
  brokerRoute,
  setBrokerRoute,
  brokerCommissionPercent,
  handleBrokerCommissionChange,
  getBrokerRoutesAndDefaults,
  calculatorType = 'btl',
  addFeesToggle,
  setAddFeesToggle,
  feeCalculationType,
  setFeeCalculationType,
  additionalFeeAmount,
  setAdditionalFeeAmount,
  expanded = true,
  onToggle,
  isReadOnly = false
}) {
  return (
    <CollapsibleSection 
      title="Client details" 
      expanded={expanded} 
      onToggle={onToggle}
    >
      <div className="slds-grid slds-gutters align-items-stretch margin-bottom-05">
        <div className="slds-col width-100">
          <div className="slds-button-group_toggle" role="group">
            <button 
              type="button" 
              className={`slds-button ${clientType === 'Direct' ? 'slds-is-selected' : ''}`} 
              onClick={() => setClientType('Direct')}
            >
              Direct Client
            </button>
            <button 
              type="button" 
              className={`slds-button ${clientType === 'Broker' ? 'slds-is-selected' : ''}`} 
              onClick={() => setClientType('Broker')}
            >
              Broker
            </button>
          </div>
        </div>
      </div>

      <div className="loan-details-grid">
        {clientType === 'Broker' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label"><span className="slds-required">* </span>Broker company</label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                value={brokerCompanyName} 
                onChange={(e) => setBrokerCompanyName(e.target.value)} 
                disabled={isReadOnly} 
              />
            </div>
          </div>
        )}
        {clientType === 'Broker' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label"><span className="slds-required">* </span>Broker route</label>
            <div className="slds-form-element__control">
              <select 
                className="slds-select" 
                value={brokerRoute} 
                onChange={(e) => setBrokerRoute(e.target.value)} 
                disabled={isReadOnly}
              >
                {Object.values(getBrokerRoutesAndDefaults().routes).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {clientType === 'Broker' && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="slds-required">* </span>Broker Commision (%){' '}
              </label>
            <div className="slds-form-element__control">
              <input 
                className="slds-input" 
                type="number" 
                step="0.1"
                value={brokerCommissionPercent} 
                onChange={handleBrokerCommissionChange}
                disabled={isReadOnly}
                title={(() => {
                  const { defaults, tolerance } = getBrokerRoutesAndDefaults();
                  const routeDefaults = defaults[brokerRoute];
                  const defaultVal = typeof routeDefaults === 'object' ? routeDefaults[calculatorType] : (routeDefaults ?? 0.9);
                  const min = (defaultVal - tolerance).toFixed(1);
                  const max = (defaultVal + tolerance).toFixed(1);
                  return `Allowed range: ${min}% to ${max}%`;
                })()}
              />
            </div>
          </div>
        )}
        {clientType === 'Broker' && (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span style={{ fontSize: 'var(--token-font-size-sm)', color: 'var(--token-info)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: 'var(--token-font-size-md)' }}>ⓘ</span>
              Adjustable within ±{getBrokerRoutesAndDefaults().tolerance}% of default ({(() => {
                const { defaults } = getBrokerRoutesAndDefaults();
                const routeDefaults = defaults[brokerRoute];
                const defaultVal = typeof routeDefaults === 'object' ? routeDefaults[calculatorType] : (routeDefaults ?? 0.9);
                return defaultVal;
              })()}%)
            </span>
          </div>
        )}
      </div>

      {clientType === 'Broker' && (
        <div className="loan-details-grid margin-top-05">
          <div className="slds-form-element">
            <ModernSwitch
              label="Any additional fees to be added?"
              ariaLabel="Any additional fees to be added?"
              checked={addFeesToggle}
              onToggle={setAddFeesToggle}
              className="display-flex align-items-center height-100"
            />
          </div>

          <div className="slds-form-element">
            <label className="slds-form-element__label">Fee calculated as</label>
            <div className="slds-form-element__control">
              <select 
                className="slds-select" 
                value={feeCalculationType} 
                onChange={(e) => setFeeCalculationType(e.target.value)}
                disabled={isReadOnly || !addFeesToggle}
              >
                <option value="">Please select...</option>
                <option value="percentage">Percent %</option>
                <option value="pound">GBP £</option>
              </select>
            </div>
          </div>

          <div className="slds-form-element">
            <label className="slds-form-element__label">Additional fee amount (£)</label>
            <div className="slds-form-element__control">
              <input
                className="slds-input"
                type="number"
                step="0.01"
                value={feeCalculationType === 'pound' ? additionalFeeAmount : ''}
                onChange={(e) => setAdditionalFeeAmount(e.target.value)}
                placeholder="£0.00"
                aria-label="Additional fee amount in pounds"
                disabled={isReadOnly || !addFeesToggle || feeCalculationType !== 'pound'}
              />
            </div>
          </div>

          <div className="slds-form-element">
            <label className="slds-form-element__label">Additional fee amount (%)</label>
            <div className="slds-form-element__control">
              <input
                className="slds-input"
                type="number"
                step="0.1"
                value={feeCalculationType === 'percentage' ? additionalFeeAmount : ''}
                onChange={(e) => setAdditionalFeeAmount(e.target.value)}
                placeholder="0%"
                aria-label="Additional fee amount in percentage"
                disabled={isReadOnly || !addFeesToggle || feeCalculationType !== 'percentage'}
              />
            </div>
          </div>
        </div>
      )}

      <div className="loan-details-grid margin-top-05">
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>First name</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={clientFirstName} 
              onChange={(e) => setClientFirstName(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>Last name</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={clientLastName} 
              onChange={(e) => setClientLastName(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>Email</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              type="email" 
              value={clientEmail} 
              onChange={(e) => setClientEmail(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
        <div className="slds-form-element">
          <label className="slds-form-element__label"><span className="slds-required">* </span>Telephone</label>
          <div className="slds-form-element__control">
            <input 
              className="slds-input" 
              value={clientContact} 
              onChange={(e) => setClientContact(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
