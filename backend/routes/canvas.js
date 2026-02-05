/**
 * Salesforce Canvas Signed Request Handler
 */

import express from 'express';
import crypto from 'crypto';
const router = express.Router();
import jwt from 'jsonwebtoken';
import axios from "axios";
import qs from "qs";
// Cache last Canvas payload for REST access
const lastCanvasPayload = {
  receivedAt: null,
  hasSignedRequest: false,
  signatureValid: null,
  client: null,
  context: null,
  canvasParameters: null
};

// Token cache and rate limiting
const tokenCache = {
  token: null,
  expiresAt: 0,
  lastRequestTime: 0
};

const REQUEST_COOLDOWN = 60000; // 60 seconds between requests

// Consumer Secret from Salesforce Connected App
//const CANVAS_CONSUMER_SECRET = '834B749C07C792E815A8DABD22D52F4381C0E25187AA55345CA5FB010DAAB74B';
  process.env.CANVAS_CONSUMER_SECRET || '834B749C07C792E815A8DABD22D52F4381C0E25187AA55345CA5FB010DAAB74B';
  const CANVAS_CONSUMER_SECRET = process.env.CANVAS_CONSUMER_SECRET;

  const SF_CLIENT_ID = process.env.SF_CLIENT_ID || '3MVG93ftGtO2exG.IlQU5J23wBwppHWqfH99Bgt_bgUrgcLPMsfFr6WladsquMuKTBtkWJ12evg_Nes.qsWlu'
  const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET || '11F061EBE83BD260AF06ECF3776431661016D34C0590B01D371AFBC160C2EF53'
  const SF_USERNAME = process.env.SF_USERNAME || 'raghu.kesavan@mfsastra.com.dev'
  const SF_PASSWORD = process.env.SF_PASSWORD || 'Hrishi@27'
  const SF_SECURITY_TOKEN = process.env.SF_SECURITY_TOKEN || '20rq5vDVXq79aVYvXL0nuO00h'

/**
 * Get OAuth token with rate limiting and caching
 */
