import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/canvas.scss';

/**
 * Canvas Component
 * Handles Salesforce Canvas integration and communication with backend
 * Runs at http://localhost:3000/canvas when embedded in Canvas
 * 
 * When Canvas data is detected, redirects to index.html with all Salesforce parameters
 */
const Canvas = () => {
  const [status, setStatus] = useState('initializing');
  const [canvasData, setCanvasData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeCanvas = async () => {
      try {
        setStatus('checking-canvas-data');

        // Check if canvas data is available from window
        if (window.canvasData?.isAvailable) {
          console.log('[Canvas Component] Canvas data available from window');
          setCanvasData(window.canvasData);
          
          // Send to backend and get token
          await redirectToIndexWithToken(window.canvasData);
        } else {
          // Listen for canvas data event
          const handleCanvasReady = (event) => {
            console.log('[Canvas Component] canvasDataReady event received');
            const data = event.detail || window.canvasData;
            setCanvasData(data);
            
            // Send to backend and redirect
            redirectToIndexWithToken(data);
          };

          window.addEventListener('canvasDataReady', handleCanvasReady);

          // No timeout - just wait for Canvas data
          return () => {
            window.removeEventListener('canvasDataReady', handleCanvasReady);
          };
        }
      } catch (err) {
        console.error('[Canvas Component] Initialization error:', err);
        setStatus('error');
        setError(err.message);
      }
    };

    initializeCanvas();
  }, []);

  const redirectToIndexWithToken = async (data) => {
    try {
      setStatus('sending-to-backend');
      console.log('[Canvas Component] Sending canvas data to backend:', data);

      // Send canvas context to backend to get authenticated token
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/canvas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'canvas_context',
          data: data.parameters,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result = await response.json();
      console.log('[Canvas Component] Backend response:', result);
      
      // Build query string with all available Salesforce parameters
      const params = new URLSearchParams();
      
      // Add canvas token if available
      if (result.canvasToken) {
        params.append('canvasToken', result.canvasToken);
      }
      
      // Add all canvas parameters
      if (data.parameters) {
        Object.entries(data.parameters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.append(`canvas_${key}`, String(value));
          }
        });
      }
      
      // Add Salesforce context parameters
      if (data.context?.user) {
        params.append('userId', data.context.user.userId);
        params.append('userName', data.context.user.userName);
        params.append('userEmail', data.context.user.email);
      }
      
      if (data.context?.organization) {
        params.append('orgId', data.context.organization.organizationId);
        params.append('orgName', data.context.organization.name);
      }
      
      if (data.context?.environment) {
        params.append('instanceUrl', data.context.environment.instanceUrl);
        params.append('recordId', data.context.environment.recordId);
      }
      
      // Store canvas context in sessionStorage for access in other pages
      sessionStorage.setItem('canvasContext', JSON.stringify({
        parameters: data.parameters,
        user: data.context?.user,
        organization: data.context?.organization,
        environment: data.context?.environment,
      }));
      
      // Redirect to index.html with all parameters
      console.log('[Canvas Component] Redirecting to index.html with canvas parameters');
      window.location.href = `/index.html?${params.toString()}`;
      
      setStatus('connected');
    } catch (err) {
      console.error('[Canvas Component] Backend communication error:', err);
      setStatus('backend-error');
      setError(err.message);
    }
  };

  return (
    <div className="canvas-container">
      <div className="canvas-content">
        <h1>Salesforce Canvas Integration</h1>
        
        <div className="status-section">
          <h2>Connection Status</h2>
          <div className={`status-badge status-${status}`}>
            {status.replace('-', ' ').toUpperCase()}
          </div>
        </div>

        {canvasData && (
          <div className="canvas-data-section">
            <h3>Canvas Parameters</h3>
            <pre className="data-display">
              {JSON.stringify(canvasData, null, 2)}
            </pre>
          </div>
        )}

        {status === 'connected' && (
          <div className="redirect-section">
            <h3>Redirecting...</h3>
            <p>You will be redirected to the application with your Salesforce Canvas parameters.</p>
            <div className="spinner"></div>
          </div>
        )}

        <div className="info-section">
          <h3>Integration Information</h3>
          <ul>
            <li><strong>Frontend URL:</strong> {window.location.origin}</li>
            <li><strong>Backend URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:3001'}</li>
            <li><strong>Canvas Context:</strong> {canvasData ? 'Available' : 'Waiting...'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

Canvas.propTypes = {};

export default Canvas;
