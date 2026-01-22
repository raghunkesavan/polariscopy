/**
 * Example: How to Implement Backend Canvas Verification
 * 
 * This shows how to use the new backend endpoints
 */

// ============================================================================
// OPTION 1: Use Backend Verification (Recommended for Production)
// ============================================================================

import { useCanvasVerification } from '../hooks/useCanvasVerification';

function MyComponent() {
  const { verify } = useCanvasVerification();

  const handleCanvasData = async () => {
    try {
      // Get the signed_request from Salesforce Canvas
      if (typeof window.Sfdc !== 'undefined' && window.Sfdc.canvas) {
        const signedRequest = window.Sfdc.canvas.client.signedrequest();
        
        if (signedRequest) {
          // Send to backend for verification
          const verifiedData = await verify(signedRequest);
          
          console.log('User:', verifiedData.user);
          console.log('Organization:', verifiedData.organization);
          console.log('Parameters:', verifiedData.parameters);
          
          // Now you can:
          // 1. Store in state
          // 2. Make authenticated API calls using verifiedData.client.oauthToken
          // 3. Fetch Salesforce data
        }
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <button onClick={handleCanvasData}>Verify Canvas Data</button>
  );
}


// ============================================================================
// OPTION 2: Use Frontend Extraction (Current Setup - Faster)
// ============================================================================

import { useSalesforceCanvas } from '../contexts/SalesforceCanvasContext';

function MyComponentFrontend() {
  const { user, organization, parameters, isCanvasApp } = useSalesforceCanvas();

  if (!isCanvasApp) {
    return <div>Not running in Canvas</div>;
  }

  return (
    <div>
      <h2>{user?.fullName}</h2>
      <p>Org: {organization?.name}</p>
      <p>Record: {parameters?.recordId}</p>
    </div>
  );
}


// ============================================================================
// OPTION 3: Hybrid - Frontend Extraction + Optional Backend Verification
// ============================================================================

import { useSalesforceCanvas } from '../contexts/SalesforceCanvasContext';
import { useCanvasVerification } from '../hooks/useCanvasVerification';
import { useState } from 'react';

function MyComponentHybrid() {
  const { user, organization, parameters, isCanvasApp } = useSalesforceCanvas();
  const { verify } = useCanvasVerification();
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async () => {
    try {
      if (typeof window.Sfdc !== 'undefined' && window.Sfdc.canvas) {
        const signedRequest = window.Sfdc.canvas.client.signedrequest();
        await verify(signedRequest);
        setIsVerified(true);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setIsVerified(false);
    }
  };

  if (!isCanvasApp) {
    return <div>Not running in Canvas</div>;
  }

  return (
    <div>
      <h2>{user?.fullName}</h2>
      <p>Org: {organization?.name}</p>
      <p>Record: {parameters?.recordId}</p>
      
      {!isVerified && (
        <button onClick={handleVerify}>Verify with Backend</button>
      )}
      
      {isVerified && (
        <p style={{ color: 'green' }}>✅ Backend verified</p>
      )}
    </div>
  );
}


// ============================================================================
// API ENDPOINT REFERENCE
// ============================================================================

/**
 * POST /api/canvas/verify
 * 
 * Full verification with all data
 * 
 * Request:
 * {
 *   signed_request: "signature.encodedPayload"
 * }
 * 
 * Response:
 * {
 *   verified: true,
 *   user: { userName, userId, email, fullName },
 *   organization: { name, organizationId },
 *   parameters: { recordId, action, ... },
 *   client: { oauthToken, instanceUrl }
 * }
 */

/**
 * POST /api/canvas/extract
 * 
 * Simpler extraction without extra data
 * 
 * Request:
 * {
 *   signedRequest: "signature.encodedPayload"
 * }
 * 
 * Response:
 * {
 *   user: { userName, userId, email, fullName },
 *   organization: { name, organizationId },
 *   parameters: { recordId, action, ... },
 *   oauthToken: "...",
 *   instanceUrl: "..."
 * }
 */


export default MyComponentHybrid;
