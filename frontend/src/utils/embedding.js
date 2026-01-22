/**
 * Utility functions for detecting and managing embedded mode
 * when the app is rendered inside a Salesforce iframe
 */

/**
 * Check if the app is running inside an iframe
 * @returns {boolean}
 */
export const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin, we're definitely in an iframe
    return true;
  }
};

/**
 * Check if embedded mode is requested via query parameter
 * @returns {boolean}
 */
export const hasEmbeddedParam = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('embedded') === '1' || params.get('embedded') === 'true';
};

/**
 * Determine if the app should run in embedded mode
 * Returns true if EITHER in an iframe OR has embedded query parameter
 * @returns {boolean}
 */
export const isEmbeddedMode = () => {
  return isInIframe() || hasEmbeddedParam();
};

/**
 * Send a message to the parent window (Salesforce host)
 * @param {string} type - Message type
 * @param {object} data - Message payload
 */
export const sendMessageToHost = (type, data = {}) => {
  if (isInIframe()) {
    try {
      window.parent.postMessage(
        {
          source: 'polaris-calculator',
          type,
          data,
          timestamp: Date.now()
        },
        '*' // In production, replace with specific Salesforce origin
      );
    } catch (e) {
      console.error('Failed to send message to host:', e);
    }
  }
};

/**
 * Listen for messages from the parent window
 * @param {function} callback - Handler for incoming messages
 * @returns {function} Cleanup function to remove listener
 */
export const listenToHostMessages = (callback) => {
  const handler = (event) => {
    // In production, validate event.origin matches Salesforce domain
    // if (event.origin !== 'https://your-salesforce-domain.com') return;
    
    callback(event.data);
  };

  window.addEventListener('message', handler);
  
  // Return cleanup function
  return () => window.removeEventListener('message', handler);
};
