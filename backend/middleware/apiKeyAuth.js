import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { ErrorTypes } from './errorHandler.js';
import logger from '../utils/logger.js';

/**
 * API Key Authentication Middleware
 * 
 * For use with external systems (Power BI, data teams) that need read-only access
 * to reporting data. Separate from user JWT authentication.
 * 
 * Usage: Include header `X-API-Key: your-api-key-here`
 */
export const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(ErrorTypes.unauthorized('API key required. Include X-API-Key header.'));
  }

  try {
    // Hash the provided key to match stored hash
    const keyHash = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    // Look up API key in database
    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !apiKeyRecord) {
      logger.warn('Invalid API key attempt', { 
        ip: req.ip,
        keyPrefix: apiKey.substring(0, 8) 
      });
      return next(ErrorTypes.unauthorized('Invalid or inactive API key'));
    }

    // Check expiration
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return next(ErrorTypes.unauthorized('API key has expired'));
    }

    // Attach API key info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      permissions: apiKeyRecord.permissions || ['read:reports'],
      created_by: apiKeyRecord.created_by
    };

    // Update last used timestamp (async, don't block request)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id)
      .then(() => {})
      .catch(err => logger.error('Failed to update API key last_used_at', err));

    logger.info('API key authenticated', { 
      keyName: apiKeyRecord.name,
      ip: req.ip 
    });

    next();
  } catch (err) {
    logger.error('API key authentication error', err);
    return next(ErrorTypes.internal('Authentication error'));
  }
};

/**
 * Check if API key has specific permission
 */
export const requireApiPermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return next(ErrorTypes.unauthorized('API key authentication required'));
    }

    const permissions = req.apiKey.permissions || [];
    
    if (!permissions.includes(permission) && !permissions.includes('*')) {
      return next(ErrorTypes.forbidden(`Permission '${permission}' required`));
    }

    next();
  };
};

/**
 * Generate a new API key (call this from admin route)
 */
export const generateApiKey = () => {
  // Format: pk_live_xxxxxxxxxxxxxxxxxxxx (32 chars total)
  const randomBytes = crypto.randomBytes(24);
  const apiKey = 'pk_live_' + randomBytes.toString('base64url').substring(0, 24);
  
  const keyHash = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  return { apiKey, keyHash };
};
