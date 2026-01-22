/**
 * Authentication Validation Tests
 * Tests the Joi validation schemas for auth endpoints
 */
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema
} from '../middleware/validation.js';

describe('Authentication Validation', () => {
  describe('Login Schema', () => {
    it('should validate valid login data', () => {
      const { error } = loginSchema.validate({
        email: 'test@example.com',
        password: 'Password123'
      });
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const { error } = loginSchema.validate({
        email: 'invalid-email',
        password: 'Password123'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('valid email');
    });

    it('should reject short password', () => {
      const { error } = loginSchema.validate({
        email: 'test@example.com',
        password: 'short'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('8 characters');
    });

    it('should reject missing email', () => {
      const { error } = loginSchema.validate({
        password: 'Password123'
      });
      expect(error).toBeDefined();
    });

    it('should reject missing password', () => {
      const { error } = loginSchema.validate({
        email: 'test@example.com'
      });
      expect(error).toBeDefined();
    });
  });

  describe('Register Schema', () => {
    it('should validate valid registration data', () => {
      const { error } = registerSchema.validate({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        access_level: 4
      });
      expect(error).toBeUndefined();
    });

    it('should enforce password complexity', () => {
      const { error } = registerSchema.validate({
        email: 'test@example.com',
        password: 'password123' // Missing uppercase
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('uppercase');
    });

    it('should reject invalid access level', () => {
      const { error } = registerSchema.validate({
        email: 'test@example.com',
        password: 'Password123',
        access_level: 6 // Out of range
      });
      expect(error).toBeDefined();
    });

    it('should allow optional name', () => {
      const { error } = registerSchema.validate({
        email: 'test@example.com',
        password: 'Password123'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('Change Password Schema', () => {
    it('should validate valid password change', () => {
      const { error } = changePasswordSchema.validate({
        current_password: 'OldPassword123',
        new_password: 'NewPassword123'
      });
      expect(error).toBeUndefined();
    });

    it('should enforce new password complexity', () => {
      const { error } = changePasswordSchema.validate({
        current_password: 'OldPassword123',
        new_password: 'weak'
      });
      expect(error).toBeDefined();
    });
  });

  describe('Reset Password Request Schema', () => {
    it('should validate valid email', () => {
      const { error } = resetPasswordRequestSchema.validate({
        email: 'test@example.com'
      });
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const { error } = resetPasswordRequestSchema.validate({
        email: 'not-an-email'
      });
      expect(error).toBeDefined();
    });
  });

  describe('Reset Password Schema', () => {
    it('should validate valid reset data', () => {
      const { error } = resetPasswordSchema.validate({
        token: 'valid-token-here',
        new_password: 'NewPassword123'
      });
      expect(error).toBeUndefined();
    });

    it('should require token', () => {
      const { error } = resetPasswordSchema.validate({
        new_password: 'NewPassword123'
      });
      expect(error).toBeDefined();
    });

    it('should enforce password complexity', () => {
      const { error } = resetPasswordSchema.validate({
        token: 'valid-token-here',
        new_password: 'weak'
      });
      expect(error).toBeDefined();
    });
  });
});
