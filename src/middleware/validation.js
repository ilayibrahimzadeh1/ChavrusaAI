const { validateMessage, sanitizeInput } = require('../utils/helpers');
const { isValidRabbi } = require('../config/rabbis');
const logger = require('../utils/logger');

/**
 * Validate chat message request
 */
const validateChatMessage = (req, res, next) => {
  const { message, sessionId, rabbi } = req.body;

  // Validate message
  if (!message) {
    return res.status(400).json({
      error: {
        code: 'MISSING_MESSAGE',
        message: 'Message is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  const messageValidation = validateMessage(message);
  if (!messageValidation.valid) {
    return res.status(400).json({
      error: {
        code: 'INVALID_MESSAGE',
        message: messageValidation.error,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Validate session ID format (accept both 32-char hex and UUID formats)
  if (sessionId && !/^([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.test(sessionId)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_SESSION_ID',
        message: 'Session ID must be a valid session identifier',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Validate rabbi if provided
  if (rabbi && !isValidRabbi(rabbi)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_RABBI',
        message: 'Invalid rabbi selection',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Sanitize inputs
  req.body.message = sanitizeInput(message);
  if (rabbi) {
    req.body.rabbi = sanitizeInput(rabbi);
  }

  logger.debug('Chat message validation passed', {
    messageLength: req.body.message.length,
    sessionId,
    rabbi,
    requestId: req.requestId
  });

  next();
};

/**
 * Validate session creation request
 */
const validateSessionCreation = (req, res, next) => {
  const { rabbi } = req.body;

  // Rabbi is optional for session creation
  if (rabbi && !isValidRabbi(rabbi)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_RABBI',
        message: 'Invalid rabbi selection',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  if (rabbi) {
    req.body.rabbi = sanitizeInput(rabbi);
  }

  next();
};

/**
 * Validate session ID parameter
 */
const validateSessionId = (req, res, next) => {
  const sessionId = req.params.sessionId || req.body.sessionId;

  if (!sessionId) {
    return res.status(400).json({
      error: {
        code: 'MISSING_SESSION_ID',
        message: 'Session ID is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  if (!/^([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.test(sessionId)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_SESSION_ID',
        message: 'Session ID must be a valid session identifier',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  next();
};

/**
 * Validate rabbi selection request
 */
const validateRabbiSelection = (req, res, next) => {
  const { rabbi, sessionId } = req.body;

  if (!rabbi) {
    return res.status(400).json({
      error: {
        code: 'MISSING_RABBI',
        message: 'Rabbi selection is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  if (!isValidRabbi(rabbi)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_RABBI',
        message: 'Invalid rabbi selection',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  if (!sessionId) {
    return res.status(400).json({
      error: {
        code: 'MISSING_SESSION_ID',
        message: 'Session ID is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  if (!/^([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.test(sessionId)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_SESSION_ID',
        message: 'Session ID must be a valid session identifier',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Sanitize inputs
  req.body.rabbi = sanitizeInput(rabbi);

  next();
};

/**
 * Validate Torah reference request
 */
const validateReferenceRequest = (req, res, next) => {
  const { reference } = req.params;

  if (!reference) {
    return res.status(400).json({
      error: {
        code: 'MISSING_REFERENCE',
        message: 'Torah reference is required',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Basic reference format validation
  const referencePattern = /^[A-Za-z\s]+\s+\d+:\d+(-\d+)?$/;
  if (!referencePattern.test(reference)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REFERENCE_FORMAT',
        message: 'Reference must be in format "Book Chapter:Verse" (e.g., "Genesis 1:1")',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Sanitize reference
  req.params.reference = sanitizeInput(reference);

  next();
};

/**
 * General input sanitization middleware
 */
const sanitizeInputs = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeInput(value);
      }
    }
  }

  // Sanitize body parameters (for non-JSON content)
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string' && key !== 'message') {
        // Don't sanitize message content here as it's handled specifically
        req.body[key] = sanitizeInput(value);
      }
    }
  }

  next();
};

/**
 * Validate JSON body structure
 */
const validateJsonBody = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: {
          code: 'INVALID_JSON_BODY',
          message: 'Request body must be valid JSON object',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }
  }
  
  next();
};

/**
 * Validate required fields
 */
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }
    
    next();
  };
};

/**
 * Validate field types
 */
const validateFieldTypes = (fieldTypes) => {
  return (req, res, next) => {
    const typeErrors = [];
    
    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      if (req.body[field] !== undefined) {
        const actualType = typeof req.body[field];
        if (actualType !== expectedType) {
          typeErrors.push(`${field} must be ${expectedType}, got ${actualType}`);
        }
      }
    }
    
    if (typeErrors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FIELD_TYPES',
          message: 'Invalid field types',
          errors: typeErrors,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }
    
    next();
  };
};

module.exports = {
  validateChatMessage,
  validateSessionCreation,
  validateSessionId,
  validateRabbiSelection,
  validateReferenceRequest,
  sanitizeInputs,
  validateJsonBody,
  validateRequiredFields,
  validateFieldTypes
};