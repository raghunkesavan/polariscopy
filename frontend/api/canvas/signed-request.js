/**
 * Vercel Serverless Function: Canvas Signed Request Handler
 * 
 * Location: frontend/api/canvas/signed-request.js
 * 
 * This replaces the backend canvas endpoint
 * Receives signed_request from Salesforce and redirects with decoded context
 */

import crypto from 'crypto';

const CANVAS_CONSUMER_SECRET = process.env.CANVAS_CONSUMER_SECRET;

export default function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // POST: Salesforce sends signed_request
  if (req.method === 'POST') {
    try {
      const signedRequest = req.body.signed_request;
      alert('hi');
      alert(signedRequest);
      if (!signedRequest) {
        console.error('Canvas: No signed_request in body');
        return res.status(400).json({ error: 'Missing signed_request' });
      }

      if (!CANVAS_CONSUMER_SECRET) {
        console.error('Canvas: CANVAS_CONSUMER_SECRET not configured');
        return res.status(500).json({ error: 'Server configuration error: CANVAS_CONSUMER_SECRET not set' });
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

      // Redirect to home page with context in URL
      const params = new URLSearchParams();

      // Pass key parameters
      if (canvasContext.parameters?.recordId) {
        params.set('recordId', canvasContext.parameters.recordId);
      }
      if (canvasContext.parameters?.action) {
        params.set('action', canvasContext.parameters.action);
      }

      // Add a token for the frontend to use
      const contextToken = Buffer.from(JSON.stringify(canvasContext)).toString('base64');
      params.set('canvasToken', contextToken);

      const redirectUrl = `/?${params.toString()}`;
      console.log('Canvas: Redirecting to:', redirectUrl);

      // Redirect
      res.redirect(302, redirectUrl);

    } catch (err) {
      console.error('Canvas: Error processing signed request:', err);
      res.status(500).json({ error: 'Error processing signed request', details: err.message });
    }
  }

  // GET: Debug endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'Canvas API Ready',
      hasConsumerSecret: !!CANVAS_CONSUMER_SECRET,
      consumerSecretLength: CANVAS_CONSUMER_SECRET?.length || 0,
      timestamp: new Date().toISOString(),
      message: 'This endpoint receives signed_request from Salesforce Canvas'
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
