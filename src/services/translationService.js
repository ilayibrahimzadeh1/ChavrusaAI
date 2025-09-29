const { Translate } = require('@google-cloud/translate').v2;

class TranslationService {
  constructor() {
    this.translate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY
    });

    // Cache for translated content (in-memory, could be moved to Redis in production)
    this.cache = new Map();
    this.maxCacheSize = 1000; // Limit cache size
  }

  // Generate cache key
  getCacheKey(text, targetLang, sourceLang = 'auto') {
    return `${sourceLang}-${targetLang}-${this.hashString(text)}`;
  }

  // Simple hash function for cache keys
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Check cache first
  getCachedTranslation(text, targetLang, sourceLang = 'auto') {
    const key = this.getCacheKey(text, targetLang, sourceLang);
    const cached = this.cache.get(key);

    if (cached) {
      // Check if cached entry is still fresh (24 hours)
      const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;
      if (!isExpired) {
        return cached;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  // Cache translation result
  setCachedTranslation(text, targetLang, translatedText, detectedSourceLang, sourceLang = 'auto') {
    // Implement simple LRU by removing oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const key = this.getCacheKey(text, targetLang, sourceLang);
    this.cache.set(key, {
      translatedText,
      detectedSourceLang,
      timestamp: Date.now(),
      originalText: text,
      targetLang
    });
  }

  // Main translation function
  async translateText(text, targetLang, sourceLang = 'auto') {
    try {
      // Input validation
      if (!text || typeof text !== 'string' || !text.trim()) {
        return { translatedText: text, detectedSourceLang: sourceLang };
      }

      if (!targetLang || !['en', 'tr'].includes(targetLang)) {
        throw new Error('Invalid target language. Supported: en, tr');
      }

      // Check cache first
      const cached = this.getCachedTranslation(text, targetLang, sourceLang);
      if (cached) {
        console.log('📁 Translation cache hit');
        return {
          translatedText: cached.translatedText,
          detectedSourceLang: cached.detectedSourceLang
        };
      }

      console.log('🌐 Calling Google Translate API', {
        textLength: text.length,
        targetLang,
        sourceLang
      });

      // Call Google Translate API
      const [translation, metadata] = await this.translate.translate(text, {
        from: sourceLang === 'auto' ? undefined : sourceLang,
        to: targetLang
      });

      // Get detected source language from metadata if available
      const detectedSourceLang = metadata?.data?.translations?.[0]?.detectedSourceLanguage || sourceLang;

      // Cache the result
      this.setCachedTranslation(text, targetLang, translation, detectedSourceLang, sourceLang);

      return {
        translatedText: translation,
        detectedSourceLang
      };

    } catch (error) {
      console.error('❌ Translation failed:', error);

      // Enhanced error handling
      if (error.code === 403) {
        throw new Error('Translation API key is invalid or has insufficient permissions');
      } else if (error.code === 429) {
        throw new Error('Translation rate limit exceeded. Please try again later.');
      } else if (error.code === 400) {
        throw new Error('Invalid translation request. Please check the text and language codes.');
      } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(`Translation service error: ${error.message}`);
      }
    }
  }

  // Detect language of text
  async detectLanguage(text) {
    try {
      if (!text || typeof text !== 'string' || !text.trim()) {
        return { language: 'en', confidence: 0 };
      }

      console.log('🔍 Detecting language for text:', text.substring(0, 50) + '...');

      const [detections] = await this.translate.detect(text);
      const detection = Array.isArray(detections) ? detections[0] : detections;

      return {
        language: detection.language,
        confidence: detection.confidence || 0.95
      };

    } catch (error) {
      console.error('❌ Language detection failed:', error);

      // Fallback to English on error
      return { language: 'en', confidence: 0 };
    }
  }

  // Batch translate multiple texts
  async translateBatch(texts, targetLang, sourceLang = 'auto') {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        return [];
      }

      console.log('📦 Batch translating', texts.length, 'texts');

      const results = await Promise.allSettled(
        texts.map(text => this.translateText(text, targetLang, sourceLang))
      );

      return results.map((result, index) => ({
        original: texts[index],
        success: result.status === 'fulfilled',
        translated: result.status === 'fulfilled' ? result.value.translatedText : texts[index],
        detectedSourceLang: result.status === 'fulfilled' ? result.value.detectedSourceLang : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));

    } catch (error) {
      console.error('❌ Batch translation failed:', error);
      throw new Error(`Batch translation failed: ${error.message}`);
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' }
    ];
  }

  // Health check
  async healthCheck() {
    try {
      // Test with a simple translation
      await this.translateText('Hello', 'tr', 'en');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Translation cache cleared');
  }
}

// Create singleton instance
const translationService = new TranslationService();

module.exports = translationService;