const express = require('express');
const router = express.Router();
const translationService = require('../services/translationService');

// Rate limiting middleware specifically for translation
const rateLimit = require('express-rate-limit');

const translationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 translation requests per windowMs
  message: {
    success: false,
    error: 'Too many translation requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Input validation middleware
const validateTranslationInput = (req, res, next) => {
  const { text, targetLang } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      message: 'Text is required and must be a string'
    });
  }

  if (text.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Text too long',
      message: 'Text must be less than 5000 characters'
    });
  }

  if (!targetLang || !['en', 'tr'].includes(targetLang)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid target language',
      message: 'Target language must be either "en" or "tr"'
    });
  }

  next();
};

// POST /api/translate - Main translation endpoint
router.post('/', translationRateLimit, validateTranslationInput, async (req, res) => {
  try {
    const { text, targetLang, sourceLang = 'auto' } = req.body;

    console.log('🔄 Translation request:', {
      textLength: text.length,
      targetLang,
      sourceLang,
      userAgent: req.get('User-Agent')?.substring(0, 50)
    });

    // Check if API key is configured
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Translation service not configured',
        message: 'Google Translate API key is missing'
      });
    }

    const result = await translationService.translateText(text, targetLang, sourceLang);

    res.json({
      success: true,
      data: {
        translatedText: result.translatedText,
        detectedSourceLang: result.detectedSourceLang,
        originalText: text,
        targetLang,
        sourceLang,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Translation endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('rate limit')) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many translation requests. Please try again later.'
      });
    } else if (error.message.includes('API key')) {
      res.status(403).json({
        success: false,
        error: 'Authentication failed',
        message: 'Translation service authentication failed'
      });
    } else if (error.message.includes('network')) {
      res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'Translation service is temporarily unavailable'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Translation failed',
        message: error.message
      });
    }
  }
});

// POST /api/translate/detect - Language detection endpoint
router.post('/detect', translationRateLimit, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Text is required and must be a string'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long',
        message: 'Text for language detection must be less than 1000 characters'
      });
    }

    console.log('🔍 Language detection request for text length:', text.length);

    const result = await translationService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        language: result.language,
        confidence: result.confidence,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Language detection error:', error);

    res.status(500).json({
      success: false,
      error: 'Language detection failed',
      message: error.message
    });
  }
});

// POST /api/translate/batch - Batch translation endpoint
router.post('/batch', translationRateLimit, async (req, res) => {
  try {
    const { texts, targetLang, sourceLang = 'auto' } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Texts must be a non-empty array'
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Too many texts',
        message: 'Maximum 10 texts allowed per batch request'
      });
    }

    // Validate each text
    for (const text of texts) {
      if (!text || typeof text !== 'string' || text.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Invalid text in batch',
          message: 'Each text must be a string with less than 1000 characters'
        });
      }
    }

    if (!targetLang || !['en', 'tr'].includes(targetLang)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target language',
        message: 'Target language must be either "en" or "tr"'
      });
    }

    console.log('📦 Batch translation request for', texts.length, 'texts');

    const results = await translationService.translateBatch(texts, targetLang, sourceLang);

    res.json({
      success: true,
      data: {
        results,
        totalTexts: texts.length,
        successCount: results.filter(r => r.success).length,
        targetLang,
        sourceLang,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Batch translation error:', error);

    res.status(500).json({
      success: false,
      error: 'Batch translation failed',
      message: error.message
    });
  }
});

// GET /api/translate/languages - Get supported languages
router.get('/languages', (req, res) => {
  try {
    const languages = translationService.getSupportedLanguages();

    res.json({
      success: true,
      data: {
        languages,
        count: languages.length
      }
    });
  } catch (error) {
    console.error('❌ Get languages error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      message: error.message
    });
  }
});

// GET /api/translate/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await translationService.healthCheck();
    const cacheStats = translationService.getCacheStats();

    res.json({
      success: true,
      data: {
        service: health,
        cache: cacheStats,
        apiKeyConfigured: !!process.env.GOOGLE_TRANSLATE_API_KEY
      }
    });
  } catch (error) {
    console.error('❌ Translation health check error:', error);

    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// DELETE /api/translate/cache - Clear translation cache (admin endpoint)
router.delete('/cache', (req, res) => {
  try {
    translationService.clearCache();

    res.json({
      success: true,
      data: {
        message: 'Translation cache cleared successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Clear cache error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

module.exports = router;