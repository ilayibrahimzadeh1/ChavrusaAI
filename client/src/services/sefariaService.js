import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Core Sefaria API service
class SefariaService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async request(endpoint) {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error('Sefaria API error:', error);
      throw error;
    }
  }

  // Dynamic discovery methods
  async getIndex() {
    return this.request('/sefaria/index');
  }

  async getVersions(book) {
    return this.request(`/sefaria/versions/${encodeURIComponent(book)}`);
  }

  async getRelated(reference) {
    return this.request(`/sefaria/related/${encodeURIComponent(reference)}`);
  }

  async getTopics() {
    return this.request('/sefaria/topics');
  }

  async getCalendars() {
    return this.request('/sefaria/calendars');
  }

  async getLexicon(word) {
    return this.request(`/sefaria/lexicon/${encodeURIComponent(word)}`);
  }

  async getCommentaries(book) {
    return this.request(`/sefaria/commentaries/${encodeURIComponent(book)}`);
  }

  async getRandomText() {
    return this.request('/sefaria/random');
  }

  // Existing reference method
  async getReference(reference) {
    return this.request(`/reference/${encodeURIComponent(reference)}`);
  }

  async searchTexts(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }
}

// Singleton instance
const sefariaService = new SefariaService();

// React hooks for dynamic discovery
export const useSefariaIndex = () => {
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIndex = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getIndex();
      setIndex(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  return { index, loading, error, refetch: fetchIndex };
};

export const useSefariaText = (reference) => {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchText = useCallback(async () => {
    if (!reference) return;

    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getReference(reference);
      setText(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    fetchText();
  }, [fetchText]);

  return { text, loading, error, refetch: fetchText };
};

export const useSefariaCommentaries = (book) => {
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCommentaries = useCallback(async () => {
    if (!book) return;

    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getCommentaries(book);
      setCommentaries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [book]);

  useEffect(() => {
    fetchCommentaries();
  }, [fetchCommentaries]);

  return { commentaries, loading, error, refetch: fetchCommentaries };
};

// Hook for discovering available books dynamically
export const useAvailableBooks = () => {
  const { index, loading, error } = useSefariaIndex();
  const [books, setBooks] = useState([]);

  useEffect(() => {
    if (index?.books) {
      const bookList = index.books.map(book => ({
        title: book.title,
        heTitle: book.heTitle,
        category: book.primary_category,
        subcategory: book.secondary_category,
        hasCommentaries: book.commentaryCount > 0
      }));
      setBooks(bookList);
    }
  }, [index]);

  return { books, loading, error };
};

// Hook for searching Torah texts
export const useSefariaSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query?.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.searchTexts(query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
};

// Hook for lexicon lookups
export const useSefariaLexicon = (word) => {
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookup = useCallback(async (searchWord = word) => {
    if (!searchWord?.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getLexicon(searchWord);
      setDefinition(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [word]);

  useEffect(() => {
    if (word) lookup(word);
  }, [word, lookup]);

  return { definition, loading, error, lookup };
};

// Hook for getting related content
export const useSefariaRelated = (reference) => {
  const [related, setRelated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRelated = useCallback(async () => {
    if (!reference) return;

    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getRelated(reference);
      setRelated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    fetchRelated();
  }, [fetchRelated]);

  return { related, loading, error, refetch: fetchRelated };
};

// Hook for Torah topics
export const useSefariaTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getTopics();
      setTopics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return { topics, loading, error, refetch: fetchTopics };
};

// Hook for study calendars
export const useSefariaCalendars = () => {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCalendars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getCalendars();
      setCalendars(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  return { calendars, loading, error, refetch: fetchCalendars };
};

// Hook for random Torah text
export const useSefariaRandom = () => {
  const [randomText, setRandomText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sefariaService.getRandomText();
      setRandomText(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { randomText, loading, error, fetchRandom };
};

export default sefariaService;