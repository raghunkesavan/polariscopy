/**
 * Centralized logging utility
 * Logs are only shown in development mode unless it's an error
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true';

class Logger {
  constructor(context = '') {
    this.context = context;
  }

  _log(level, message, data) {
    // Always log errors, even in production
    if (!isDevelopment && level !== LOG_LEVELS.ERROR) return;
    
    const timestamp = new Date().toISOString().substring(11, 23); // HH:mm:ss.SSS
    const prefix = this.context ? `[${this.context}]` : '';
    const fullMessage = `${timestamp} ${prefix} ${message}`;
    
    if (data !== undefined) {
      console[level](fullMessage, data);
    } else {
      console[level](fullMessage);
    }
  }

  /**
   * Log error message (always shown, even in production)
   */
  error(message, data) {
    this._log(LOG_LEVELS.ERROR, message, data);
  }

  /**
   * Log warning message (dev only)
   */
  warn(message, data) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  /**
   * Log info message (dev only)
   */
  info(message, data) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  /**
   * Log debug message (dev only)
   */
  debug(message, data) {
    this._log(LOG_LEVELS.DEBUG, message, data);
  }
}

/**
 * Create a logger instance for a specific context
 * @param {string} context - Context name (e.g., 'BTLCalculator', 'QuotesList')
 * @returns {Logger} Logger instance
 */
export function createLogger(context) {
  return new Logger(context);
}

// Export a default logger
export default new Logger();
