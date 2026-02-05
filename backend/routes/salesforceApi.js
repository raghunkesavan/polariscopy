/**
 * Salesforce-facing REST API
 */

import express from 'express';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// In-memory store for last payload (resets on server restart)
let lastEchoPayload = null;
const ECHO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Public endpoint to read last payload (no API key required)
router.get('/echo/last', (req, res) => {
  const isExpired =
    lastEchoPayload?.expiresAt && Date.now() > lastEchoPayload.expiresAt;

  if (isExpired) {
    lastEchoPayload = null;
  }

  res.json({
    success: true,
    lastReceivedAt: lastEchoPayload?.receivedAt || null,
    payload: lastEchoPayload?.payload || null
  });
});

// All routes require API key
router.use(authenticateApiKey);

// Simple health/ping endpoint for Salesforce
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Salesforce API is reachable',
    timestamp: new Date().toISOString()
  });
});

// Example POST endpoint (echo payload)
router.post('/echo', (req, res) => {
  const receivedAt = new Date().toISOString();

  lastEchoPayload = {
    receivedAt,
    expiresAt: Date.now() + ECHO_CACHE_TTL_MS,
    payload: req.body || {}
  };

  res.json({
    success: true,
    receivedAt,
    payload: req.body || {}
  });
  
  console.log('[Salesforce Echo] ✅ Payload received:', JSON.stringify(req.body || {}, null, 2));
});

export default router;
