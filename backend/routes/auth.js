import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { 
  loginSchema, 
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  adminResetPasswordSchema,
  createUserSchema,
  updateUserSchema,
  validate 
} from '../middleware/validation.js';
import { AppError, ErrorTypes, asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAccessLevel } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const SALT_ROUNDS = 10;

// POST /api/auth/register - Create new user account
// POST /api/auth/login - Authenticate user (rate limiter temporarily removed)
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !user) {
    throw ErrorTypes.unauthorized('Invalid email or password');
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw ErrorTypes.unauthorized('Invalid email or password');
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'USER_LOGIN',
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      access_level: user.access_level,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Don't send password hash to client
  const { password_hash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    user: userWithoutPassword,
    token,
  });
}));

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, access_level, created_at, last_login')
    .eq('id', req.user.id)
    .eq('is_active', true)
    .single();

  if (error || !user) {
    throw ErrorTypes.notFound('User not found');
  }

  res.json({
    success: true,
    user,
  });
}));

// POST /api/auth/change-password - Change user password
router.post('/change-password', authenticateToken, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  // Get current user with password hash
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    throw ErrorTypes.notFound('User not found');
  }

  // Verify current password
  const passwordMatch = await bcrypt.compare(current_password, user.password_hash);

  if (!passwordMatch) {
    throw ErrorTypes.unauthorized('Current password is incorrect');
  }

  // Hash new password
  const new_password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

  // Update password
  await supabase
    .from('users')
    .update({ password_hash: new_password_hash, updated_at: new Date().toISOString() })
    .eq('id', req.user.id);

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: req.user.id,
    action: 'PASSWORD_CHANGED',
    table_name: 'users',
    record_id: req.user.id
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// GET /api/auth/access-levels - Get list of access levels (for admin reference)
router.get('/access-levels', authenticateToken, requireAccessLevel(1), (req, res) => {
  res.json({
    success: true,
    access_levels: {
      1: { name: 'Admin', permissions: 'Full access to everything' },
      2: { name: 'UW Team Lead', permissions: 'Edit calculators, rates, constants, criteria' },
      3: { name: 'Head of UW', permissions: 'Edit calculators, rates, constants, criteria' },
      4: { name: 'Underwriter', permissions: 'Access calculators and quotes only (read-only)' },
      5: { name: 'Product Team', permissions: 'Edit rates, constants, and criteria' },
    },
  });
});

// ============= ADMIN USER MANAGEMENT ENDPOINTS =============

// GET /api/auth/users - List all users (Admin only)
router.get('/users', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, access_level, is_active, created_at, last_login, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw ErrorTypes.database('Failed to list users', error);

  res.json({
    success: true,
    users,
  });
}));

// POST /api/auth/users - Create new user (Admin only)
router.post('/users', authenticateToken, requireAccessLevel(1), validate(createUserSchema), asyncHandler(async (req, res) => {
  const { email, password, name, access_level } = req.body;

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existingUser) {
    throw ErrorTypes.conflict('User with this email already exists');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      name: name || email.split('@')[0],
      access_level,
    })
    .select('id, email, name, access_level, created_at, is_active')
    .single();

  if (error) throw ErrorTypes.database('Failed to create user', error);

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: req.user.id,
    action: 'USER_CREATED',
    table_name: 'users',
    record_id: newUser.id,
    new_values: { email: newUser.email, access_level: newUser.access_level, created_by: req.user.email }
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: newUser,
  });
}));

// PATCH /api/auth/users/:id - Update user (Admin only)
router.patch('/users/:id', authenticateToken, requireAccessLevel(1), validate(updateUserSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, access_level, is_active } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (access_level !== undefined) updates.access_level = access_level;
  if (is_active !== undefined) updates.is_active = is_active;
  
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length === 1) { // Only updated_at
    throw ErrorTypes.badRequest('No valid fields to update');
  }

  // Prevent admin from deactivating themselves
  if (is_active === false && id === req.user.id) {
    throw ErrorTypes.badRequest('Cannot deactivate your own account');
  }

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, name, access_level, is_active, created_at, last_login')
    .single();

  if (error) throw ErrorTypes.database('Failed to update user', error);

  if (!updatedUser) {
    throw ErrorTypes.notFound('User not found');
  }

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: req.user.id,
    action: 'USER_UPDATED',
    table_name: 'users',
    record_id: id,
    new_values: { ...updates, updated_by: req.user.email }
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    user: updatedUser,
  });
}));

