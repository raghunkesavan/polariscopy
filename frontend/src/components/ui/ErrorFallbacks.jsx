import React from 'react';
import '../../styles/ErrorComponents.css';

/**
 * Fallback UI for Calculator errors
 * Shows a user-friendly error with options to retry or go back
 */
export function CalculatorErrorFallback({ error, reset }) {
  return (
    <div className="slds-scope">
      <div className="slds-box slds-m-around_large error-fallback-container">
        <div className="slds-illustration slds-illustration_large">
          <svg className="slds-illustration__svg" viewBox="0 0 470 230" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-53 -80)">
              <circle cx="288" cy="200" r="120" fill="var(--token-ui-background-disabled)"/>
              <path d="M288,140 L288,260 M228,200 L348,200" stroke="var(--token-critical)" strokeWidth="8" strokeLinecap="round"/>
            </g>
          </svg>
        </div>
        
        <h2 className="slds-text-heading_medium slds-m-top_medium">
          Calculator Error
        </h2>
        
        <p className="slds-text-body_regular slds-m-top_small slds-m-bottom_medium error-text-muted">
          We encountered an error while calculating your results.
          <br />
          Don't worry - your data is safe.
        </p>

        <div className="slds-button-group">
          {reset && (
            <button 
              className="slds-button slds-button_brand"
              onClick={reset}
            >
              Try Again
            </button>
          )}
          <button 
            className="slds-button slds-button_neutral"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </button>
          <button 
            className="slds-button slds-button_neutral"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>

        {import.meta.env.DEV && error && (
          <div className="slds-box slds-box_small slds-m-top_large error-details-box">
            <strong>Error Details (Dev Only):</strong>
            <pre className="error-details-pre">
              {error.toString()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Fallback UI for Rates/Admin pages
 */
export function RatesErrorFallback({ error, reset }) {
  return (
    <div className="slds-scope">
      <div className="slds-notify_container rates-error-container">
        <div className="slds-notify slds-notify_alert slds-theme_error" role="alert">
          <span className="slds-assistive-text">Error</span>
          <h2>
            <svg className="slds-icon slds-icon_x-small" aria-hidden="true">
              <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#error"></use>
            </svg>
            Error Loading Rates Data
          </h2>
          <div className="slds-notify__content">
            <p>Unable to load rates. Please refresh the page.</p>
          </div>
          <button className="slds-button slds-button_icon slds-notify__close" onClick={() => window.location.reload()}>
            <svg className="slds-button__icon" aria-hidden="true">
              <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
            </svg>
            <span className="slds-assistive-text">Close</span>
          </button>
        </div>
      </div>

      <div className="slds-box slds-m-around_medium">
        <h3 className="slds-text-heading_small">Rates Management</h3>
        <p className="slds-m-top_small error-text-muted">
          An error occurred while loading the rates data. This could be due to a connection issue or invalid data format.
        </p>
        
        <div className="slds-button-group slds-m-top_medium">
          <button className="slds-button slds-button_neutral" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback UI for Quotes List
 */
export function QuotesErrorFallback({ error, reset }) {
  return (
    <div className="slds-scope">
      <div className="slds-box slds-m-around_medium">
        <div className="slds-media">
          <div className="slds-media__figure">
            <span className="slds-icon_container slds-icon-utility-warning">
              <svg className="slds-icon slds-icon-text-warning" aria-hidden="true">
                <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#warning"></use>
              </svg>
            </span>
          </div>
          <div className="slds-media__body">
            <h2 className="slds-text-heading_medium">Unable to Load Quotes</h2>
            <p className="slds-m-top_small">
              We couldn't load your saved quotes. This might be a temporary connection issue.
            </p>
            <div className="slds-m-top_medium">
              {reset && (
                <button className="slds-button slds-button_brand slds-m-right_small" onClick={reset}>
                  Try Again
                </button>
              )}
              <button className="slds-button slds-button_neutral" onClick={() => window.location.href = '/calculator'}>
                Create New Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic small error for inline components
 */
export function InlineErrorFallback({ error, componentName }) {
  return (
    <div className="slds-notify slds-notify_alert slds-theme_warning slds-m-around_small" role="alert">
      <span className="slds-assistive-text">Warning</span>
      <h2>
        {componentName ? `${componentName} Error` : 'Component Error'}
      </h2>
      <div className="slds-notify__content">
        <p>This section couldn't be loaded. Try refreshing the page.</p>
      </div>
    </div>
  );
}
