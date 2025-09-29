const express = require('express');
const compression = require('compression');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');

// Import middleware
const {
    securityHeaders,
    rateLimiter,
    requestId,
    extractIP,
    securityLogger,
    corsMiddleware,
    validateContentType,
    requestSizeLimiter
} = require('./middleware/security');

const { sanitizeInputs, validateJsonBody } = require('./middleware/validation');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

// Create Express application
const app = express();

// Trust proxy if behind reverse proxy
app.set('trust proxy', 1);

// Request ID and IP extraction (must be first)
app.use(requestId);
app.use(extractIP);

// Security middleware
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(requestSizeLimiter);

// Compression middleware
app.use(compression());

// Request logging
app.use(logger.requestLogger());

// Rate limiting
app.use(rateLimiter);

// Security logging
app.use(securityLogger);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// JSON body validation
app.use(validateJsonBody);

// Input sanitization
app.use(sanitizeInputs);

// Content type validation for POST/PUT requests
app.use(validateContentType);

// Static file serving
app.use(express.static(path.join(__dirname, '../client/dist'), {
    maxAge: config.env === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
}));

// API routes
app.use('/', routes);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes - use standard error format
    if (req.path.startsWith('/api/')) {
        const error = new (require('./middleware/errorHandler').NotFoundError)('API endpoint');
        error.requestId = req.requestId;
        return next(error);
    }

    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

module.exports = app;/* trigger restart */
