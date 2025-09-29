const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { delay, calculateBackoff } = require('../utils/helpers');

class SefariaService {
  constructor() {
    this.baseUrl = config.sefaria.baseUrl;
    this.timeout = config.sefaria.timeout;
    this.retryAttempts = config.sefaria.retryAttempts;
    this.cache = new Map();
    this.cacheMaxSize = config.cache.maxSize;
    this.cacheTtl = config.cache.ttl;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Torah-Learning-App/1.0'
      }
    });

    // Torah books mapping for reference validation
    this.torahBooks = {
      'Genesis': 'Genesis',
      'Exodus': 'Exodus', 
      'Leviticus': 'Leviticus',
      'Numbers': 'Numbers',
      'Deuteronomy': 'Deuteronomy',
      'Psalms': 'Psalms',
      'Proverbs': 'Proverbs',
      'Job': 'Job',
      'Song of Songs': 'Song_of_Songs',
      'Ruth': 'Ruth',
      'Lamentations': 'Lamentations',
      'Ecclesiastes': 'Ecclesiastes',
      'Esther': 'Esther',
      'Daniel': 'Daniel',
      'Ezra': 'Ezra',
      'Nehemiah': 'Nehemiah',
      'I Chronicles': 'I_Chronicles',
      'II Chronicles': 'II_Chronicles',
      'Isaiah': 'Isaiah',
      'Jeremiah': 'Jeremiah',
      'Ezekiel': 'Ezekiel',
      'Hosea': 'Hosea',
      'Joel': 'Joel',
      'Amos': 'Amos',
      'Obadiah': 'Obadiah',
      'Jonah': 'Jonah',
      'Micah': 'Micah',
      'Nahum': 'Nahum',
      'Habakkuk': 'Habakkuk',
      'Zephaniah': 'Zephaniah',
      'Haggai': 'Haggai',
      'Zechariah': 'Zechariah',
      'Malachi': 'Malachi'
    };

    this.startCacheCleanup();
  }

  /**
   * Parse a Torah reference string into components
   * @param {string} referenceString - e.g., "Genesis 1:1" or "Psalms 23:1-6"
   * @returns {Object|null} Parsed reference object
   */
  parseReference(referenceString) {
    if (!referenceString || typeof referenceString !== 'string') {
      return null;
    }

    // Enhanced regex to match various reference formats
    const patterns = [
      // Standard format: "Genesis 1:1" or "Genesis 1:1-3"
      /^(.*?)\s+(\d+):(\d+)(?:-(\d+))?$/,
      // Chapter only: "Genesis 1"
      /^(.*?)\s+(\d+)$/
    ];

    for (const pattern of patterns) {
      const match = referenceString.trim().match(pattern);
      if (match) {
        const bookName = match[1].trim();
        const chapter = parseInt(match[2]);
        const startVerse = match[3] ? parseInt(match[3]) : null;
        const endVerse = match[4] ? parseInt(match[4]) : startVerse;

        // Validate book name
        if (!this.torahBooks[bookName]) {
          continue;
        }

        return {
          book: bookName,
          sefariaBook: this.torahBooks[bookName],
          chapter,
          startVerse,
          endVerse,
          original: referenceString
        };
      }
    }

    return null;
  }

  /**
   * Validate if a reference string is valid
   * @param {string} reference 
   * @returns {boolean}
   */
  validateReference(reference) {
    return this.parseReference(reference) !== null;
  }

  /**
   * Normalize a reference for consistent formatting
   * @param {string} reference 
   * @returns {string|null}
   */
  normalizeReference(reference) {
    const parsed = this.parseReference(reference);
    if (!parsed) {
      return null;
    }

    if (parsed.startVerse) {
      if (parsed.endVerse && parsed.endVerse !== parsed.startVerse) {
        return `${parsed.book} ${parsed.chapter}:${parsed.startVerse}-${parsed.endVerse}`;
      } else {
        return `${parsed.book} ${parsed.chapter}:${parsed.startVerse}`;
      }
    } else {
      return `${parsed.book} ${parsed.chapter}`;
    }
  }

  /**
   * Build Sefaria API URL for a reference
   * @param {Object} parsedRef 
   * @returns {string}
   */
  buildSefariaUrl(parsedRef) {
    let url = `/texts/${parsedRef.sefariaBook}.${parsedRef.chapter}`;
    
    if (parsedRef.startVerse) {
      url += `.${parsedRef.startVerse}`;
      if (parsedRef.endVerse && parsedRef.endVerse !== parsedRef.startVerse) {
        url += `-${parsedRef.endVerse}`;
      }
    }

    return url;
  }

  /**
   * Get cached data
   * @param {string} key 
   * @returns {Object|null}
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      logger.debug('Cache hit', { key });
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
    }

    return null;
  }

  /**
   * Set data in cache
   * @param {string} key 
   * @param {Object} data 
   */
  setCache(key, data) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    logger.debug('Data cached', { key, cacheSize: this.cache.size });
  }

  /**
   * Make API request with retry logic
   * @param {string} url 
   * @param {number} attempt 
   * @returns {Object}
   */
  async makeRequest(url, attempt = 0) {
    try {
      logger.debug('Making Sefaria API request', { url, attempt });
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      logger.warn('Sefaria API request failed', { 
        url, 
        attempt, 
        error: error.message,
        status: error.response?.status 
      });

      if (attempt < this.retryAttempts - 1) {
        const backoffDelay = calculateBackoff(attempt);
        logger.info('Retrying Sefaria API request', { url, attempt: attempt + 1, delay: backoffDelay });
        await delay(backoffDelay);
        return this.makeRequest(url, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Get text by reference
   * @param {string} reference 
   * @returns {Object|null}
   */
  async getTextByReference(reference) {
    try {
      const parsedRef = this.parseReference(reference);
      if (!parsedRef) {
        logger.warn('Invalid reference format', { reference });
        return null;
      }

      const normalizedRef = this.normalizeReference(reference);
      const cacheKey = `text:${normalizedRef}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const url = this.buildSefariaUrl(parsedRef);
      const data = await this.makeRequest(url);

      if (!data || !data.text) {
        logger.warn('No text data received from Sefaria', { reference, url });
        return null;
      }

      const result = {
        reference: normalizedRef,
        originalReference: reference,
        book: parsedRef.book,
        chapter: parsedRef.chapter,
        verse: parsedRef.startVerse,
        text: Array.isArray(data.text) ? data.text.join(' ') : data.text,
        hebrew: Array.isArray(data.he) ? data.he.join(' ') : data.he,
        translation: data.text,
        source: 'sefaria',
        url: `https://www.sefaria.org/${parsedRef.sefariaBook}.${parsedRef.chapter}${parsedRef.startVerse ? '.' + parsedRef.startVerse : ''}`,
        retrievedAt: new Date().toISOString()
      };

      // Cache the result
      this.setCache(cacheKey, result);

      logger.info('Text retrieved from Sefaria', { 
        reference: normalizedRef,
        textLength: result.text?.length || 0 
      });

      return result;

    } catch (error) {
      logger.error('Error retrieving text from Sefaria', { 
        reference, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Search for texts
   * @param {string} query 
   * @param {Object} options 
   * @returns {Array}
   */
  async searchTexts(query, options = {}) {
    try {
      const cacheKey = `search:${query}:${JSON.stringify(options)}`;
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams({
        q: query,
        ...options
      });

      const url = `/search-wrapper?${params.toString()}`;
      const data = await this.makeRequest(url);

      const results = data.hits || [];
      
      // Cache the results
      this.setCache(cacheKey, results);

      logger.info('Search completed', { 
        query, 
        resultCount: results.length 
      });

      return results;

    } catch (error) {
      logger.error('Error searching Sefaria', { 
        query, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Get commentary for a reference
   * @param {string} reference 
   * @param {string} commentator 
   * @returns {Object|null}
   */
  async getCommentary(reference, commentator = 'Rashi') {
    try {
      const parsedRef = this.parseReference(reference);
      if (!parsedRef) {
        return null;
      }

      const cacheKey = `commentary:${reference}:${commentator}`;
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const url = `/texts/${commentator}_on_${parsedRef.sefariaBook}.${parsedRef.chapter}${parsedRef.startVerse ? '.' + parsedRef.startVerse : ''}`;
      const data = await this.makeRequest(url);

      if (!data || !data.text) {
        return null;
      }

      const result = {
        reference,
        commentator,
        text: Array.isArray(data.text) ? data.text.join(' ') : data.text,
        hebrew: Array.isArray(data.he) ? data.he.join(' ') : data.he,
        source: 'sefaria',
        retrievedAt: new Date().toISOString()
      };

      // Cache the result
      this.setCache(cacheKey, result);

      logger.info('Commentary retrieved', { 
        reference, 
        commentator,
        textLength: result.text?.length || 0 
      });

      return result;

    } catch (error) {
      logger.error('Error retrieving commentary', { 
        reference, 
        commentator, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Detect Torah references in text
   * @param {string} text 
   * @returns {Array} Array of detected references
   */
  detectReferences(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const references = [];
    const bookNames = Object.keys(this.torahBooks).join('|');
    
    // Pattern to match references like "Genesis 1:1" or "Psalms 23:1-6"
    const referencePattern = new RegExp(
      `(${bookNames})\\s+(\\d+):(\\d+)(?:-(\\d+))?`,
      'gi'
    );

    let match;
    while ((match = referencePattern.exec(text)) !== null) {
      const reference = match[0];
      const normalized = this.normalizeReference(reference);
      
      if (normalized && !references.includes(normalized)) {
        references.push(normalized);
      }
    }

    logger.debug('References detected', { 
      textLength: text.length, 
      referencesFound: references.length,
      references 
    });

    return references;
  }

  /**
   * Start cache cleanup timer
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > this.cacheTtl) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.debug('Cache cleanup completed', { 
          cleanedEntries: cleanedCount,
          remainingEntries: this.cache.size 
        });
      }
    }, this.cacheTtl);
  }

  /**
   * Get service health information
   * @returns {Object}
   */
  getHealthInfo() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      cacheSize: this.cache.size,
      cacheMaxSize: this.cacheMaxSize,
      cacheTtl: this.cacheTtl,
      supportedBooks: Object.keys(this.torahBooks).length
    };
  }

  /**
   * Get complete library index (Dynamic Discovery)
   * @returns {Object} Complete library index organized by category
   */
  async getIndex() {
    try {
      const cacheKey = 'library-index';

      // Check cache first (longer TTL for index since it changes infrequently)
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const data = await this.makeRequest('/index');

      if (!data) {
        logger.warn('No index data received from Sefaria');
        return null;
      }

      // Cache the index with extended TTL (24 hours)
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      });

      logger.info('Library index retrieved from Sefaria', {
        categoriesCount: Object.keys(data).length
      });

      return data;

    } catch (error) {
      logger.error('Error retrieving library index', { error: error.message });
      return null;
    }
  }

  /**
   * Get available versions/editions for a book
   * @param {string} book - Book name
   * @returns {Array} Available versions
   */
  async getVersions(book) {
    try {
      const cacheKey = `versions:${book}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const url = `/texts/versions/${encodeURIComponent(book)}`;
      const data = await this.makeRequest(url);

      if (!data || !Array.isArray(data)) {
        logger.warn('No versions data received from Sefaria', { book });
        return [];
      }

      // Cache the results
      this.setCache(cacheKey, data);

      logger.info('Text versions retrieved', {
        book,
        versionCount: data.length
      });

      return data;

    } catch (error) {
      logger.error('Error retrieving text versions', {
        book,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get related content for a reference
   * @param {string} reference - Text reference
   * @returns {Object} Related content (links, sheets, notes, media, topics)
   */
  async getRelated(reference) {
    try {
      const parsedRef = this.parseReference(reference);
      if (!parsedRef) {
        return null;
      }

      const cacheKey = `related:${reference}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Build Sefaria reference format
      let sefariaRef = `${parsedRef.sefariaBook}.${parsedRef.chapter}`;
      if (parsedRef.startVerse) {
        sefariaRef += `.${parsedRef.startVerse}`;
        if (parsedRef.endVerse && parsedRef.endVerse !== parsedRef.startVerse) {
          sefariaRef += `-${parsedRef.endVerse}`;
        }
      }

      const url = `/related/${encodeURIComponent(sefariaRef)}`;
      const data = await this.makeRequest(url);

      if (!data) {
        logger.warn('No related content received from Sefaria', { reference });
        return null;
      }

      const result = {
        reference,
        sefariaReference: sefariaRef,
        links: data.links || [],
        sheets: data.sheets || [],
        notes: data.notes || [],
        media: data.media || [],
        manuscripts: data.manuscripts || [],
        webpages: data.webpages || [],
        topics: data.topics || [],
        retrievedAt: new Date().toISOString()
      };

      // Cache the results
      this.setCache(cacheKey, result);

      logger.info('Related content retrieved', {
        reference,
        linksCount: result.links.length,
        topicsCount: result.topics.length
      });

      return result;

    } catch (error) {
      logger.error('Error retrieving related content', {
        reference,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get available topics
   * @param {Object} options - Search options
   * @returns {Array} Available topics
   */
  async getTopics(options = {}) {
    try {
      const cacheKey = `topics:${JSON.stringify(options)}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams(options);
      const url = `/topics${params.toString() ? '?' + params.toString() : ''}`;
      const data = await this.makeRequest(url);

      if (!data || !Array.isArray(data)) {
        logger.warn('No topics data received from Sefaria');
        return [];
      }

      // Cache the results
      this.setCache(cacheKey, data);

      logger.info('Topics retrieved', {
        topicsCount: data.length
      });

      return data;

    } catch (error) {
      logger.error('Error retrieving topics', { error: error.message });
      return [];
    }
  }

  /**
   * Get study calendars (Daf Yomi, etc.)
   * @returns {Object} Available study calendars
   */
  async getCalendars() {
    try {
      const cacheKey = 'study-calendars';

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const data = await this.makeRequest('/calendars');

      if (!data) {
        logger.warn('No calendars data received from Sefaria');
        return null;
      }

      // Cache the results with extended TTL (12 hours)
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: 12 * 60 * 60 * 1000 // 12 hours
      });

      logger.info('Study calendars retrieved', {
        calendarsCount: Object.keys(data).length
      });

      return data;

    } catch (error) {
      logger.error('Error retrieving study calendars', { error: error.message });
      return null;
    }
  }

  /**
   * Get lexicon/dictionary entry for a word
   * @param {string} word - Word to look up
   * @param {string} language - Language (optional)
   * @returns {Object} Lexicon entry
   */
  async getLexicon(word, language = 'hebrew') {
    try {
      const cacheKey = `lexicon:${word}:${language}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const url = `/lexicon/${encodeURIComponent(word)}?lang=${language}`;
      const data = await this.makeRequest(url);

      if (!data) {
        logger.warn('No lexicon data received from Sefaria', { word, language });
        return null;
      }

      const result = {
        word,
        language,
        entries: data.entries || [],
        forms: data.forms || [],
        retrievedAt: new Date().toISOString()
      };

      // Cache the results
      this.setCache(cacheKey, result);

      logger.info('Lexicon entry retrieved', {
        word,
        language,
        entriesCount: result.entries.length
      });

      return result;

    } catch (error) {
      logger.error('Error retrieving lexicon entry', {
        word,
        language,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get random text selection
   * @param {Object} options - Options for random selection
   * @returns {Object} Random text
   */
  async getRandomText(options = {}) {
    try {
      const params = new URLSearchParams(options);
      const url = `/random${params.toString() ? '?' + params.toString() : ''}`;
      const data = await this.makeRequest(url);

      if (!data) {
        logger.warn('No random text received from Sefaria');
        return null;
      }

      const result = {
        ...data,
        retrievedAt: new Date().toISOString()
      };

      logger.info('Random text retrieved', {
        book: result.book,
        reference: result.ref
      });

      return result;

    } catch (error) {
      logger.error('Error retrieving random text', { error: error.message });
      return null;
    }
  }

  /**
   * Discover available commentaries for a book
   * @param {string} book - Book name
   * @returns {Array} Available commentaries
   */
  async getCommentaries(book) {
    try {
      const cacheKey = `commentaries:${book}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Get the library index to find commentaries
      const index = await this.getIndex();
      if (!index) {
        return [];
      }

      const commentaries = [];

      // Search through the index for commentaries on this book
      Object.values(index).forEach(category => {
        if (Array.isArray(category)) {
          category.forEach(item => {
            if (typeof item === 'string' && item.includes(book)) {
              // Extract commentator name
              const match = item.match(/^(.+)_on_(.+)$/);
              if (match && match[2] === book) {
                commentaries.push({
                  commentator: match[1],
                  book: match[2],
                  title: item
                });
              }
            }
          });
        }
      });

      // Cache the results
      this.setCache(cacheKey, commentaries);

      logger.info('Commentaries discovered', {
        book,
        commentariesCount: commentaries.length
      });

      return commentaries;

    } catch (error) {
      logger.error('Error discovering commentaries', {
        book,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Test API connectivity
   * @returns {boolean}
   */
  async testConnection() {
    try {
      await this.makeRequest('/texts/Genesis.1.1');
      logger.info('Sefaria API connection test successful');
      return true;
    } catch (error) {
      logger.error('Sefaria API connection test failed', { error: error.message });
      return false;
    }
  }
}

// Export singleton instance
module.exports = new SefariaService();