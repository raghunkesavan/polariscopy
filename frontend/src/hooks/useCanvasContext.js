import { useEffect, useState } from 'react';

/**
 * Hook to access Canvas parameters passed from the Canvas component
 * 
 * Usage:
 * const { canvasContext, isFromCanvas } = useCanvasContext();
 * 
 * Returns:
 * - canvasContext: Full Canvas context object with parameters, user, organization, environment
 * - isFromCanvas: Boolean indicating if request came through Canvas
 * - parameters: Direct access to Canvas parameters
 * - user: User information from Salesforce
 * - organization: Organization information from Salesforce
 */
export const useCanvasContext = () => {
  const [canvasContext, setCanvasContext] = useState(null);
  const [isFromCanvas, setIsFromCanvas] = useState(false);

  useEffect(() => {
    // Try to get Canvas context from sessionStorage first
    const storedContext = sessionStorage.getItem('canvasContext');
    
    if (storedContext) {
      try {
        const context = JSON.parse(storedContext);
        setCanvasContext(context);
        setIsFromCanvas(true);
        console.log('[useCanvasContext] Canvas context loaded from sessionStorage:', context);
        return;
      } catch (err) {
        console.error('[useCanvasContext] Failed to parse stored canvas context:', err);
      }
    }

    // Try to parse Canvas parameters from URL query string
    const params = new URLSearchParams(window.location.search);
    const urlContext = {};

    // Extract canvas token
    const canvasToken = params.get('canvasToken');
    if (canvasToken) {
      urlContext.canvasToken = canvasToken;
    }

    // Extract canvas parameters (prefixed with canvas_)
    const canvasParams = {};
    for (const [key, value] of params) {
      if (key.startsWith('canvas_')) {
        const paramName = key.replace('canvas_', '');
        canvasParams[paramName] = value;
      }
    }

    // Extract Salesforce context parameters
    const sfContext = {
      userId: params.get('userId'),
      userName: params.get('userName'),
      userEmail: params.get('userEmail'),
      orgId: params.get('orgId'),
      orgName: params.get('orgName'),
      instanceUrl: params.get('instanceUrl'),
      recordId: params.get('recordId'),
    };

    // Filter out null values from Salesforce context
    const filteredSfContext = Object.fromEntries(
      Object.entries(sfContext).filter(([, value]) => value !== null)
    );

    // If we have any canvas parameters or Salesforce context, we're from Canvas
    if (Object.keys(canvasParams).length > 0 || Object.keys(filteredSfContext).length > 0) {
      const context = {
        parameters: canvasParams,
        user: filteredSfContext.userId ? {
          userId: filteredSfContext.userId,
          userName: filteredSfContext.userName,
          email: filteredSfContext.userEmail,
        } : null,
        organization: filteredSfContext.orgId ? {
          organizationId: filteredSfContext.orgId,
          name: filteredSfContext.orgName,
        } : null,
        environment: {
          instanceUrl: filteredSfContext.instanceUrl,
          recordId: filteredSfContext.recordId,
        },
      };

      setCanvasContext(context);
      setIsFromCanvas(true);
      console.log('[useCanvasContext] Canvas context loaded from URL params:', context);

      // Store in sessionStorage for future access
      sessionStorage.setItem('canvasContext', JSON.stringify(context));
    }
  }, []);

  return {
    canvasContext,
    isFromCanvas,
    parameters: canvasContext?.parameters,
    user: canvasContext?.user,
    organization: canvasContext?.organization,
    environment: canvasContext?.environment,
  };
};

export default useCanvasContext;
