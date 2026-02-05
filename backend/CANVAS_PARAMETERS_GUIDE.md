/**
 * HOW TO DISPLAY CANVAS PARAMETERS - Complete Guide
 */

// ============================================================
// OPTION 1: Display in Console Logs (Backend)
// ============================================================

// In your POST handler, canvasParameters are already logged:
console.log('[Canvas] 📋 Canvas Parameters:', 
  JSON.stringify(envelope.context?.environment?.parameters, null, 2)
);

// This outputs to server console, e.g.:
// {
//   "recordId": "001xx000003DHP1AAO",
//   "customParam1": "value1",
//   "customParam2": "value2"
// }


// ============================================================
// OPTION 2: Display in API Response (Backend)
// ============================================================

// In your POST /api/canvas handler, canvasParameters are returned:
const canvasContext = {
  success: true,
  client: {
    oauthToken: envelope.client?.oauthToken,
    instanceUrl: envelope.client?.instanceUrl,
    targetOrigin: envelope.client?.targetOrigin,
  },
  context: {
    user: envelope.context?.user,
    organization: envelope.context?.organization,
    environment: envelope.context?.environment,
  },
  canvasParameters: envelope.context?.environment?.parameters || {},
  // ↑ This sends to frontend automatically
};

// Frontend receives this in the response and can use it


// ============================================================
// OPTION 3: Display in Frontend (React Component)
// ============================================================

// Create a custom hook to access canvas data:
export const useCanvasParameters = () => {
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCanvasData = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/canvas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'canvas_context',
            data: window.canvasData,
            timestamp: new Date().toISOString()
          })
        });
        const data = await response.json();
        setParameters(data.canvasParameters || {});
      } catch (error) {
        console.error('Failed to fetch canvas parameters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCanvasData();
  }, []);

  return { parameters, loading };
};

// Use in component:
function MyCanvasComponent() {
  const { parameters, loading } = useCanvasParameters();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Canvas Parameters</h2>
      <pre>{JSON.stringify(parameters, null, 2)}</pre>
      
      {/* Display specific parameters */}
      <p>Record ID: {parameters.recordId}</p>
      <p>Custom Param 1: {parameters.customParam1}</p>
    </div>
  );
}


// ============================================================
// OPTION 4: Store in Session Storage (Persist Across Pages)
// ============================================================

// In frontend index.html or Canvas component:
window.canvasData = {
  parameters: {},
  user: null,
  organization: null,
};

// After getting response from backend:
sessionStorage.setItem('canvasContext', JSON.stringify({
  parameters: response.data.canvasParameters,
  user: response.data.context.user,
  organization: response.data.context.organization,
  client: response.data.client
}));

// Retrieve later:
const canvasContext = JSON.parse(
  sessionStorage.getItem('canvasContext') || '{}'
);
console.log('Canvas Parameters:', canvasContext.parameters);


// ============================================================
// OPTION 5: Add Route to Return Just Canvas Parameters
// ============================================================

// Add a new GET route that returns cached parameters:
router.get('/parameters', (req, res) => {
  const cached = sessionStorage.getItem('canvasContext');
  if (cached) {
    const data = JSON.parse(cached);
    return res.json({
      success: true,
      parameters: data.parameters,
      user: data.user,
      organization: data.organization
    });
  }
  
  return res.json({
    success: false,
    message: 'No canvas parameters cached. Canvas app must be loaded first.'
  });
});

// Frontend call:
const response = await fetch('http://localhost:3001/api/canvas/parameters');
const data = await response.json();
console.log('Canvas Parameters:', data.parameters);


// ============================================================
// OPTION 6: Display in HTML Alert (Quick Testing)
// ============================================================

// In frontend:
if (window.canvasData?.parameters) {
  alert(
    'Canvas Parameters: ' + 
    JSON.stringify(window.canvasData.parameters, null, 2)
  );
}

// Or in browser console:
console.table(window.canvasData.parameters);


// ============================================================
// COMPLETE WORKING EXAMPLE
// ============================================================

/*
BACKEND: backend/routes/canvas.js
–––––––––––––––––––––––––––––––––

router.post('/', (req, res) => {
  // ... signature verification code ...
  
  const envelope = JSON.parse(
    Buffer.from(encodedEnvelope, 'base64').toString('utf8')
  );

  // Extract canvas parameters
  const canvasParameters = envelope.context?.environment?.parameters || {};
  
  // Log to server console
  console.log('📋 Canvas Parameters Received:');
  console.log(JSON.stringify(canvasParameters, null, 2));
  
  // Return in response
  return res.json({
    success: true,
    canvasParameters: canvasParameters,  // ← Frontend can access this
    user: envelope.context?.user,
    organization: envelope.context?.organization
  });
});


FRONTEND: src/components/Canvas.jsx
–––––––––––––––––––––––––––––––––

import { useEffect, useState } from 'react';

export function Canvas() {
  const [params, setParams] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sendToBackend = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/canvas`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'canvas_context',
              data: window.canvasData || {},
              timestamp: new Date().toISOString()
            })
          }
        );

        const data = await response.json();
        
        // Get canvas parameters from response
        if (data.canvasParameters) {
          setParams(data.canvasParameters);
          
          // Display them
          console.log('📋 Canvas Parameters:', data.canvasParameters);
          console.table(data.canvasParameters);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    sendToBackend();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h2>Canvas Parameters</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <pre style={{ background: '#f4f4f4', padding: '10px' }}>
          {JSON.stringify(params, null, 2)}
        </pre>
      )}
    </div>
  );
}
*/


// ============================================================
// SUMMARY
// ============================================================

/*
WHERE CANVAS PARAMETERS COME FROM:
1. Salesforce Canvas sends signed_request POST to backend
2. Backend verifies signature and decodes signed_request
3. Canvas parameters extracted from: 
   envelope.context.environment.parameters
4. Backend returns in response.canvasParameters
5. Frontend can access via:
   - response.data.canvasParameters
   - window.canvasData.parameters
   - sessionStorage

HOW TO DISPLAY:
1. Console Log: console.log(canvasParameters)
2. Console Table: console.table(canvasParameters)
3. HTML: <pre>{JSON.stringify(canvasParameters, null, 2)}</pre>
4. React: Use useState to store and display
5. Alert: alert(JSON.stringify(canvasParameters))
*/
