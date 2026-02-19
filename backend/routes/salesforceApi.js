/**
 * Salesforce-facing REST API
 */
import crypto from "crypto";
import express from 'express';
//import { authenticateApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

function decryptFromSalesforce(ivBase64, dataBase64, base64Key) {
    const key = Buffer.from(base64Key, "base64");
    const iv = Buffer.from(ivBase64, "base64");
    const encryptedData = Buffer.from(dataBase64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedData, null, "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
}

// In-memory store for payloads per user (resets on server restart)
const userEchoPayloads = new Map(); // userId -> { receivedAt, expiresAt, decrypted }
const ECHO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  // Get userId from query param, header, or Canvas context
  const userId = req.query.userId || 
                 req.headers['x-user-id'] || 
                 req.headers['x-salesforce-user-id'];

  if (!userId) {
    return res.json({
      success: false,
      error: 'userId parameter required (query param, x-user-id header, or x-salesforce-user-id header)',
      lastReceivedAt: null,
      payload: null
    });
  }

  const userPayload = userEchoPayloads.get(userId);
  const isExpired = userPayload?.expiresAt && Date.now() > userPayload.expiresAt;

  if (isExpired) {
    userEchoPayloads.delete(userId);
  }

  const validPayload = isExpired ? null : userPayload;

  res.json({
    success: true,
    user: userId,
    lastReceivedAt: validPayload?.receivedAt || null,
    payload: validPayload?.decrypted || null
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
  const { iv, payload } = req.body || {};
  
  // Decrypt the payload from Salesforce
  let decrypted;
  try {
    if (!iv || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing iv or payload in request body',
        receivedAt
      });
    }
    
    if (!process.env.AES_KEY_BASE64) {
      console.error('[Salesforce Echo] ❌ AES_KEY_BASE64 environment variable not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        receivedAt
      });
    }
    
    decrypted = decryptFromSalesforce(iv, payload, process.env.AES_KEY_BASE64);
    console.log('[Salesforce Echo] 🔓 Decrypted raghu payload:', JSON.stringify(decrypted, null, 2));
    
  } catch (error) {
    console.error('[Salesforce Echo] ❌ Decryption failed:', error.message);
    return res.status(400).json({
      success: false,
      error: 'Failed to decrypt payload',
      receivedAt
    });
  }

  // Extract userId from multiple possible sources
  const userId = decrypted.user ||  
                 req.query.userId || 
                 req.headers['x-user-id'] || 
                 req.headers['x-salesforce-user-id'];

  if (!userId) {
    console.warn('[Salesforce Echo] ⚠️ No userId found in payload, query, or headers');
    return res.status(400).json({
      success: false,
      error: 'userId required in decrypted payload (user field), query param (userId), or headers (x-user-id, x-salesforce-user-id)',
      receivedAt
    });
  }

  // Store payload for this specific user
  userEchoPayloads.set(userId, {
    receivedAt,
    expiresAt: Date.now() + ECHO_CACHE_TTL_MS,
    decrypted
  });

  res.json({
    success: true,
    user: userId,
    receivedAt,
    decrypted,
    cachedUsers: userEchoPayloads.size
  });
  
  console.log(`[Salesforce Echo] ✅ Payload received for user ${userId}:`, JSON.stringify(decrypted, null, 2));
  console.log(`[Salesforce Echo] 📊 Total cached users: ${userEchoPayloads.size}`);
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
