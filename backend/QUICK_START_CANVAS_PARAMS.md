/**
 * QUICK START: Display Canvas Parameters
 * 
 * Copy this example and modify for your needs
 */

// ============================================
// EXAMPLE 1: Display in Server Logs (Easiest)
// ============================================

// Your POST handler already does this:
console.log('[Canvas] 📋 Canvas Parameters:', 
  JSON.stringify(envelope.context?.environment?.parameters, null, 2)
);

// Check your terminal/console and you'll see:
// [Canvas] 📋 Canvas Parameters: {
//   "recordId": "001xx000003DHP1AAO",
//   "customParam1": "value1"
// }


// ============================================
// EXAMPLE 2: Return in JSON Response
// ============================================

// In your POST handler (already doing this):
return res.json({
  success: true,
  canvasParameters: envelope.context?.environment?.parameters || {},
  // ↑ Frontend receives this
});


// ============================================
// EXAMPLE 3: Display in Frontend React
// ============================================

// Create a component:
import { useEffect, useState } from 'react';

export function CanvasParametersDisplay() {
  const [params, setParams] = useState(null);

  useEffect(() => {
    // Get parameters from response after backend sends them
    const params = window.canvasData?.parameters || 
                   JSON.parse(sessionStorage.getItem('canvasContext') || '{}').parameters || {};
    
    setParams(params);
    
    // Display in console
    console.log('✅ Canvas Parameters:', params);
    console.table(params);
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', marginTop: '20px' }}>
      <h3>Canvas Parameters</h3>
      {params ? (
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(params, null, 2)}
        </pre>
      ) : (
        <p>No canvas parameters found</p>
      )}
    </div>
  );
}


// ============================================
// EXAMPLE 4: Add Debug Endpoint
// ============================================

// Add this route to canvas.js to return stored parameters:
router.get('/debug', (req, res) => {
  // Get from session if available
  const stored = req.session?.canvasContext || {};
  
  return res.json({
    status: 'Debug Info',
    canvasParameters: stored.parameters || 'No parameters in session',
    user: stored.user || 'No user info',
    timestamp: new Date().toISOString()
  });
});

// Then call from frontend:
// fetch('http://localhost:3001/api/canvas/debug')
//   .then(r => r.json())
//   .then(data => console.log('Canvas Debug:', data))


// ============================================
// EXAMPLE 5: Most Practical Implementation
// ============================================

// backend/routes/canvas.js - Add this to POST handler:

router.post('/', (req, res) => {
  // ... existing verification code ...

  const canvasParameters = envelope.context?.environment?.parameters || {};
  
  // Log to server console
  console.log('═'.repeat(60));
  console.log('📋 CANVAS PARAMETERS RECEIVED');
  console.log('═'.repeat(60));
  console.log(JSON.stringify(canvasParameters, null, 2));
  console.log('═'.repeat(60));

  // Return to frontend
  return res.json({
    success: true,
    canvasParameters: canvasParameters,
    user: envelope.context?.user,
    organization: envelope.context?.organization,
    client: {
      oauthToken: envelope.client?.oauthToken,
      instanceUrl: envelope.client?.instanceUrl,
    }
  });
});


// frontend/src/hooks/useCanvasParameters.js
// A reusable hook to access canvas data:

import { useEffect, useState } from 'react';

export function useCanvasParameters() {
  const [parameters, setParameters] = useState({});
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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
        
        if (data.success) {
          setParameters(data.canvasParameters || {});
          setUser(data.user);
          setOrg(data.organization);
          
          // Log to console for debugging
          console.log('✅ Canvas Parameters Loaded');
          console.table(data.canvasParameters);
        } else {
          setError(data.error || 'Failed to load canvas parameters');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { parameters, user, org, isLoading, error };
}

// Use in your component:
import { useCanvasParameters } from '../hooks/useCanvasParameters';

export function MyPage() {
  const { parameters, user, org, isLoading, error } = useCanvasParameters();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      <h2>Org: {org?.name}</h2>
      <h3>Canvas Parameters:</h3>
      <pre>{JSON.stringify(parameters, null, 2)}</pre>
    </div>
  );
}


// ============================================
// QUICK REFERENCE
// ============================================

/*
WHERE TO FIND CANVAS PARAMETERS:

1. In backend console:
   console.log(envelope.context?.environment?.parameters)
   
2. In API response:
   response.json().then(data => console.log(data.canvasParameters))
   
3. In sessionStorage:
   JSON.parse(sessionStorage.getItem('canvasContext')).parameters
   
4. In window object:
   window.canvasData?.parameters
   
5. In browser DevTools:
   console.table(window.canvasData?.parameters)
   console.table(JSON.parse(sessionStorage.getItem('canvasContext')).parameters)
*/
