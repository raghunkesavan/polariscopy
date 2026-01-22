import React from 'react';
import PropTypes from 'prop-types';
import { useSalesforceCanvas } from '../../contexts/SalesforceCanvasContext';
import '../../styles/CanvasParameters.css';

/**
 * CanvasParameters Component
 * Displays Canvas app parameters from Salesforce context on the dashboard
 */
const CanvasParameters = () => {
  const {
    isCanvasApp,
    loading,
    environment,
    user,
    organization,
  } = useSalesforceCanvas();

  // Don't render if not a Canvas app
  if (!isCanvasApp || loading) {
    return null;
  }

  // Extract environment parameters
  const parameters = environment?.parameters || {};
  const displayUrl = environment?.displayUrl || '';
  const instanceUrl = environment?.instanceUrl || '';

  // Extract user and org info
  const userName = user?.fullName || 'N/A';
  const userEmail = user?.email || 'N/A';
  const orgName = organization?.organizationMultiCurrency ? 
    `${organization?.name} (Multi-Currency)` : 
    organization?.name || 'N/A';
  const orgId = organization?.organizationId || 'N/A';

  // Extract any custom parameters passed in the Canvas URL
  const recordId = parameters?.recordId || '';
  const action = parameters?.action || '';
  const customParams = Object.entries(parameters)
    .filter(([key]) => !['recordId', 'action'].includes(key))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  return (
    <div className="canvas-parameters-section slds-box slds-m-bottom_medium">
      <h3 className="canvas-parameters-title slds-text-heading_small slds-m-bottom_small">
        Canvas App Parameters
      </h3>

      <div className="canvas-parameters-container">
        {/* User & Organization Info */}
        <div className="canvas-parameters-column">
          <h4 className="canvas-parameters-subtitle">Salesforce Context</h4>
          <dl className="slds-dl_horizontal">
            <dt className="slds-dl_horizontal__label">User:</dt>
            <dd className="slds-dl_horizontal__detail canvas-parameters-value">{userName}</dd>

            <dt className="slds-dl_horizontal__label">Email:</dt>
            <dd className="slds-dl_horizontal__detail canvas-parameters-value">{userEmail}</dd>

            <dt className="slds-dl_horizontal__label">Organization:</dt>
            <dd className="slds-dl_horizontal__detail canvas-parameters-value">{orgName}</dd>

            <dt className="slds-dl_horizontal__label">Org ID:</dt>
            <dd className="slds-dl_horizontal__detail canvas-parameters-value canvas-parameters-mono">{orgId}</dd>
          </dl>
        </div>

        {/* URL Parameters */}
        <div className="canvas-parameters-column">
          <h4 className="canvas-parameters-subtitle">Canvas Parameters</h4>
          <dl className="slds-dl_horizontal">
            {recordId && (
              <>
                <dt className="slds-dl_horizontal__label">Record ID:</dt>
                <dd className="slds-dl_horizontal__detail canvas-parameters-value canvas-parameters-mono">{recordId}</dd>
              </>
            )}

            {action && (
              <>
                <dt className="slds-dl_horizontal__label">Action:</dt>
                <dd className="slds-dl_horizontal__detail canvas-parameters-value">{action}</dd>
              </>
            )}

            {instanceUrl && (
              <>
                <dt className="slds-dl_horizontal__label">Instance URL:</dt>
                <dd className="slds-dl_horizontal__detail canvas-parameters-value canvas-parameters-mono">
                  <a href={instanceUrl} target="_blank" rel="noopener noreferrer" className="canvas-parameters-link">
                    {instanceUrl}
                  </a>
                </dd>
              </>
            )}

            {displayUrl && (
              <>
                <dt className="slds-dl_horizontal__label">Display URL:</dt>
                <dd className="slds-dl_horizontal__detail canvas-parameters-value canvas-parameters-mono">
                  <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="canvas-parameters-link">
                    {displayUrl}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>

        {/* Custom Parameters */}
        {Object.keys(customParams).length > 0 && (
          <div className="canvas-parameters-column">
            <h4 className="canvas-parameters-subtitle">Custom Parameters</h4>
            <dl className="slds-dl_horizontal">
              {Object.entries(customParams).map(([key, value]) => (
                <React.Fragment key={key}>
                  <dt className="slds-dl_horizontal__label">{key}:</dt>
                  <dd className="slds-dl_horizontal__detail canvas-parameters-value canvas-parameters-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Info Message */}
      <div className="canvas-parameters-info slds-m-top_small">
        <p className="slds-text-body_small slds-text-color_weak">
          📌 Canvas app is active and embedded in Salesforce. These parameters are passed from the Canvas context.
        </p>
      </div>
    </div>
  );
};

CanvasParameters.propTypes = {
  // No props needed - uses context
};

export default CanvasParameters;
