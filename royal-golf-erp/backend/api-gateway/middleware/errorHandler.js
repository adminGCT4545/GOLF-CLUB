/**
 * Global Error Handler Middleware
 * Handles all errors in the application and returns appropriate responses
 */

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    const message = 'Duplicate entry detected';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23503') { // Foreign key violation
    const message = 'Referenced record does not exist';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23502') { // Not null violation
    const message = 'Required field is missing';
    error = { message, statusCode: 400 };
  }

  // Redis connection errors
  if (err.code === 'ECONNREFUSED' && err.port === 6379) {
    const message = 'Cache service temporarily unavailable';
    error = { message, statusCode: 503 };
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' && err.port === 5432) {
    const message = 'Database service temporarily unavailable';
    error = { message, statusCode: 503 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = { message, statusCode: 413 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Network timeout errors
  if (err.code === 'ECONNABORTED') {
    const message = 'Request timeout';
    error = { message, statusCode: 408 };
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Determine if we should show stack trace (only in development)
  const showStack = process.env.NODE_ENV === 'development';

  // Create error response object
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(showStack && { stack: err.stack }),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // Add additional error details for specific status codes
  if (statusCode === 400) {
    errorResponse.error.type = 'ValidationError';
  } else if (statusCode === 401) {
    errorResponse.error.type = 'AuthenticationError';
  } else if (statusCode === 403) {
    errorResponse.error.type = 'AuthorizationError';
  } else if (statusCode === 404) {
    errorResponse.error.type = 'NotFoundError';
  } else if (statusCode === 409) {
    errorResponse.error.type = 'ConflictError';
  } else if (statusCode === 429) {
    errorResponse.error.type = 'RateLimitError';
  } else if (statusCode >= 500) {
    errorResponse.error.type = 'InternalServerError';
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not Found Handler
 * Handles 404 errors for routes that don't exist
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Validation Error Handler
 * Creates standardized validation error responses
 */
const validationError = (errors) => {
  const error = new Error('Validation failed');
  error.statusCode = 400;
  error.details = errors;
  return error;
};

/**
 * Custom Error Class
 * For creating custom errors with specific status codes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database Error Handler
 * Handles database-specific errors
 */
const handleDatabaseError = (err) => {
  if (err.code === 'ECONNREFUSED') {
    return new AppError('Database connection failed', 503);
  }
  
  if (err.code === '23505') {
    return new AppError('Duplicate entry detected', 400);
  }
  
  if (err.code === '23503') {
    return new AppError('Referenced record does not exist', 400);
  }
  
  if (err.code === '23502') {
    return new AppError('Required field is missing', 400);
  }
  
  return new AppError('Database error occurred', 500);
};

/**
 * Service Unavailable Handler
 * For when external services are down
 */
const serviceUnavailable = (serviceName) => {
  return new AppError(`${serviceName} service is currently unavailable`, 503);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  validationError,
  AppError,
  handleDatabaseError,
  serviceUnavailable
};