async function getOAuthToken() {
  const now = Date.now();
  
  // Check if we have a valid cached token
  if (tokenCache.token && tokenCache.expiresAt > now) {
    console.log('[Canvas GET] 📦 Using cached OAuth token');
    return tokenCache.token;
  }

  // Rate limit: Don't allow requests more than once per 60 seconds
  if (now - tokenCache.lastRequestTime < REQUEST_COOLDOWN) {
    const waitTime = Math.ceil((REQUEST_COOLDOWN - (now - tokenCache.lastRequestTime)) / 1000);
    console.error('[Canvas GET] ⏳ Rate limited - please wait ' + waitTime + ' seconds before trying again');
    throw new Error('Rate limited - too many OAuth requests. Try again in ' + waitTime + ' seconds');
  }

  console.log('[Canvas GET] 🔐 Requesting fresh OAuth token from Salesforce...');
  tokenCache.lastRequestTime = now;

  try {
    const tokenResponse = await axios.post(
      "https://mfsuk--dev.sandbox.my.salesforce.com/services/oauth2/token",
      qs.stringify({
        grant_type: "password",
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET,
        username: SF_USERNAME,
        password: SF_PASSWORD + SF_SECURITY_TOKEN
      }),
      { 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true
      }
    );

    if (tokenResponse.status === 200) {
      const { access_token, expires_in = 3600 } = tokenResponse.data;
      
      // Cache the token
      tokenCache.token = access_token;
      tokenCache.expiresAt = now + (expires_in * 1000);
      
      console.log('[Canvas GET] ✅ OAuth token obtained and cached');
      console.log('[Canvas GET] 🔗 Token expires in:', expires_in, 'seconds');
      
      return access_token;
    } else {
      console.error('[Canvas GET] ❌ OAuth token request failed:', tokenResponse.status);
      console.error('[Canvas GET] Error:', JSON.stringify(tokenResponse.data, null, 2));
      throw new Error('OAuth token request failed: ' + (tokenResponse.data?.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('[Canvas GET] ❌ Token request error:', error.message);
    throw error;
  }
}


/**
 * POST /api/canvas
 * Main handler for Canvas signed requests and Canvas context
 */
router.post('/', (req, res) => {
  try {
    console.log('═'.repeat(60));
    console.log('[Canvas] 🎯 Received POST request at:', new Date().toISOString());
    console.log('[Canvas] 📍 Origin:', req.headers.origin || 'No origin header');
    console.log('[Canvas] 🔑 Content-Type:', req.headers['content-type']);
    console.log('[Canvas] 📦 Request body type:', typeof req.body);
    console.log('[Canvas] 📦 Request body keys:', Object.keys(req.body || {}));
    console.log('[Canvas] 📦 Full request body:', JSON.stringify(req.body, null, 2));
    console.log('─'.repeat(60));

    // Handle Canvas context from frontend (localhost development)
    if (req.body?.type === 'canvas_context') {
      console.log('[Canvas] ✅ Received canvas context from frontend (development mode)');
      console.log('[Canvas] 📋 Canvas parameters:', JSON.stringify(req.body.data, null, 2));
      console.log('[Canvas] ⏰ Timestamp:', req.body.timestamp);
      
      return res.json({
        success: true,
        message: 'Canvas context received',
        timestamp: req.body.timestamp,
        data: req.body.data,
        receivedAt: new Date().toISOString(),
      });
    }

    // Handle signed requests from Salesforce (production)
    const signedRequest = req.body?.signed_request;
    
    if (!signedRequest) {
      console.error('[Canvas] ❌ No signed_request in body');
      console.error('[Canvas] 📦 Received body was:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ 
        success: false,
        error: 'Missing signed_request',
        receivedBody: req.body
      });
    }

    console.log('[Canvas] 🔐 Processing Salesforce signed request');
    console.log('[Canvas] 📏 Signed request length:', signedRequest.length);

    if (!CANVAS_CONSUMER_SECRET) {
      console.error('[Canvas] ❌ CANVAS_CONSUMER_SECRET not configured');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error' 
      });
    }

    // Split the signed request: signature.encodedEnvelope
    const [signature, encodedEnvelope] = signedRequest.split('.');
    
    if (!signature || !encodedEnvelope) {
      console.error('[Canvas] ❌ Invalid signed_request format');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid signed_request format' 
      });
    }

    console.log('[Canvas] ✅ Signed request format valid');

    // Verify the HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', CANVAS_CONSUMER_SECRET)
      .update(encodedEnvelope)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error('[Canvas] ❌ Signature verification failed');
      console.error('[Canvas] Expected:', expectedSignature.substring(0, 20) + '...');
      console.error('[Canvas] Got:', signature.substring(0, 20) + '...');
      lastCanvasPayload.receivedAt = new Date().toISOString();
      lastCanvasPayload.hasSignedRequest = true;
      lastCanvasPayload.signatureValid = false;
      return res.status(401).json({ 
        success: false,
        error: 'Invalid signature - verification failed' 
      });
    }

    console.log('[Canvas] ✅ Signature verified successfully!');

    // Decode the envelope
    let envelope;
    try {
      envelope = JSON.parse(
        Buffer.from(encodedEnvelope, 'base64').toString('utf8')
      );
      console.log('[Canvas] ✅ Envelope decoded successfully');
    } catch (decodeErr) {
      console.error('[Canvas] ❌ Failed to decode envelope:', decodeErr.message);
      return res.status(400).json({ 
        success: false,
        error: 'Failed to decode Canvas envelope' 
      });
    }

    console.log('[Canvas] 🎉 Successfully verified Salesforce signed request');
    console.log('[Canvas] 👤 User:', envelope.context?.user?.userName);
    console.log('[Canvas] 📧 User Email:', envelope.context?.user?.email);
    console.log('[Canvas] 🏢 Organization:', envelope.context?.organization?.name);
    console.log('[Canvas] 🆔 Org ID:', envelope.context?.organization?.organizationId);
    console.log('[Canvas] 📋 Canvas Parameters:', JSON.stringify(envelope.context?.environment?.parameters, null, 2));
    console.log('[Canvas] 🔗 Instance URL:', envelope.client?.instanceUrl);
    console.log('═'.repeat(60));

    // Extract Canvas context
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
      canvasParameters: envelope.context?.environment?.parameters || envelope.customParameters || {},
    };

    // Cache last successful payload for REST access
    lastCanvasPayload.receivedAt = new Date().toISOString();
    lastCanvasPayload.hasSignedRequest = true;
    lastCanvasPayload.signatureValid = true;
    lastCanvasPayload.client = {
      instanceUrl: canvasContext.client.instanceUrl,
      targetOrigin: canvasContext.client.targetOrigin
    };
    lastCanvasPayload.context = canvasContext.context;
    lastCanvasPayload.canvasParameters = canvasContext.canvasParameters;

    console.log('[Canvas] Returning context to frontend:', {
      user: canvasContext.context.user?.userName,
      org: canvasContext.context.organization?.organizationId,
      hasOAuthToken: !!canvasContext.client.oauthToken,
    });

    // Return the Canvas context
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
 * Health check endpoint and OAuth approval redirect handler
 */
