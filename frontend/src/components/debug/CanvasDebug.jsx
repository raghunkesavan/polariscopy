import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Canvas Debug Component
 * Shows what data was extracted from index.html Canvas initialization
 */
const CanvasDebug = () => {
  const [canvasData, setCanvasData] = useState(window.canvasData || {});

  useEffect(() => {
    // Listen for canvasDataReady event from index.html
    const handleCanvasReady = (event) => {
      console.log('Canvas data ready event received:', event.detail);
      setCanvasData(event.detail);
    };

    window.addEventListener('canvasDataReady', handleCanvasReady);

    return () => {
      window.removeEventListener('canvasDataReady', handleCanvasReady);
    };
  }, []);

  const { isCanvasAvailable, user, organization, parameters, context } = canvasData;

  if (!isCanvasAvailable) {
    return (
      <div style={{
        padding: '20px',
        margin: '20px 0',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '4px'
      }}>
        <h3>⚠️ Canvas SDK Not Available</h3>
        <p>The Salesforce Canvas SDK was not detected. This is normal if you're not running inside a Salesforce Canvas app.</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      margin: '20px 0',
      backgroundColor: '#d4edda',
      border: '1px solid #28a745',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3>✅ Canvas Data Extracted Successfully</h3>

      {user && (
        <div style={{ marginBottom: '15px' }}>
          <h4>User:</h4>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      {organization && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Organization:</h4>
          <pre>{JSON.stringify(organization, null, 2)}</pre>
        </div>
      )}

      {parameters && Object.keys(parameters).length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Parameters:</h4>
          <pre>{JSON.stringify(parameters, null, 2)}</pre>
        </div>
      )}

      {context && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Environment Context:</h4>
          <pre>{JSON.stringify(context, null, 2)}</pre>
        </div>
      )}

      <details style={{ marginTop: '15px', cursor: 'pointer' }}>
        <summary style={{ fontWeight: 'bold' }}>Full Canvas Data</summary>
        <pre style={{ marginTop: '10px', backgroundColor: '#fff', padding: '10px' }}>
          {JSON.stringify(canvasData, null, 2)}
        </pre>
      </details>
    </div>
  );
};

CanvasDebug.propTypes = {};

export default CanvasDebug;
