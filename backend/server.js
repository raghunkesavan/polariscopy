import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { supabase } from './config/supabase.js';
import { validateEnvironment } from './config/validateEnv.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger, { httpLogger } from './utils/logger.js';
import quotesRouter from './routes/quotes.js';
import dipPdfRouter from './routes/dipPdf.js';
import quotePdfRouter from './routes/quotePdf.js';
import exportRouter from './routes/export.js';
import authRouter from './routes/auth.js';
import postcodeLookupRouter from './routes/postcodeLookup.js';
import ratesRouter from './routes/rates.js';
import supportRouter from './routes/support.js';
import adminRouter from './routes/admin.js';
import reportingRouter from './routes/reporting.js';
import apiKeysRouter from './routes/apiKeys.js';
import canvasRouter from './routes/canvas.js';
import salesforceApiRouter from './routes/salesforceApi.js';
// Rate limiting middleware
import { apiLimiter, exportLimiter, pdfLimiter, reportingLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

// Validate required environment variables before starting server
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory session data for Canvas signed_request parsing
let sessionData = {};

// Trust proxy - Required for Render/Vercel/etc to get real client IP
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = [
  'http://localhost:3000', // Local dev
  'http://localhost:3001', // Frontend running on alternate port
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
    }

    // Allow Salesforce Canvas requests
    if (origin && (origin.includes('salesforce.com') || origin.includes('force.com'))) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by CORS`));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Allow Salesforce Canvas to embed this app in an iframe
app.use((req, res, next) => {
  // Allow Salesforce domains to frame the application
  res.setHeader('Content-Security-Policy', "frame-ancestors https://*.salesforce.com https://*.force.com https://*.lightning.force.com");
  // Remove X-Frame-Options to avoid conflicts with CSP
  res.removeHeader('X-Frame-Options');
  next();
});

// HTTP request logging (replaces console.log middleware)
app.use(httpLogger);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root - simple API info (helps platforms that hit /)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API root - use /health or /api/rates' });
});

// Salesforce Canvas endpoint - handles signed_request POST from Salesforce
app.use('/api/canvas', canvasRouter);
 //const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET || '11F061EBE83BD260AF06ECF3776431661016D34C0590B01D371AFBC160C2EF53'
  
// Direct signed_request handler (JSON response)
/*
app.post('/api/canvas/signed-request', (req, res) => {
  try {
    const signedRequest = req.body?.signed_request;

    console.log('[Canvas signedRequest] ✅ signedRequest obtained and cached' + signedRequest);

    if (!signedRequest) {
      return res.status(400).json({
        success: false,
        error: 'Missing signed_request'
      });
    }

    const CANVAS_CONSUMER_SECRET = '11F061EBE83BD260AF06ECF3776431661016D34C0590B01D371AFBC160C2EF53';
    if (!CANVAS_CONSUMER_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'CANVAS_CONSUMER_SECRET not configured'
      });
    }

    const [consumerSecret, encodedEnvelope] = signedRequest.split('.');
    if (!consumerSecret || !encodedEnvelope) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signed_request format'
      });
    }

    const check = crypto
      .createHmac('sha256', CANVAS_CONSUMER_SECRET)
      .update(encodedEnvelope)
      .digest('base64');

    if (check !== consumerSecret) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: invalid signature'
      });
    }

    const envelope = JSON.parse(
      Buffer.from(encodedEnvelope, 'base64').toString('ascii')
    );

    // Store session info for API calls
    sessionData = {
      oauthToken: envelope.client?.oauthToken,
      instanceUrl: envelope.client?.instanceUrl,
      customParameters: envelope.customParameters || envelope.context?.environment?.parameters || {},
    };

    return res.json({
      success: true,
      user: envelope.context?.user,
      organization: envelope.context?.organization,
      client: envelope.client,
      customParameters: sessionData.customParameters,
      sessionData
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Error verifying signed_request',
      details: err.message
    });
  }
});
  */
// Salesforce REST API endpoints (API key protected)
app.use('/api/salesforce', salesforceApiRouter);

// Rates endpoints - fetches rates from rates_flat table
app.use('/api/rates', ratesRouter);

// Quotes endpoints (CRUD)
app.use('/api/quotes', quotesRouter);

// Auth endpoints (register, login, etc.)
app.use('/api/auth', authRouter);

// Postcode lookup endpoint
app.use('/api/postcode-lookup', postcodeLookupRouter);

// Support requests endpoint
app.use('/api/support', supportRouter);

// Admin data health endpoint
app.use('/api/admin', adminRouter);

// API Key management endpoint (admin only)
app.use('/api/admin/api-keys', apiKeysRouter);

// Reporting API (Power BI / Data Teams) - uses API key authentication
app.use('/api/reporting', reportingLimiter);
app.use('/api/reporting', reportingRouter);

// DIP PDF generation endpoint
app.use('/api/dip/pdf', pdfLimiter);
app.use('/api/dip/pdf', dipPdfRouter);

// Quote PDF generation endpoint
app.use('/api/quote/pdf', pdfLimiter);
app.use('/api/quote/pdf', quotePdfRouter);

// Export endpoint
app.use('/api/export', exportLimiter);
app.use('/api/export', exportRouter);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handling - must be last
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  if (process.env.FRONTEND_URL) {
    logger.info(`🌐 Frontend allowed origin: ${process.env.FRONTEND_URL}`);
  }
  logger.info(`💾 Supabase connected`);
  logger.info(`📝 Logging to: logs/combined.log`);
});

