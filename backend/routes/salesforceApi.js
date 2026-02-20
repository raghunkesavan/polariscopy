/**
 * Salesforce-facing REST API
 */
import express from 'express';
//import { authenticateApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

function decodeFromSalesforce(base64String) {
    // Decode Base64 string to UTF-8
    const decoded = Buffer.from(base64String, "base64").toString("utf8");
    // Parse as JSON
    return JSON.parse(decoded);
}

// In-memory store for payloads per user (resets on server restart)
const userEchoPayloads = new Map(); // userId -> { receivedAt, expiresAt, decrypted }
const ECHO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Global variable to store last decoded payload
let decrypted;

// Cleanup expired payloads every minute
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of userEchoPayloads.entries()) {
    if (data.expiresAt && now > data.expiresAt) {
      userEchoPayloads.delete(userId);
      console.log(`[Salesforce Echo] 🧹 Cleaned up expired payload for user: ${userId}`);
    }
  }
}, 60 * 1000);

// Public endpoint to read last payload (no API key required)
// Expects userId as query param or header
router.get('/echo/last', (req, res) => {
  const userId =
    req.query.userId ||
    req.headers['x-user-id'] ||
    req.headers['x-salesforce-user-id'];

  if (!userId) {
    return res.json({
      success: false,
      error: 'userId parameter required',
      lastReceivedAt: null,
      payload: null
    });
  }

  const userPayload = userEchoPayloads.get(userId);
  const isExpired =
    userPayload?.expiresAt && Date.now() > userPayload.expiresAt;

  if (isExpired) {
    userEchoPayloads.delete(userId);
  }

  const validPayload = isExpired ? null : userPayload;

  res.json({
    success: true,
    user: userId,
    lastReceivedAtnew: validPayload?.receivedAt || null,
    payload: validPayload?.data || null   // ✅ FIXED HERE
  });
});


// All routes require API key
//router.use(authenticateApiKey);

// Simple health/ping endpoint for Salesforce
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Salesforce API is reachable',
    timestamp: new Date().toISOString()
  });
});




// Example POST endpoint (echo payload)
// Expects userId in payload, query param, or header
router.post('/echo', (req, res) => {
  const receivedAt = new Date().toISOString();
  const { payload } = req.body || {};

  try {
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing payload in request body',
        receivedAt
      });
    }

    // 🔥 Step 1: Decode Base64
    const decodedString = Buffer.from(payload, 'base64').toString('utf8');

    // 🔥 Step 2: Convert to JSON
    const decodedObject = JSON.parse(decodedString);

    const userId =
      decodedObject.user ||
      req.query.userId ||
      req.headers['x-user-id'] ||
      req.headers['x-salesforce-user-id'];

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId required',
        receivedAt
      });
    }

    // 🔥 Step 3: Store ONLY decodedObject
    userEchoPayloads.set(userId, {
      receivedAt,
      expiresAt: Date.now() + ECHO_CACHE_TTL_MS,
      data: decodedObject   // ✅ STORE CLEAN JSON
    });

    return res.json({
      success: true,
      user: userId,
      receivedAt
    });

  } catch (error) {
    console.error('Decode error:', error.message);
    return res.status(400).json({
      success: false,
      error: 'Failed to decode payload',
      receivedAt
    });
  }
});


// Debug endpoint to view all cached users and their data
router.get('/echo/stats', (req, res) => {
  const now = Date.now();
  const users = [];
  
  for (const [userId, data] of userEchoPayloads.entries()) {
    const timeRemaining = Math.max(0, data.expiresAt - now);
    users.push({
      userId,
      receivedAt: data.receivedAt,
      expiresInSeconds: Math.ceil(timeRemaining / 1000),
      isExpired: timeRemaining <= 0
    });
  }

  res.json({
    success: true,
    totalUsers: userEchoPayloads.size,
    cacheTTL: ECHO_CACHE_TTL_MS / 1000 + ' seconds',
    users
  });
});

export default router;