// DELETE /api/auth/users/:id - Delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAccessLevel(1), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (id === req.user.id) {
    throw ErrorTypes.badRequest('Cannot delete your own account');
  }

  // Get user info before deletion for audit log
  const { data: userToDelete } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', id)
    .single();

  if (!userToDelete) {
    throw ErrorTypes.notFound('User not found');
  }

  // Delete user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw ErrorTypes.database('Failed to delete user', error);

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: req.user.id,
    action: 'USER_DELETED',
    table_name: 'users',
    record_id: id,
    new_values: { deleted_user: userToDelete.email, deleted_by: req.user.email }
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
}));

// POST /api/auth/users/:id/reset-password - Admin reset user password
// Use adminResetPasswordSchema (no token required)
router.post('/users/:id/reset-password', authenticateToken, requireAccessLevel(1), validate(adminResetPasswordSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', id)
    .single();

  if (!user) {
    throw ErrorTypes.notFound('User not found');
  }

  // Hash new password
  const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

  // Update password
  await supabase
    .from('users')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', id);

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: req.user.id,
    action: 'PASSWORD_RESET_BY_ADMIN',
    table_name: 'users',
    record_id: id,
    new_values: { reset_for: user.email, reset_by: req.user.email }
  });

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
}));

// ============= FORGOT PASSWORD FLOW =============

// POST /api/auth/request-password-reset - Request password reset token
router.post('/request-password-reset', authLimiter, validate(resetPasswordRequestSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, is_active')
    .eq('email', email.toLowerCase())
    .single();

  // Always return success message (don't reveal if email exists)
  // This prevents email enumeration attacks
  const successMessage = 'If an account exists with this email, a password reset link has been generated.';

  if (error || !user) {
    // Don't reveal that user doesn't exist
    return res.json({
      success: true,
      message: successMessage,
    });
  }

  if (!user.is_active) {
    // Don't reveal that account is inactive
    return res.json({
      success: true,
      message: successMessage,
    });
  }

  // Generate secure reset token (UUID v4)
  const resetToken = crypto.randomUUID();
  
  // Token expires in 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Save token to database
  await supabase
    .from('users')
    .update({
      password_reset_token: resetToken,
      password_reset_expires: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    table_name: 'users',
    record_id: user.id,
    new_values: { email: user.email }
  });

  // Generate reset link
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // Send password reset email
  const emailResult = await sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetToken: resetToken,
    resetLink: resetLink
  });

  if (!emailResult.success) {
    logger.error('Failed to send password reset email:', emailResult.error);
    // In production, you might want to throw an error here
    // For now, we'll continue and return the link in development mode
  }

  res.json({
    success: true,
    message: successMessage,
    // DEVELOPMENT ONLY - Return link in response for testing
    resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    emailSent: emailResult.success,
  });
}));

// POST /api/auth/reset-password - Reset password using token
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { token, new_password } = req.body;

  // Find user by reset token
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_reset_expires, is_active')
    .eq('password_reset_token', token)
    .single();

  if (error || !user) {
    throw ErrorTypes.badRequest('Invalid or expired reset token');
  }

  if (!user.is_active) {
    throw ErrorTypes.forbidden('Account is inactive');
  }

  // Check if token has expired
  const now = new Date();
  const expiresAt = new Date(user.password_reset_expires);

  if (now > expiresAt) {
    // Clear expired token
    await supabase
      .from('users')
      .update({
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', user.id);

    throw ErrorTypes.badRequest('Reset token has expired. Please request a new one.');
  }

  // Hash new password
  const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

  // Update password and clear reset token
  await supabase
    .from('users')
    .update({
      password_hash,
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  // Log audit trail
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'PASSWORD_RESET_COMPLETED',
    table_name: 'users',
    record_id: user.id,
    new_values: { email: user.email }
  });

  res.json({
    success: true,
    message: 'Password has been reset successfully. You can now login with your new password.',
  });
}));

// GET /api/auth/validate-reset-token/:token - Validate if reset token is valid
router.get('/validate-reset-token/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw ErrorTypes.badRequest('Token is required');
  }

  // Find user by reset token
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_reset_expires')
    .eq('password_reset_token', token)
    .single();

  if (error || !user) {
    return res.json({
      valid: false,
      error: 'Invalid reset token',
    });
  }

  // Check if token has expired
  const now = new Date();
  const expiresAt = new Date(user.password_reset_expires);

  if (now > expiresAt) {
    return res.json({
      valid: false,
      error: 'Reset token has expired',
    });
  }

  res.json({
    valid: true,
    email: user.email,
  });
}));

export default router;
