const supabaseService = require('../services/supabaseClient');
const logger = require('../utils/logger');

/**
 * Authentication middleware for protecting routes
 * Validates JWT tokens and adds user context to requests
 */

/**
 * Main authentication middleware
 * Validates JWT token and sets req.user with user information
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization header is required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Valid token is required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    // Validate token with Supabase
    const { user, error } = await supabaseService.validateToken(token);

    if (error || !user) {
      logger.warn('Authentication failed', {
        error: error?.message,
        ip: req.realIP || req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId
      });

      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    // Add user information to request
    req.user = {
      id: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at ? true : false,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
      userMetadata: user.user_metadata || {}
    };

    // Log successful authentication
    logger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      requestId: req.requestId
    });

    next();

  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });

    return res.status(500).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Internal authentication error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user context if token is provided, but doesn't require authentication
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user context
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token || token === 'undefined' || token === 'null') {
      req.user = null;
      return next();
    }

    // Try to validate token, but don't fail if invalid
    const { user, error } = await supabaseService.validateToken(token);

    if (error || !user) {
      req.user = null;
      logger.debug('Optional auth failed, continuing without user context', {
        error: error?.message,
        requestId: req.requestId
      });
    } else {
      req.user = {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
        userMetadata: user.user_metadata || {}
      };

      logger.debug('Optional auth successful', {
        userId: user.id,
        requestId: req.requestId
      });
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error', {
      error: error.message,
      requestId: req.requestId
    });

    // Don't fail the request, just continue without user context
    req.user = null;
    next();
  }
};

/**
 * Admin-only authentication middleware
 * Requires valid token and admin privileges
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // First run normal auth
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if authentication failed
    if (!req.user) {
      return; // Response already sent by authMiddleware
    }

    // Check for admin privileges
    const isAdmin = req.user.userMetadata?.role === 'admin' ||
                   req.user.userMetadata?.is_admin === true;

    if (!isAdmin) {
      logger.warn('Admin access denied', {
        userId: req.user.id,
        email: req.user.email,
        requestId: req.requestId
      });

      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    logger.debug('Admin access granted', {
      userId: req.user.id,
      email: req.user.email,
      requestId: req.requestId
    });

    next();

  } catch (error) {
    logger.error('Admin auth middleware error', {
      error: error.message,
      requestId: req.requestId
    });

    return res.status(500).json({
      error: {
        code: 'ADMIN_AUTH_ERROR',
        message: 'Internal authentication error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminAuthMiddleware
};