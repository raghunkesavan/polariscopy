/**
 * Salesforce Canvas Signed Request Handler
 * 
 * This route receives the signed_request from Salesforce Canvas,
 * verifies the signature, and extracts Canvas context data.
 * 
 * Pattern based on Salesforce Canvas Demo app
 */

import express from 'express';
import crypto from 'crypto';
const router = express.Router();

// Consumer Secret from Salesforce Connected App
//const CANVAS_CONSUMER_SECRET = process.env.CANVAS_CONSUMER_SECRET;
const CANVAS_CONSUMER_SECRET = '834B749C07C792E815A8DABD22D52F4381C0E25187AA55345CA5FB010DAAB74B';

/**
 * POST /api/canvas
 * 
 * Main handler for Canvas signed requests
 * Receives POST with signed_request from Salesforce
 */
router.post('/', express.json(), express.urlencoded({ extended: false }), (req, res) => {
  try {
    const signedRequest = req.body?.signed_request;
    
    if (!signedRequest) {
      console.error('[Canvas] No signed_request in body');
      return res.status(400).json({ 
        success: false,
        error: 'Missing signed_request' 
      });
    }

    if (!CANVAS_CONSUMER_SECRET) {
      console.error('[Canvas] CANVAS_CONSUMER_SECRET not configured');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error' 
      });
    }

    // Split the signed request: signature.encodedEnvelope
    const [signature, encodedEnvelope] = signedRequest.split('.');
    
    if (!signature || !encodedEnvelope) {
      console.error('[Canvas] Invalid signed_request format');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid signed_request format' 
      });
    }

    // Verify the HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', CANVAS_CONSUMER_SECRET)
      .update(encodedEnvelope)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error('[Canvas] Signature verification failed');
      console.error('[Canvas] Expected:', expectedSignature);
      console.error('[Canvas] Got:', signature);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid signature - verification failed' 
      });
    }

    // Decode the envelope
    let envelope;
    try {
      envelope = JSON.parse(
        Buffer.from(encodedEnvelope, 'base64').toString('utf8')
      );
    } catch (decodeErr) {
      console.error('[Canvas] Failed to decode envelope:', decodeErr.message);
      return res.status(400).json({ 
        success: false,
        error: 'Failed to decode Canvas envelope' 
      });
    }

    console.log('[Canvas] Successfully verified signed request');
    console.log('[Canvas] User:', envelope.context?.user?.userName);
    console.log('[Canvas] Org:', envelope.context?.organization?.organizationId);
    console.log('[Canvas] Parameters:', envelope.context?.environment?.parameters);

    // Extract Canvas context - same structure as CanvasDemo-master
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
      // Extract parameters from environment or customParameters
      canvasParameters: envelope.context?.environment?.parameters || envelope.customParameters || {},
    };

    console.log('[Canvas] Returning context to frontend:', {
      user: canvasContext.context.user?.userName,
      org: canvasContext.context.organization?.organizationId,
      hasOAuthToken: !!canvasContext.client.oauthToken,
    });

    return res.json(canvasContext);

  } catch (err) {
    console.error('[Canvas] Error processing signed request:', err);
    return res.status(500).json({ 
      success: false,
      error: 'Error processing signed request',
      details: err.message 
    });
  }
});

/**
 * GET /api/canvas
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'Canvas API Ready',
    hasConsumerSecret: !!CANVAS_CONSUMER_SECRET,
    message: 'This endpoint receives signed_request POST from Salesforce Canvas'
  });
});

export default router;
