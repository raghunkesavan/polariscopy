/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse by limiting the number of requests
 * from a single IP address within a specified time window.
 * 
 * Install: npm install express-rate-limit
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes for all API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for certain conditions (optional)
  skip: (req) => {
    // Skip rate limiting for internal health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Export endpoint rate limiter
 * 20 requests per 15 minutes for data export endpoints
 * More restrictive as exports are resource-intensive
 */
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many export requests. Please wait before requesting another export.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * PDF generation rate limiter
 * 10 requests per minute for PDF generation endpoints
 * Very restrictive as PDF generation is CPU-intensive
 */
export const pdfLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: {
    error: 'Too many PDF generation requests. Please wait a moment before generating another PDF.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for sensitive operations
 * 5 requests per minute for critical operations
 */
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per minute
  message: {
    error: 'Rate limit exceeded. Please wait before retrying.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Authentication rate limiter
 * Protects login/auth endpoints from brute force attacks
 * 50 requests per 15 minutes (generous for development/testing)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Slower down response to make brute force harder
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Reporting API rate limiter
 * For external reporting systems (Power BI, data teams)
 * 100 requests per hour - generous for scheduled refreshes
 */
export const reportingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit to 100 requests per hour
  message: {
    error: 'Reporting API rate limit exceeded. Please wait before making more requests.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
  // Note: Removed custom keyGenerator to use default (handles IPv6 properly)
  // Rate limiting by IP for reporting API
});

// Export default general limiter
export default apiLimiter;
