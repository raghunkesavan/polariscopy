import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SalesforceCanvasContext = createContext();

// API URL for backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useSalesforceCanvas = () => {
  const context = useContext(SalesforceCanvasContext);
  if (!context) {
    throw new Error('useSalesforceCanvas must be used within SalesforceCanvasProvider');
  }
  return context;
};

/**
 * SalesforceCanvasProvider
 * 
 * Manages Salesforce Canvas SDK integration
 * Supports two modes:
 * 1. URL Parameters mode: Backend receives signed_request, verifies, and redirects with canvasToken
 * 2. SDK mode: Client-side Canvas SDK (fallback)
 */
export const SalesforceCanvasProvider = ({ children }) => {
  const [canvasContext, setCanvasContext] = useState(null);
  const [signedRequest, setSignedRequest] = useState(null);
  const [isCanvasApp, setIsCanvasApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message, data = null) => {
    const entry = { time: new Date().toISOString(), message, data };
    console.warn('[Canvas]', message, data);
    setDebugLog(prev => [...prev, entry]);
  };

  // Check for canvas context from URL parameters (set by backend redirect)
  const getCanvasFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const canvasToken = params.get('canvasToken');
    const recordId = params.get('recordId');
    const action = params.get('action');

    if (canvasToken) {
      try {
        // Decode the full context from the token
        const context = JSON.parse(atob(canvasToken));
        addDebugLog('Canvas context from URL token', { 
          hasEnvironment: !!context?.environment,
          parameters: context?.parameters 
        });
        return context;
      } catch (e) {
        addDebugLog('Failed to decode canvasToken', e.message);
      }
    }

    // Even without full token, we might have recordId/action directly
    if (recordId || action) {
      addDebugLog('Canvas parameters from URL', { recordId, action });
      return {
        environment: {
          parameters: { recordId, action }
        }
      };
    }

    return null;
  };

  useEffect(() => {
    // Method 0: Check URL parameters first (from backend redirect)
    const urlContext = getCanvasFromURL();
    if (urlContext) {
      addDebugLog('Using canvas context from URL');
      setIsCanvasApp(true);
      setCanvasContext(urlContext);
      setClient(urlContext.client || null);
      setLoading(false);
      
      // Clean up URL parameters (optional - prevents confusion on refresh)
      // window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // Method 1: Check if Sfdc.canvas SDK is available (client-side fallback)
    if (typeof window.Sfdc === 'undefined' || !window.Sfdc.canvas) {
      addDebugLog('No URL context and Sfdc.canvas SDK not available');
      setLoading(false);
      return;
    }

    addDebugLog('Sfdc.canvas SDK detected, trying SDK methods...');
    setIsCanvasApp(true);

    // Method 2: Check if signed request is already available (synchronous)
    let sr = null;
    try {
      sr = window.Sfdc.canvas.client.signedrequest();
      addDebugLog('signedrequest() returned', sr ? 'object' : 'null');
    } catch (e) {
      addDebugLog('signedrequest() error', e.message);
    }
    
    if (sr) {
      handleSignedRequest(sr, 'signedrequest()');
      return;
    }

    // Method 3: Try refreshSignedRequest (async callback)
    addDebugLog('Trying refreshSignedRequest...');
    try {
      window.Sfdc.canvas.client.refreshSignedRequest((data) => {
        addDebugLog('refreshSignedRequest callback received', data ? 'object' : 'null');
        if (data) {
          // The response might be the signed request itself or have a payload
          const srData = data.payload || data;
          handleSignedRequest(srData, 'refreshSignedRequest');
        } else {
          addDebugLog('refreshSignedRequest returned no data');
          tryContextMethod();
        }
      });
    } catch (e) {
      addDebugLog('refreshSignedRequest error', e.message);
      tryContextMethod();
    }

    // Method 4: Try to get context directly using ctx()
    const tryContextMethod = () => {
      addDebugLog('Trying ctx() method...');
      try {
        // Build a minimal client object for ctx request
        const frameId = window.name?.replace('canvas-frame-', '') || '';
        const minimalClient = {
          oauthToken: 'null',
          instanceId: frameId,
          targetOrigin: '*'
        };
        
        window.Sfdc.canvas.client.ctx((response) => {
          addDebugLog('ctx() callback received', response);
          if (response && response.payload) {
            setCanvasContext(response.payload);
            setLoading(false);
          } else if (response) {
            setCanvasContext(response);
            setLoading(false);
          } else {
            addDebugLog('ctx() returned no payload');
            setLoading(false);
          }
        }, minimalClient);
      } catch (e) {
        addDebugLog('ctx() error', e.message);
        setLoading(false);
      }
    };

    // Fallback timeout - if nothing works after 3 seconds, stop loading
    const timeout = setTimeout(() => {
      if (loading) {
        addDebugLog('Timeout - no Canvas context received');
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const handleSignedRequest = (sr, source) => {
    addDebugLog(`handleSignedRequest from ${source}`, { 
      hasContext: !!sr?.context,
      keys: sr ? Object.keys(sr) : []
    });

    if (!sr) {
      setLoading(false);
      return;
    }

    // Handle different signed request structures
    let context = sr.context || sr.payload?.context || sr;
    
    // Canvas context loaded successfully
    setSignedRequest(sr);
    setCanvasContext(context);
    setClient(sr.client || null);
    setLoading(false);
    
    addDebugLog('Canvas context set', {
      hasEnvironment: !!context?.environment,
      hasUser: !!context?.user,
      environmentKeys: context?.environment ? Object.keys(context.environment) : []
    });
  };

  const getClientInfo = () => {
    if (typeof window.Sfdc === 'undefined' || !window.Sfdc.canvas) {
      return null;
    }
    return window.Sfdc.canvas.oauth.client();
  };

  const refreshContext = (callback) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.ctx(
      (contextData) => {
        setCanvasContext(contextData.payload);
        if (callback) callback(contextData.payload);
      },
      clientInfo
    );
  };

  const resize = (size) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.resize(clientInfo, size);
  };

  const publish = (eventName, payload) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.publish(clientInfo, {
      name: eventName,
      payload: payload
    });
  };

  const subscribe = (eventName, callback) => {
    if (!isCanvasApp) return;
    
    const clientInfo = getClientInfo();
    window.Sfdc.canvas.client.subscribe(clientInfo, {
      name: eventName,
      onData: callback
    });
  };

  const ajaxRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!isCanvasApp) {
        reject(new Error('Not running as Canvas app'));
        return;
      }

      const clientInfo = getClientInfo();
      const settings = {
        client: clientInfo,
        method: options.method || 'GET',
        contentType: options.contentType || 'application/json',
        data: options.data,
        success: (data) => {
          resolve(data.payload);
        },
        error: (error) => {
          reject(error);
        }
      };

      window.Sfdc.canvas.client.ajax(url, settings);
    });
  };

  const value = {
    isCanvasApp,
    loading,
    canvasContext,
    signedRequest,
    client,
    debugLog,
    // User info from Canvas context
    user: canvasContext?.user,
    organization: canvasContext?.organization,
    environment: canvasContext?.environment,
    // Canvas-specific parameters (can be nested in different places)
    parameters: canvasContext?.environment?.parameters || canvasContext?.parameters || {},
    // Direct URL/instance info
    instanceUrl: canvasContext?.environment?.instanceUrl || canvasContext?.instanceUrl || '',
    displayUrl: canvasContext?.environment?.displayUrl || canvasContext?.displayUrl || '',
    // Links and URLs
    links: canvasContext?.links,
    // Methods
    refreshContext,
    resize,
    publish,
    subscribe,
    ajaxRequest,
  };

  return (
    <SalesforceCanvasContext.Provider value={value}>
      {children}
    </SalesforceCanvasContext.Provider>
  );
};

SalesforceCanvasProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SalesforceCanvasContext;
