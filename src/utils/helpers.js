const crypto = require('crypto');

/**
 * Generate a unique session ID (32-character hex string)
 */
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Sanitize user input to prevent XSS and other attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 2000); // Limit length
}

/**
 * Validate message content
 */
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message must be a non-empty string' };
  }
  
  if (message.length > 2000) {
    return { valid: false, error: 'Message too long (max 2000 characters)' };
  }
  
  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  return { valid: true };
}

/**
 * Create a delay for retry mechanisms
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff calculation
 */
function calculateBackoff(attempt, baseDelay = 1000, maxDelay = 10000) {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Safe JSON parsing
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Format error for API response
 */
function formatError(error, requestId = null) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      ...(isDevelopment && { details: error.stack }),
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId })
    }
  };
}

/**
 * Check if a string contains potential Torah references
 */
function containsTorahReference(text) {
  const torahBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Psalms', 'Proverbs', 'Job', 'Song of Songs', 'Ruth', 'Lamentations',
    'Ecclesiastes', 'Esther', 'Daniel', 'Ezra', 'Nehemiah',
    'I Chronicles', 'II Chronicles', 'Isaiah', 'Jeremiah', 'Ezekiel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ];
  
  const referencePattern = new RegExp(
    `(${torahBooks.join('|')})\\s+\\d+:\\d+(-\\d+)?`,
    'i'
  );
  
  return referencePattern.test(text);
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Check if an object is empty
 */
function isEmpty(obj) {
  return obj == null || Object.keys(obj).length === 0;
}

module.exports = {
  generateSessionId,
  generateRequestId,
  sanitizeInput,
  validateMessage,
  delay,
  calculateBackoff,
  safeJsonParse,
  formatError,
  containsTorahReference,
  truncateText,
  isEmpty
};