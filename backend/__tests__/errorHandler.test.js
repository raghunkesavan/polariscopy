/**
 * Error Handler Tests
 * Tests the centralized error handling middleware
 */
import { describe, it, expect } from 'vitest';
import { AppError, ErrorTypes } from '../middleware/errorHandler.js';

describe('Error Handler Middleware', () => {
  describe('AppError Class', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should default to 500 status code', () => {
      const error = new AppError('Server error');
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should include details when provided', () => {
      const details = { field: 'email', issue: 'invalid' };
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('ErrorTypes Factory', () => {
    it('should create notFound error', () => {
      const error = ErrorTypes.notFound('User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create unauthorized error', () => {
      const error = ErrorTypes.unauthorized('Invalid credentials');
      
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create forbidden error', () => {
      const error = ErrorTypes.forbidden('No permission');
      
      expect(error.message).toBe('No permission');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create badRequest error', () => {
      const error = ErrorTypes.badRequest('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });

    it('should create conflict error', () => {
      const error = ErrorTypes.conflict('Email');
      
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should create validation error', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = ErrorTypes.validation('Validation failed', details);
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(details);
    });

    it('should create database error', () => {
      const error = ErrorTypes.database('Connection failed');
      
      expect(error.message).toBe('Connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });

    it('should create internal error', () => {
      const error = ErrorTypes.internal('Something went wrong');
      
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });
});
