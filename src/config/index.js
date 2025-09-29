const path = require('path');

// Load environment variables
require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 8081,
  env: process.env.NODE_ENV || 'development',
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
  },
  
  // Sefaria API configuration
  sefaria: {
    baseUrl: process.env.SEFARIA_BASE_URL || 'https://www.sefaria.org/api',
    timeout: parseInt(process.env.SEFARIA_TIMEOUT) || 5000,
    retryAttempts: parseInt(process.env.SEFARIA_RETRY_ATTEMPTS) || 3
  },

  // Supabase configuration (optional)
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    enabled: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  },
  
  // Session configuration
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL) || 60 * 60 * 1000, // 1 hour
    maxSessions: parseInt(process.env.MAX_SESSIONS) || 1000
  },
  
  // Security configuration
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    corsOrigin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production'
      ? false // Disable CORS in production unless explicitly set
      : ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004', 'http://127.0.0.1:3000', 'http://127.0.0.1:3003', 'http://127.0.0.1:3004'])
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },
  
  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 60 * 60 * 1000, // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100
  }
};

// Validation function
function validateConfig() {
  const errors = [];
  const warnings = [];

  // Critical validations
  if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key') {
    errors.push('OPENAI_API_KEY is required and must be set to a valid API key');
  }

  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (config.openai.maxTokens < 1 || config.openai.maxTokens > 128000) {
    errors.push('MAX_TOKENS must be between 1 and 128000 (updated for GPT-4 Turbo support)');
  }

  // Additional validations
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
  }

  if (config.env === 'production') {
    if (config.security.corsOrigin === '*' || Array.isArray(config.security.corsOrigin)) {
      warnings.push('CORS_ORIGIN should be explicitly set for production environment');
    }

    if (!process.env.DATABASE_DIR) {
      warnings.push('DATABASE_DIR not set, using default path which may not be suitable for production');
    }

    if (config.openai.temperature > 1.0 || config.openai.temperature < 0.0) {
      warnings.push('OPENAI_TEMPERATURE should be between 0.0 and 1.0');
    }
  }

  // Environment-specific validations
  if (config.sefaria.timeout < 1000) {
    warnings.push('SEFARIA_TIMEOUT is very low, may cause API timeouts');
  }

  if (config.session.maxAge < 60000) { // Less than 1 minute
    warnings.push('SESSION_MAX_AGE is very low, may cause frequent session expiration');
  }

  // Log warnings
  if (warnings.length > 0) {
    const logger = require('../utils/logger');
    warnings.forEach(warning => logger.warn(`Configuration warning: ${warning}`));
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Validate configuration on load
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;