router.get('/', async (req, res) => {
  try {
    console.log('[Canvas GET] 📥 Received GET request');
    console.log('[Canvas GET] 🔍 Query params:', req.query);

    const authStatus = req.query?._sfdc_canvas_auth;
    const loginUrl = req.query?.loginUrl;

    console.log('[Canvas GET] 🔐 Auth Status:', authStatus);
    console.log('[Canvas GET] 🔗 Login URL:', loginUrl);

    // If OAuth approval required, get access token and redirect
    if (authStatus === 'user_approval_required' && loginUrl) {
      console.log('[Canvas GET] 🔐 OAuth approval challenge detected');
      
      try {
        // Get OAuth token (with caching and rate limiting)
        const access_token = await getOAuthToken();
        
        console.log('[Canvas GET] ✅ OAuth token ready');
        console.log('[Canvas GET] 🔐 Access Token (first 20 chars):', access_token.substring(0, 20) + '...');
        
        // Store token in response header
        res.setHeader('Authorization', `Bearer ${access_token}`);
        
        // Return HTML that redirects and triggers repost
        console.log('[Canvas GET] ✅ Redirecting to Salesforce for user approval');
        console.log('[Canvas GET] 🔗 Redirect URL:', loginUrl);
        /*
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Canvas OAuth Redirect</title>
            <script src="https://mfsuk--dev.sandbox.lightning.force.com/canvas/sdk/js/canvas-all.js"></script>
          </head>
          <body>
            <p>Redirecting to Salesforce for authorization...</p>
            <script>
              console.log('[Canvas] Redirecting to OAuth approval page...');
              //window.location.href = '${loginUrl}';
               window.location.href = 'http://localhost:3000/';
              
              window.addEventListener('load', function() {
                setTimeout(function() {
                  if (typeof Sfdc !== 'undefined' && Sfdc.canvas && Sfdc.canvas.client) {
                    console.log('[Canvas] Triggering repost after OAuth approval...');
                    Sfdc.canvas.client.repost({ refresh: true });
                  }
                }, 1000);
              });
            </script>
          </body>
          </html>
        `);*/
        
      } catch (tokenError) {
        console.error('[Canvas GET] ❌ OAuth error:', tokenError.message);
        
        // Check for rate limit error from Salesforce
        if (tokenError.message.includes('Too many requests') || tokenError.message.includes('Rate limited')) {
          console.error('[Canvas GET] ⏳ Salesforce rate limit hit - waiting 15 minutes');
          return res.status(429).json({
            success: false,
            error: 'Salesforce API rate limit reached',
            message: 'Too many OAuth requests. Please wait 15 minutes before trying again.',
            status: 429
          });
        }
        
        return res.status(500).json({
          success: false,
          error: 'OAuth authentication failed',
          details: tokenError.message,
          hint: 'Verify Salesforce credentials (username, password, security token)'
        });
      }
    }

    // Health check response
    res.json({
      status: 'Canvas API Ready',
      hasConsumerSecret: !!CANVAS_CONSUMER_SECRET,
      message: 'This endpoint receives signed_request POST from Salesforce Canvas',
      note: 'Canvas parameters are extracted from signed_request in POST handler'
    });
  } catch (err) {
    console.error('[Canvas GET] ❌ Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * GET /api/canvas/details
 * Returns last received Canvas parameters and signed request metadata
 */
router.get('/details', (req, res) => {
  res.json({
    success: true,
    lastReceivedAt: lastCanvasPayload.receivedAt,
    hasSignedRequest: lastCanvasPayload.hasSignedRequest,
    signatureValid: lastCanvasPayload.signatureValid,
    client: lastCanvasPayload.client,
    context: lastCanvasPayload.context,
    canvasParameters: lastCanvasPayload.canvasParameters
  });
});

export default router;