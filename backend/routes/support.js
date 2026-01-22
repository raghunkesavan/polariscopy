import express from 'express';
import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';
import { sendSupportRequestNotification, sendSubmitterConfirmation } from '../utils/emailService.js';

const router = express.Router();

/**
 * POST /api/support
 * Create a new support request
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, bugType, suggestion, page } = req.body;

    logger.info('Received support request:', { name, email, bugType, page });

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        error: 'Name and email are required'
      });
    }

    // Insert support request into database
    const { data, error } = await supabase
      .from('support_requests')
      .insert({
        name,
        email,
        bug_type: bugType || null,
        suggestion: suggestion || null,
        page: page || 'Products',
        is_read: false,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      logger.error('Supabase error creating support request:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({
        error: 'Failed to create support request',
        details: error.message,
        hint: error.hint || 'Make sure the support_requests table exists in Supabase'
      });
    }

    logger.info(`Support request created: ${data.id} from ${email}`);

    // Send email notifications (non-blocking)
    // 1. Notify support team
    sendSupportRequestNotification({
      name,
      email,
      bugType,
      suggestion,
      page
    }).catch(err => {
      logger.error('Failed to send support team notification:', err);
    });

    // 2. Send confirmation to submitter
    sendSubmitterConfirmation({
      name,
      email,
      bugType,
      suggestion,
      page
    }).catch(err => {
      logger.error('Failed to send confirmation to submitter:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Support request submitted successfully',
      data
    });
  } catch (err) {
    logger.error('Support request error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * GET /api/support
 * Get all support requests (admin only)
 */
router.get('/', async (req, res) => {
  try {
    const { status, is_read, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('support_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching support requests:', error);
      return res.status(500).json({
        error: 'Failed to fetch support requests',
        details: error.message
      });
    }

    res.json({
      success: true,
      data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error('Support requests fetch error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * GET /api/support/unread-count
 * Get count of unread support requests (for notification badge)
 */
router.get('/unread-count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('support_requests')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      logger.error('Error counting unread requests:', error);
      return res.status(500).json({
        error: 'Failed to count unread requests',
        details: error.message
      });
    }

    res.json({
      success: true,
      unreadCount: count || 0
    });
  } catch (err) {
    logger.error('Unread count error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * PATCH /api/support/:id
 * Update a support request (mark as read, change status, add notes)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read, status, admin_notes, resolved_by } = req.body;

    const updates = {};
    if (is_read !== undefined) updates.is_read = is_read;
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (resolved_by) {
      updates.resolved_by = resolved_by;
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('support_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating support request:', error);
      return res.status(500).json({
        error: 'Failed to update support request',
        details: error.message
      });
    }

    logger.info(`Support request ${id} updated`);

    res.json({
      success: true,
      message: 'Support request updated',
      data
    });
  } catch (err) {
    logger.error('Support request update error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * PATCH /api/support/mark-all-read
 * Mark all support requests as read
 */
router.patch('/mark-all-read', async (req, res) => {
  try {
    const { error } = await supabase
      .from('support_requests')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      logger.error('Error marking all as read:', error);
      return res.status(500).json({
        error: 'Failed to mark all as read',
        details: error.message
      });
    }

    logger.info('All support requests marked as read');

    res.json({
      success: true,
      message: 'All requests marked as read'
    });
  } catch (err) {
    logger.error('Mark all read error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * DELETE /api/support/:id
 * Delete a support request (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('support_requests')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting support request:', error);
      return res.status(500).json({
        error: 'Failed to delete support request',
        details: error.message
      });
    }

    logger.info(`Support request ${id} deleted`);

    res.json({
      success: true,
      message: 'Support request deleted'
    });
  } catch (err) {
    logger.error('Support request delete error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

export default router;
