import React, { useEffect } from 'react';
import { useSalesforceCanvas } from '../contexts/SalesforceCanvasContext';
import PropTypes from 'prop-types';

/**
 * Example component showing how to use Salesforce Canvas SDK
 * 
 * This component demonstrates:
 * 1. Getting Salesforce user/org context
 * 2. Making authenticated Salesforce API calls
 * 3. Publishing/subscribing to events
 * 4. Resizing the canvas frame
 */
const CanvasExample = () => {
  const {
    isCanvasApp,
    loading,
    canvasContext,
    user,
    organization,
    environment,
    links,
    refreshContext,
    resize,
    publish,
    subscribe,
    ajaxRequest,
  } = useSalesforceCanvas();

  useEffect(() => {
    if (!isCanvasApp) return;

    // Example: Subscribe to custom event from Salesforce
    subscribe('canvas.recordUpdated', (payload) => {
      console.log('Record updated in Salesforce:', payload);
    });

    // Example: Auto-resize when content changes
    // Canvas SDK has autogrow enabled by default, but you can manually trigger
    resize({ height: '800px' });
  }, [isCanvasApp]);

  if (!isCanvasApp) {
    return (
      <div className="slds-box slds-m-around_medium">
        <p>Not running as Salesforce Canvas app</p>
        <p>Access directly: <a href="?embedded=1">Test embedded mode</a></p>
      </div>
    );
  }

  if (loading) {
    return <div className="slds-spinner_container">Loading Canvas context...</div>;
  }

  // Example: Make Salesforce REST API call
  const fetchAccount = async (accountId) => {
    try {
      const response = await ajaxRequest(
        `/services/data/v58.0/sobjects/Account/${accountId}`,
        { method: 'GET' }
      );
      console.log('Account data:', response);
    } catch (error) {
      console.error('Error fetching account:', error);
    }
  };

  // Example: Publish event to Salesforce
  const notifySalesforce = () => {
    publish('canvas.quoteCalculated', {
      quoteId: 'Q-12345',
      amount: 500000,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="slds-p-around_medium">
      <h1 className="slds-text-heading_large slds-m-bottom_medium">
        Salesforce Canvas Context
      </h1>

      {/* User Information */}
      <div className="slds-box slds-m-bottom_medium">
        <h2 className="slds-text-heading_medium slds-m-bottom_small">User Info</h2>
        <dl className="slds-dl_horizontal">
          <dt className="slds-dl_horizontal__label">Name:</dt>
          <dd className="slds-dl_horizontal__detail">{user?.fullName}</dd>
          
          <dt className="slds-dl_horizontal__label">Email:</dt>
          <dd className="slds-dl_horizontal__detail">{user?.email}</dd>
          
          <dt className="slds-dl_horizontal__label">User ID:</dt>
          <dd className="slds-dl_horizontal__detail">{user?.userId}</dd>
          
          <dt className="slds-dl_horizontal__label">Locale:</dt>
          <dd className="slds-dl_horizontal__detail">{user?.locale}</dd>
        </dl>
      </div>

      {/* Organization Information */}
      <div className="slds-box slds-m-bottom_medium">
        <h2 className="slds-text-heading_medium slds-m-bottom_small">Organization Info</h2>
        <dl className="slds-dl_horizontal">
          <dt className="slds-dl_horizontal__label">Name:</dt>
          <dd className="slds-dl_horizontal__detail">{organization?.name}</dd>
          
          <dt className="slds-dl_horizontal__label">Org ID:</dt>
          <dd className="slds-dl_horizontal__detail">{organization?.organizationId}</dd>
          
          <dt className="slds-dl_horizontal__label">Currency:</dt>
          <dd className="slds-dl_horizontal__detail">{organization?.currencyIsoCode}</dd>
        </dl>
      </div>

      {/* Environment Information */}
      <div className="slds-box slds-m-bottom_medium">
        <h2 className="slds-text-heading_medium slds-m-bottom_small">Environment</h2>
        <dl className="slds-dl_horizontal">
          <dt className="slds-dl_horizontal__label">Instance:</dt>
          <dd className="slds-dl_horizontal__detail">{environment?.displayLocation}</dd>
          
          <dt className="slds-dl_horizontal__label">API Version:</dt>
          <dd className="slds-dl_horizontal__detail">{links?.sobjectUrl?.split('/v')[1]?.split('/')[0]}</dd>
        </dl>
      </div>

      {/* Actions */}
      <div className="slds-box">
        <h2 className="slds-text-heading_medium slds-m-bottom_small">Actions</h2>
        <div className="slds-button-group">
          <button 
            className="slds-button slds-button_neutral"
            onClick={() => refreshContext((ctx) => console.log('Refreshed context:', ctx))}
          >
            Refresh Context
          </button>
          <button 
            className="slds-button slds-button_brand"
            onClick={notifySalesforce}
          >
            Publish Event to SF
          </button>
        </div>
      </div>

      {/* Raw Context (for debugging) */}
      <details className="slds-m-top_medium">
        <summary className="slds-text-heading_small slds-m-bottom_small" style={{cursor: 'pointer'}}>
          Raw Canvas Context (Debug)
        </summary>
        <pre className="slds-box slds-text-body_small" style={{overflow: 'auto', maxHeight: '400px'}}>
          {JSON.stringify(canvasContext, null, 2)}
        </pre>
      </details>
    </div>
  );
};

CanvasExample.propTypes = {};

export default CanvasExample;
