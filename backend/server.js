import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
// Rate limiting middleware
import { apiLimiter, exportLimiter, pdfLimiter, reportingLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

// Validate required environment variables before starting server
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

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

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by CORS`));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

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