import React from 'react';
import '../../styles/ErrorComponents.css';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error, info);
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="slds-scope">
          <div className="slds-box slds-theme_error slds-m-around_medium">
            <div className="slds-text-heading_medium slds-m-bottom_small">
              <span className="slds-icon_container slds-icon-utility-error" title="Error">
                <svg className="slds-icon slds-icon-text-error slds-icon_small" aria-hidden="true">
                  <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#error"></use>
                </svg>
              </span>
              {this.props.title || 'Something went wrong'}
            </div>
            
            <p className="slds-m-bottom_small">
              {this.props.message || 'An unexpected error occurred. Your data is safe.'}
            </p>

            <div className="slds-button-group">
              <button 
                className="slds-button slds-button_neutral"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button 
                className="slds-button slds-button_brand"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>

            {/* Show error details in development */}
            {import.meta.env.DEV && (
              <details className="slds-m-top_medium">
                <summary className="slds-text-heading_small error-summary">
                  Error Details (Development Only)
                </summary>
                <div className="slds-box slds-box_small slds-m-top_small error-stack-box">
                  <strong>Error:</strong>
                  <div className="error-message-critical">
                    {this.state.error && this.state.error.toString()}
                  </div>
                  <strong>Component Stack:</strong>
                  <div className="error-text-muted">
                    {this.state.info && this.state.info.componentStack}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
