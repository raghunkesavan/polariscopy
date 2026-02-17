/**
 * Salesforce-facing REST API
 */

import express from 'express';
//import { authenticateApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// In-memory store for payloads per user (resets on server restart)
const userEchoPayloads = new Map(); // userId -> { receivedAt, expiresAt, payload }
const ECHO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired payloads every minute
setInterval(() => {
  const now = Date.now();
  for (const [user, data] of userEchoPayloads.entries()) {
    if (data.expiresAt && now > data.expiresAt) {
      userEchoPayloads.delete(user);
      console.log(`[Salesforce Echo] 🧹 Cleaned up expired payload for user: ${user}`);
    }
  }
}, 60 * 1000);

// Public endpoint to read last payload (no API key required)
// Expects userId as query param or header
router.get('/echo/last', (req, res) => {
  // Get userId from query param, header, or Canvas context
  const userId = req.query.user || 
                 req.headers['x-user-id'] || 
                 req.headers['x-salesforce-user-id'];

  if (!user) {
    return res.json({
      success: false,
      error: 'userId parameter required (query param, x-user-id header, or x-salesforce-user-id header)',
      lastReceivedAt: null,
      payload: null
    });
  }

  const userPayload = userEchoPayloads.get(user);
  const isExpired = userPayload?.expiresAt && Date.now() > userPayload.expiresAt;

  if (isExpired) {
    userEchoPayloads.delete(user);
  }

  const validPayload = isExpired ? null : userPayload;

  res.json({
    success: true,
    user,
    lastReceivedAt: validPayload?.receivedAt || null,
    payload: validPayload?.payload || null
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
  const payload = req.body || {};

  // Extract userId from multiple possible sources
  const userId = payload.userId ||
                 payload.user ||  
                 payload.user_id || 
                 payload.sfUserId || 
                 payload.salesforceUserId ||
                 req.query.userId || 
                 req.headers['x-user-id'] || 
                 req.headers['x-salesforce-user-id'];

  if (!user) {
    console.warn('[Salesforce Echo] ⚠️ No userId found in payload, query, or headers');
    return res.status(400).json({
      success: false,
      error: 'userId required in payload (userId, user_id, sfUserId, salesforceUserId), query param, or headers (x-user-id, x-salesforce-user-id)',
      receivedAt
    });
  }

  // Store payload for this specific user
  userEchoPayloads.set(user, {
    receivedAt,
    expiresAt: Date.now() + ECHO_CACHE_TTL_MS,
    payload
  });

  res.json({
    success: true,
    user,
    receivedAt,
    payload,
    cachedUsers: userEchoPayloads.size
  });
  
  console.log(`[Salesforce Echo] ✅ Payload received for user ${user}:`, JSON.stringify(payload, null, 2));
  console.log(`[Salesforce Echo] 📊 Total cached users: ${userEchoPayloads.size}`);
});

// Debug endpoint to view all cached users and their data
router.get('/echo/stats', (req, res) => {
  const now = Date.now();
  const users = [];
  
  for (const [userId, data] of userEchoPayloads.entries()) {
    const timeRemaining = Math.max(0, data.expiresAt - now);
    users.push({
      userid,
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
