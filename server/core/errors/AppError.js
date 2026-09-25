/**
 * Custom Operational Application Error Class
 * Extends the native Node.js Error object.
 *
 * @class AppError
 * @extends {Error}
 */
class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g., 400, 401, 403, 404, 409, 422, 500)
   * @param {string} errorCode - Standardized domain error code (e.g., 'ERR_AUTH_001')
   * @param {string} message - Sanitized, user-safe error message
   * @param {boolean} [isOperational=true] - Indicates if error is known/expected vs unexpected system crash
   */
  constructor(statusCode, errorCode, message, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    // Capture clean stack trace omitting constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
