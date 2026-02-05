import { useEffect, useState } from 'react';
import { getMarketRates } from '../../config/constants';
import './ConstantsRow.css';

const ConstantsRow = () => {
  // const [recordId, setRecordId] = useState(null);
  // const [action, setAction] = useState(null);
  // const [debugInfo, setDebugInfo] = useState({});
  
  // // Get Canvas parameters from window.canvasData
  // const canvasParams = window.canvasData?.parameters || {};

  // Convert decimal to percentage string
  const toPercent = (decimal) => `${(decimal * 100).toFixed(2)}%`;

  const constants = getMarketRates();
  
/*
  useEffect(() => {
    // Method 1: Use window.canvasData (from index.html extraction)
    if (canvasParams.recordId || canvasParams.action) {
      alert('canvasParams found');
      console.warn('Canvas parameters from window.canvasData:', canvasParams);
      setRecordId(canvasParams.recordId || null);
      setAction(canvasParams.action || null);
      setDebugInfo({
        source: 'window.canvasData',
        params: canvasParams,
      });
      return;
    }

    // Method 2: Check URL parameters (for testing)
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

    // No Canvas data found
    setDebugInfo({
      source: 'None',
      hasCanvasData: !!window.canvasData,
      parameters: canvasParams,
      message: 'No Canvas parameters detected',
    });
  }, [canvasParams]); */

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

      {/* <div>
        <h2>Canvas App (React)</h2>
        <p><b>Record Id:</b> {recordId || 'N/A'}</p>
        <p><b>Action:</b> {action || 'N/A'}</p>
        <details>
          <summary>Debug Info</summary>
          <pre className="constants-debug-pre">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div> */}
    </div>
  );
  
};

export default ConstantsRow;


