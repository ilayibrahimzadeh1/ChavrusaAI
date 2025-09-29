const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Security headers middleware using helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", // Needed for inline scripts in current frontend
        "https://cdnjs.cloudflare.com" // For Font Awesome
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Needed for inline styles
        "https://cdnjs.cloudflare.com" // For Font Awesome
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", // Allow images from HTTPS sources
        "blob:" // For generated images
      ],
      fontSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com" // For Font Awesome fonts
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com", // OpenAI API
        "https://www.sefaria.org", // Sefaria API
        "https://ilnsaqfdpybhgucbsthd.supabase.co" // Supabase
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Rate limiting middleware
 */
const rateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000)
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000),
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Stricter rate limiting for AI endpoints
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests, please wait before asking another question.',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.body?.sessionId
    });
    
    res.status(429).json({
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'Too many AI requests, please wait before asking another question.',
        retryAfter: 60,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Request ID middleware for tracking
 */
const requestId = (req, res, next) => {
  const { generateRequestId } = require('../utils/helpers');
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * IP extraction middleware
 */
const extractIP = (req, res, next) => {
  // Get real IP address considering proxies
  req.realIP = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.ip;
  
  next();
};

/**
 * Security logging middleware
 */
const securityLogger = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript protocol
    /vbscript:/i,  // VBScript protocol
    /onload=/i,  // Event handlers
    /onerror=/i
  ];

  const url = req.url.toLowerCase();
  const userAgent = req.get('User-Agent') || '';
  const referer = req.get('Referer') || '';

  // Check for suspicious patterns
  const suspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || 
    pattern.test(userAgent) || 
    pattern.test(referer) ||
    (req.body && typeof req.body === 'object' && 
     JSON.stringify(req.body).toLowerCase().match(pattern))
  );

  if (suspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.realIP,
      method: req.method,
      url: req.url,
      userAgent,
      referer,
      requestId: req.requestId
    });
  }

  next();
};

/**
 * CORS middleware
 */
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.security.corsOrigin === '*'
    ? ['*']
    : Array.isArray(config.security.corsOrigin)
      ? config.security.corsOrigin
      : typeof config.security.corsOrigin === 'string'
        ? config.security.corsOrigin.split(',').map(o => o.trim())
        : [];

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Content type validation middleware
 */
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }
  }
  
  next();
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (req, res, next) => {
  const maxSize = 1024 * 1024; // 1MB
  
  if (req.get('Content-Length') && parseInt(req.get('Content-Length')) > maxSize) {
    logger.warn('Request size exceeded limit', {
      ip: req.realIP,
      size: req.get('Content-Length'),
      maxSize,
      requestId: req.requestId
    });
    
    return res.status(413).json({
      error: {
        code: 'REQUEST_TOO_LARGE',
        message: 'Request size exceeds maximum allowed limit',
        maxSize,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
  
  next();
};

module.exports = {
  securityHeaders,
  rateLimiter,
  aiRateLimiter,
  requestId,
  extractIP,
  securityLogger,
  corsMiddleware,
  validateContentType,
  requestSizeLimiter
};