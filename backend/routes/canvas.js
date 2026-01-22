/**
 * Salesforce Canvas Signed Request Handler
 * 
 * This route receives the signed_request from Salesforce Canvas,
 * verifies the signature, and redirects to the frontend with context data.
 */

import express from 'express';
import crypto from 'crypto';
const router = express.Router();

// Consumer Secret from Salesforce Connected App
const CANVAS_CONSUMER_SECRET = process.env.CANVAS_CONSUMER_SECRET;

/**
 * GET /api/canvas/signed-request
 * 
 * If Salesforce hits this with GET, it means the Connected App is misconfigured
 */
router.get('/signed-request', (req, res) => {
  console.log('Canvas GET request received:', {
    method: req.method,
    query: req.query,
    headers: req.headers,
    url: req.url
  });
  
  const authType = req.query._sfdc_canvas_auth;
  
  if (authType === 'user_approval_required') {
    return res.status(400).json({
      error: 'Canvas App Misconfigured',
      message: 'Your Salesforce Connected App is using OAuth (User Approval Required). Please change Access Method to "Signed Request (POST)" in Connected App settings.',
      receivedParams: req.query
    });
  }
  
  res.status(400).json({
    error: 'Invalid Request',
    message: 'This endpoint expects a POST request with signed_request from Salesforce Canvas. If you see this, check your Connected App settings.',
    hint: 'Access Method should be "Signed Request (POST)"'
  });
});

/**
 * POST /api/canvas/signed-request
 * 
 * Receives signed_request from Salesforce, verifies it, and returns the context
 */
router.post('/signed-request', express.urlencoded({ extended: false }), (req, res) => {
  try {
    const signedRequest = req.body.signed_request;
    
    if (!signedRequest) {
      console.error('Canvas: No signed_request in body');
      return res.status(400).json({ error: 'Missing signed_request' });
    }

    if (!CANVAS_CONSUMER_SECRET) {
      console.error('Canvas: CANVAS_CONSUMER_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Split the signed request: signature.payload
    const [signature, encodedEnvelope] = signedRequest.split('.');
    
    if (!signature || !encodedEnvelope) {
      console.error('Canvas: Invalid signed_request format');
      return res.status(400).json({ error: 'Invalid signed_request format' });
    }

    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', CANVAS_CONSUMER_SECRET)
      .update(encodedEnvelope)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error('Canvas: Signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Decode the envelope
    const envelope = JSON.parse(
      Buffer.from(encodedEnvelope, 'base64').toString('utf8')
    );

    console.log('Canvas: Successfully verified signed request');
    console.log('Canvas: User:', envelope.context?.user?.userName);
    console.log('Canvas: Org:', envelope.context?.organization?.name);
    console.log('Canvas: Parameters:', envelope.context?.environment?.parameters);

    // Extract useful data
    const canvasContext = {
      client: {
        oauthToken: envelope.client?.oauthToken,
        instanceUrl: envelope.client?.instanceUrl,
        targetOrigin: envelope.client?.targetOrigin,
      },
      user: envelope.context?.user,
      organization: envelope.context?.organization,
      environment: envelope.context?.environment,
      parameters: envelope.context?.environment?.parameters || {},
    };

    // Option 1: Return JSON (for API-style integration)
    // res.json({ success: true, context: canvasContext });

    // Option 2: Redirect to frontend with context in URL (for initial load)
    const frontendUrl = process.env.FRONTEND_URL || 'https://polaristest-theta.vercel.app';
    const params = new URLSearchParams();
    
    // Pass key parameters to frontend
    if (canvasContext.parameters.recordId) {
      params.set('recordId', canvasContext.parameters.recordId);
    }
    if (canvasContext.parameters.action) {
      params.set('action', canvasContext.parameters.action);
    }
    
    // Add a token for the frontend to fetch full context
    const contextToken = Buffer.from(JSON.stringify(canvasContext)).toString('base64');
    params.set('canvasToken', contextToken);

    const redirectUrl = `${frontendUrl}?${params.toString()}`;
    console.log('Canvas: Redirecting to:', redirectUrl);
    
    res.redirect(redirectUrl);

  } catch (err) {
    console.error('Canvas: Error processing signed request:', err);
    res.status(500).json({ error: 'Error processing signed request', details: err.message });
  }
});

/**
 * GET /api/canvas/context
 * 
 * Decodes a canvas token passed from the redirect
 */
router.get('/context', (req, res) => {
  try {
    const { canvasToken } = req.query;
    
    if (!canvasToken) {
      return res.status(400).json({ error: 'Missing canvasToken' });
    }

    const context = JSON.parse(Buffer.from(canvasToken, 'base64').toString('utf8'));
    res.json({ success: true, context });
    
  } catch (err) {
    console.error('Canvas: Error decoding context:', err);
    res.status(400).json({ error: 'Invalid canvasToken' });
  }
});

export default router;
