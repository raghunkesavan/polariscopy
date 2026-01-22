import React from 'react';
import WelcomeHeader from '../../shared/WelcomeHeader';
import '../../../styles/Calculator.scss';

/**
 * BTLProductSection - Product configuration section for BTL Calculator
 * Contains welcome message, buttons, and product criteria grid
 */
const BTLProductSection = ({ 
  productScope,
  onProductScopeChange,
  retentionChoice,
  onRetentionChoiceChange,
  retentionLtv,
  onRetentionLtvChange,
  currentTier,
  availableScopes,
  allowedScopes = null, // Optional filter for which scopes to show in dropdown
  quoteId,
  quoteReference,
  onIssueDip,
  onIssueQuote,
  saveQuoteButton,
  onSubmitQuote, // Handler for Submit Quote in public mode
  onCancelQuote,
  onNewQuote,
  isReadOnly = false,
  isProductScopeLocked = false,
  publicMode = false
}) => {
  // Filter availableScopes if allowedScopes is provided
  const filteredScopes = allowedScopes 
    ? availableScopes.filter(scope => allowedScopes.includes(scope))
    : availableScopes;
  return (
    <div className="product-config-section">
      {/* Row 1: Welcome Header and Action Buttons */}
      <div className="product-section-row-1">
        <WelcomeHeader quoteReference={quoteReference} />
        <div className="product-actions-container">
          {/* + New Quote button on its own row, right-aligned - hidden in public mode */}
          {!publicMode && quoteId && (
            <div className="product-actions-new-quote">
              <button 
                className="btn-new-quote"
                onClick={onNewQuote}
                title="Start a new quote"
              >
                + New Quote
              </button>
            </div>
          )}
          {/* Other action buttons in a row below */}
          <div className="product-actions">
            {/* Internal mode: Show Issue DIP, Issue Quote, Save Quote */}
            {!publicMode && quoteId && (
              <>
                <button 
                  className="slds-button slds-button_neutral"
                  onClick={onIssueDip}
                  disabled={isReadOnly}
                >
                  Issue DIP
                </button>
                <button 
                  className="slds-button slds-button_issue-quote"
                  onClick={onIssueQuote}
                  disabled={isReadOnly}
                >
                  Issue Quote
                </button>
              </>
            )}
            {/* Internal mode: Show Save Quote button */}
            {!publicMode && saveQuoteButton}
            {/* Public mode: Show Submit Quote button */}
            {publicMode && (
              <button 
                className="slds-button slds-button_brand"
                onClick={onSubmitQuote}
              >
                Submit Quote
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: 4-column grid for Product Scope, Retention, Retention LTV, Tier */}
      <div className="product-criteria-grid">
        <div className="slds-form-element">
          <label className="slds-form-element__label">
            <span className="required-asterisk">*</span>What type of quote is this for?
          </label>
          <div className="slds-form-element__control">
            <select 
              className="slds-select" 
              value={productScope} 
              onChange={(e) => onProductScopeChange(e.target.value)}
              disabled={isReadOnly || isProductScopeLocked}
            >
              <option value="">Select...</option>
              {filteredScopes.map((scope) => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>
        </div>

        {!publicMode && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              <span className="required-asterisk">*</span>Is this a Retention quote?
            </label>
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
        )}

        {!publicMode && (
          <div className="slds-form-element">
            <label className="slds-form-element__label">
              Retention LTV
            </label>
            <div className="slds-form-element__control">
              <select 
                className="slds-select" 
                value={retentionLtv} 
                onChange={(e) => onRetentionLtvChange(e.target.value)}
                disabled={isReadOnly || retentionChoice === 'No'}
              >
                <option value="75">75%</option>
                <option value="65">65%</option>
              </select>
            </div>
          </div>
        )}

        <div className="slds-form-element">
          <label className="slds-form-element__label" style={{ 
            fontSize: 'var(--token-font-size-sm)',
            color: 'var(--token-text-secondary)'
          }}>
            Based on the criteria:
          </label>
          <div className="slds-form-element__control">
            <div style={{ 
              padding: 'var(--token-spacing-sm)',
              fontWeight: 'var(--token-font-weight-bold)',
              fontSize: 'var(--token-font-size-md)',
              color: 'var(--token-text-primary)'
            }}>
              Tier {currentTier}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BTLProductSection;
