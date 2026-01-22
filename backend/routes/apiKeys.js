import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireAccessLevel } from '../middleware/auth.js';
import { generateApiKey } from '../middleware/apiKeyAuth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication and admin access (level 1)
router.use(authenticateToken);
router.use(requireAccessLevel(1));

/**
 * Admin API Key Management Routes
 * 
 * These routes allow admins to create, list, and revoke API keys
 * for external systems (Power BI, data teams)
 */

/**
 * POST /api/admin/api-keys
 * 
 * Create a new API key
 * 
 * Body:
 * {
 *   "name": "Power BI - Data Team",
 *   "permissions": ["read:reports"],
 *   "expiresInDays": 365,
 *   "notes": "API key for Power BI reporting dashboard"
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, permissions = ['read:reports'], expiresInDays, notes } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    // Generate API key and hash
    const { apiKey, keyHash } = generateApiKey();

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expiresInDays);
      expiresAt = expirationDate.toISOString();
    }

    // Store in database
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        name: name.trim(),
        key_hash: keyHash,
        permissions,
        expires_at: expiresAt,
        created_by: req.user.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('API key created', {
      name: data.name,
      createdBy: req.user.email,
      expiresAt,
    });

    // Return the plain API key (ONLY time it's shown)
    res.status(201).json({
      message: 'API key created successfully. Store this key securely - it cannot be retrieved again.',
      apiKey: apiKey, // ONLY time we return the plain key
      keyInfo: {
        id: data.id,
        name: data.name,
        permissions: data.permissions,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    logger.error('API key creation error', error);
    next(error);
  }
});

/**
 * GET /api/admin/api-keys
 * 
 * List all API keys (without revealing the actual keys)
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        permissions,
        is_active,
        created_at,
        updated_at,
        expires_at,
        last_used_at,
        notes,
        created_by
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enhance with creator information
    const keysWithCreator = await Promise.all(
      data.map(async (key) => {
        if (key.created_by) {
          const { data: user } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', key.created_by)
            .single();

          return {
            ...key,
            created_by_email: user?.email,
            created_by_name: user?.full_name,
          };
        }
        return key;
      })
    );

    res.json({ apiKeys: keysWithCreator });
  } catch (error) {
    logger.error('API key list error', error);
    next(error);
  }
});

/**
 * PATCH /api/admin/api-keys/:id/revoke
 * 
 * Revoke (deactivate) an API key
 */
router.patch('/:id/revoke', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'API key not found' });
    }

    logger.info('API key revoked', {
      name: data.name,
      revokedBy: req.user.email,
    });

    res.json({
      message: 'API key revoked successfully',
      apiKey: data,
    });
  } catch (error) {
    logger.error('API key revocation error', error);
    next(error);
  }
});

/**
 * PATCH /api/admin/api-keys/:id/activate
 * 
 * Reactivate an API key
 */
router.patch('/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('api_keys')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'API key not found' });
    }

    logger.info('API key activated', {
      name: data.name,
      activatedBy: req.user.email,
    });

    res.json({
      message: 'API key activated successfully',
      apiKey: data,
    });
  } catch (error) {
    logger.error('API key activation error', error);
    next(error);
  }
});

/**
 * DELETE /api/admin/api-keys/:id
 * 
 * Permanently delete an API key
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get key info before deletion for logging
    const { data: keyInfo } = await supabase
      .from('api_keys')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.warn('API key deleted', {
      name: keyInfo?.name,
      deletedBy: req.user.email,
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    logger.error('API key deletion error', error);
    next(error);
  }
});

export default router;
