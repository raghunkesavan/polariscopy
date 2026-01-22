import { useEffect, useState } from 'react';
import { getMarketRates } from '../../config/constants';
import { useSalesforceCanvas } from '../../contexts/SalesforceCanvasContext';
import './ConstantsRow.css';

const ConstantsRow = () => {
  const [recordId, setRecordId] = useState(null);
  const [action, setAction] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  
  // Use the existing SalesforceCanvasContext
  const { isCanvasApp, loading, environment, canvasContext, signedRequest, debugLog } = useSalesforceCanvas();

  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  const constants = getMarketRates();

  useEffect(() => {
    // Method 1: Use SalesforceCanvasContext (preferred)
    if (!loading && isCanvasApp && environment) {
      const params = environment?.parameters || {};
      console.warn('Canvas environment parameters:', params);
      setRecordId(params.recordId || null);
      setAction(params.action || null);
      setDebugInfo({
        source: 'SalesforceCanvasContext',
        params,
        hasSignedRequest: !!signedRequest,
        environment,
      });
      return;
    }

    // Method 1b: Canvas app detected but environment missing - check canvasContext directly
    if (!loading && isCanvasApp && canvasContext) {
      const params = canvasContext?.environment?.parameters || {};
      console.warn('Canvas context parameters (direct):', params);
      setRecordId(params.recordId || null);
      setAction(params.action || null);
      setDebugInfo({
        source: 'SalesforceCanvasContext (canvasContext direct)',
        params,
        hasSignedRequest: !!signedRequest,
        canvasContext,
      });
      return;
    }

    // Method 2: Fallback - Try to get signed request directly from SDK
    if (!loading && window.Sfdc?.canvas?.client) {
      try {
        const sr = window.Sfdc.canvas.client.signedrequest();
        if (sr) {
          // Check different possible structures
          const params = sr.context?.environment?.parameters 
            || sr.payload?.context?.environment?.parameters
            || sr.parameters
            || {};
          console.warn('Direct SDK signed request:', sr);
          console.warn('Extracted parameters:', params);
          setRecordId(params.recordId || null);
          setAction(params.action || null);
          setDebugInfo({
            source: 'Direct SDK signedrequest()',
            params,
            signedRequestKeys: sr ? Object.keys(sr) : [],
            signedRequestRaw: sr,
          });
          return;
        }
      } catch (err) {
        console.warn('Could not get signed request directly:', err);
      }
    }

    // Method 3: Check URL parameters (for testing or alternate integration)
    const urlParams = new URLSearchParams(window.location.search);
    const urlRecordId = urlParams.get('recordId') || urlParams.get('id');
    const urlAction = urlParams.get('action');
    
    if (urlRecordId || urlAction) {
      console.warn('URL parameters found:', { recordId: urlRecordId, action: urlAction });
      setRecordId(urlRecordId || null);
      setAction(urlAction || null);
      setDebugInfo({
        source: 'URL parameters',
        params: { recordId: urlRecordId, action: urlAction },
      });
      return;
    }

    // No context available - show detailed debug info
    if (!loading) {
      setDebugInfo({
        source: 'None',
        isCanvasApp,
        hasSfdc: !!window.Sfdc,
        hasSfdcCanvas: !!window.Sfdc?.canvas,
        hasEnvironment: !!environment,
        hasCanvasContext: !!canvasContext,
        hasSignedRequest: !!signedRequest,
        canvasContextKeys: canvasContext ? Object.keys(canvasContext) : [],
        signedRequestKeys: signedRequest ? Object.keys(signedRequest) : [],
        message: 'Canvas detected but no environment/parameters found',
      });
    }
  }, [loading, isCanvasApp, environment, signedRequest, canvasContext]);

  return (
    <div className="constants-section">
      <h4 className="constants-title">Constants</h4>

      <div className="constants-grid">
        <div className="constant-item">
          <span className="constant-label">BBR</span>
          <span className="constant-value">
            {toPercent(constants.STANDARD_BBR)}
          </span>
        </div>

        <div className="constant-item">
          <span className="constant-label">Stressed BBR</span>
          <span className="constant-value">
            {toPercent(constants.STRESS_BBR)}
          </span>
        </div>

        <div className="constant-item">
          <span className="constant-label">MVR</span>
          <span className="constant-value">
            {toPercent(constants.CURRENT_MVR)}
          </span>
        </div>
      </div>

      <div>
        <h2>Canvas App (React)</h2>
        <p><b>Record Id:</b> {recordId || 'N/A'}</p>
        <p><b>Action:</b> {action || 'N/A'}</p>
        <p><b>Is Canvas App:</b> {isCanvasApp ? 'Yes' : 'No'}</p>
        <p><b>Loading:</b> {loading ? 'Yes' : 'No'}</p>
        <details>
          <summary>Debug Info</summary>
          <pre className="constants-debug-pre">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
        <details>
          <summary>Canvas SDK Log</summary>
          <pre className="constants-debug-pre">
            {JSON.stringify(debugLog || [], null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ConstantsRow;


