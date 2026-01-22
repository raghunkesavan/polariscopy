/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses across all API endpoints
 */

/**
 * Custom Application Error Class
 * Use this for operational errors that we expect and handle gracefully
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguish from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory functions
 */
export const ErrorTypes = {
  notFound: (resource = 'Resource') => 
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  
  unauthorized: (message = 'Unauthorized access') =>
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message = 'Insufficient permissions') =>
    new AppError(message, 403, 'FORBIDDEN'),
  
  badRequest: (message = 'Invalid request', details = null) =>
    new AppError(message, 400, 'BAD_REQUEST', details),
  
  conflict: (resource = 'Resource') =>
    new AppError(`${resource} already exists`, 409, 'CONFLICT'),
  
  validation: (message = 'Validation failed', details = null) =>
    new AppError(message, 400, 'VALIDATION_ERROR', details),
  
  database: (message = 'Database operation failed') =>
    new AppError(message, 500, 'DATABASE_ERROR'),
  
  internal: (message = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR')
};

/**
 * Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert non-AppError errors to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    
    // Supabase/Postgres errors
    if (error.code === '23505') {
      // Duplicate key violation
      error = new AppError('Resource already exists', 409, 'DUPLICATE_ENTRY');
    } else if (error.code === '23503') {
      // Foreign key violation
      error = new AppError('Referenced resource not found', 400, 'INVALID_REFERENCE');
    } else if (error.code === '22P02') {
      // Invalid text representation
      error = new AppError('Invalid data format', 400, 'INVALID_FORMAT');
    } else if (error.name === 'ValidationError') {
      // Validation errors
      error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.details);
    } else if (error.name === 'CastError') {
      // Invalid ID format
      error = new AppError('Invalid ID format', 400, 'INVALID_ID');
    } else {
      // Generic server error
      error = new AppError(
        error.message || 'Internal server error',
        error.statusCode || 500,
        error.code || 'INTERNAL_ERROR'
      );
    }
  }

  // Log error for debugging (but not to client)
  if (error.statusCode >= 500) {
  } else if (process.env.NODE_ENV === 'development') {
  }

  // Build error response
  const response = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    }
  };

  // Add details if available
  if (error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  // Send response
  res.status(error.statusCode || 500).json(response);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found Handler
 * Catches requests to non-existent routes
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  ));
};
