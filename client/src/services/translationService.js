import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

class TranslationService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Generate cache key
  getCacheKey(text, targetLang, sourceLang = 'auto') {
    return `${sourceLang}-${targetLang}-${text}`;
  }

  // Check if translation is already cached
  getCachedTranslation(text, targetLang, sourceLang = 'auto') {
    const key = this.getCacheKey(text, targetLang, sourceLang);
    return this.cache.get(key);
  }

  // Cache translation result
  setCachedTranslation(text, targetLang, translatedText, sourceLang = 'auto') {
    const key = this.getCacheKey(text, targetLang, sourceLang);
    this.cache.set(key, {
      translatedText,
      timestamp: Date.now(),
      sourceLang,
      targetLang
    });
  }

  // Translate single text
  async translateText(text, targetLang, sourceLang = 'auto') {
    if (!text || !text.trim()) {
      return text;
    }

    // Return same text if target language is same as source
    if (sourceLang === targetLang) {
      return text;
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, targetLang, sourceLang);
    if (cached) {
      return cached.translatedText;
    }

    // Check if request is already pending
    const requestKey = this.getCacheKey(text, targetLang, sourceLang);
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    // Create new translation request
    const translationPromise = this.performTranslation(text, targetLang, sourceLang);
    this.pendingRequests.set(requestKey, translationPromise);

    try {
      const result = await translationPromise;
      this.pendingRequests.delete(requestKey);
      return result;
    } catch (error) {
      this.pendingRequests.delete(requestKey);
      throw error;
    }
  }

  // Perform actual translation via backend API
  async performTranslation(text, targetLang, sourceLang = 'auto') {
    try {
      const response = await axios.post(`${API_BASE_URL}/translate`, {
        text,
        targetLang,
        sourceLang
      });

      const { translatedText, detectedSourceLang } = response.data.data;

      // Cache the result
      this.setCachedTranslation(text, targetLang, translatedText, detectedSourceLang || sourceLang);

      return translatedText;
    } catch (error) {
      console.error('Translation failed:', error);

      // Fallback: return original text
      if (error.response?.status === 429) {
        throw new Error('Translation rate limit exceeded. Please try again later.');
      } else if (error.response?.status >= 500) {
        throw new Error('Translation service temporarily unavailable.');
      } else {
        throw new Error('Translation failed. Please try again.');
      }
    }
  }

  // Translate multiple texts in batch
  async translateBatch(texts, targetLang, sourceLang = 'auto') {
    const translations = await Promise.allSettled(
      texts.map(text => this.translateText(text, targetLang, sourceLang))
    );

    return translations.map((result, index) => ({
      original: texts[index],
      translated: result.status === 'fulfilled' ? result.value : texts[index],
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  // Get supported languages
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
    ];
  }

  // Detect language
  async detectLanguage(text) {
    try {
      const response = await axios.post(`${API_BASE_URL}/translate/detect`, { text });
      return response.data.data.language;
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en'; // Default to English
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;