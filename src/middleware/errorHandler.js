const logger = require('../utils/logger');
const { formatError } = require('../utils/helpers');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service unavailable') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

/**
 * Handle different types of errors
 */
const handleCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsError = (error) => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ValidationError(message);
};

const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message, errors);
};

const handleJWTError = () => {
  return new UnauthorizedError('Invalid token. Please log in again!');
};

const handleJWTExpiredError = () => {
  return new UnauthorizedError('Your token has expired! Please log in again.');
};

const handleOpenAIError = (error) => {
  if (error.status === 401) {
    return new ExternalServiceError('OpenAI', 'Invalid API key');
  }
  if (error.status === 429) {
    return new ExternalServiceError('OpenAI', 'Rate limit exceeded');
  }
  if (error.status === 503) {
    return new ExternalServiceError('OpenAI', 'Service temporarily unavailable');
  }
  return new ExternalServiceError('OpenAI', error.message || 'Unknown error');
};

const handleSefariaError = (error) => {
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new ExternalServiceError('Sefaria', 'Service unavailable');
  }
  if (error.response?.status === 404) {
    return new NotFoundError('Torah reference');
  }
  if (error.response?.status === 429) {
    return new ExternalServiceError('Sefaria', 'Rate limit exceeded');
  }
  return new ExternalServiceError('Sefaria', error.message || 'Unknown error');
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  logger.error('Development error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.realIP || req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId
  });

  res.status(err.statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      details: err.details || null,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      ...(err.service && { service: err.service }),
      ...(err.retryAfter && { retryAfter: err.retryAfter })
    }
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // Log error details for debugging
  logger.error('Production error', {
    error: err.message,
    code: err.code,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
    ip: req.realIP || req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    isOperational: err.isOperational
  });

  // Only send error details if it's an operational error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        ...(err.retryAfter && { retryAfter: err.retryAfter })
      }
    });
  } else {
    // Don't leak error details for programming errors
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong! Please try again later.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastError(error);
  if (err.code === 11000) error = handleDuplicateFieldsError(error);
  if (err.name === 'ValidationError') error = handleValidationError(error);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Handle OpenAI errors
  if (err.name === 'OpenAIError' || (err.response && err.response.data && err.response.data.error)) {
    error = handleOpenAIError(error);
  }
  
  // Handle Axios/HTTP errors (likely Sefaria API)
  if (err.isAxiosError || err.response) {
    error = handleSefariaError(error);
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ValidationError('Invalid JSON in request body');
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async error wrapper to catch async errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection', {
      error: err.message,
      stack: err.stack,
      promise: promise
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

/**
 * Graceful shutdown handler
 */
const handleGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Error recovery utilities
 */
const createCircuitBreaker = (service, threshold = 5, timeout = 60000) => {
  let failures = 0;
  let lastFailureTime = null;
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  return {
    async execute(fn) {
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > timeout) {
          state = 'HALF_OPEN';
          logger.info(`Circuit breaker for ${service} moving to HALF_OPEN`);
        } else {
          throw new ExternalServiceError(service, 'Circuit breaker is OPEN');
        }
      }

      try {
        const result = await fn();
        
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
          logger.info(`Circuit breaker for ${service} moving to CLOSED`);
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();
        
        if (failures >= threshold) {
          state = 'OPEN';
          logger.warn(`Circuit breaker for ${service} moving to OPEN`, {
            failures,
            threshold
          });
        }
        
        throw error;
      }
    },

    getState() {
      return { state, failures, lastFailureTime };
    }
  };
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ExternalServiceError,
  RateLimitError,
  
  // Middleware
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  
  // Process handlers
  handleUnhandledRejection,
  handleUncaughtException,
  handleGracefulShutdown,
  
  // Utilities
  createCircuitBreaker
};