import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import socketService from '../services/socketService';
import useAuthStore from './authStore';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const authStore = useAuthStore.getState();
  return authStore.getAuthHeaders();
};

// Helper function to get user context
const getUserContext = () => {
  const authStore = useAuthStore.getState();
  return authStore.isAuthenticated() ? {
    id: authStore.user?.id,
    email: authStore.user?.email,
    displayName: authStore.profile?.display_name
  } : null;
};

// Fallback rabbis used when backend is unavailable
const FALLBACK_RABBIS = [
  {
    id: 'rashi',
    name: 'Rashi',
    displayName: 'Rashi',
    era: '11th century France',
    description: 'Master commentator focused on peshat (plain meaning).',
    specialties: ['Torah Commentary', 'Talmud', 'Peshat']
  },
  {
    id: 'rambam',
    name: 'Rambam',
    displayName: 'Rambam (Maimonides)',
    era: '12th century Spain/Egypt',
    description: 'Systematic halakhist and rational philosopher.',
    specialties: ['Mishneh Torah', 'Jewish Philosophy', 'Halakhah']
  },
  {
    id: 'rabbi-yosef-caro',
    name: 'Rabbi Yosef Caro',
    displayName: 'Rabbi Yosef Caro (Maran)',
    era: '16th century Israel',
    description: 'Author of Shulchan Aruch, practical halakhic guidance.',
    specialties: ['Shulchan Aruch', 'Beit Yosef', 'Halakhah']
  },
  {
    id: 'baal-shem-tov',
    name: 'Baal Shem Tov',
    displayName: 'The Baal Shem Tov',
    era: '18th century Ukraine/Poland',
    description: 'Founder of Hasidism, joy and divine immanence.',
    specialties: ['Chassidut', 'Spirituality', 'Ahavat Yisrael']
  }
];

const chatStore = (set, get) => ({
  // State - Multiple Session Support
  sessions: {}, // { sessionId: { id, rabbi, messages, references, createdAt, lastActivity, title } }
  currentSessionId: null,
  selectedRabbiId: null,
  isLoading: false,
  isTyping: false,
  isSelectingRabbi: false,
  connectionStatus: 'connected',
  rabbis: [],
  initialized: false, // Track if app has been initialized
  rehydrated: false, // Track if persist middleware has completed rehydration

  // Abort controller for cancelling requests
  currentAbortController: null,

  // Translation state
  currentLanguage: 'en', // 'en' or 'tr'
  translations: {}, // Cache for translated content

  // Computed getters for current session
  get currentSession() {
    const { sessions, currentSessionId } = get();
    return sessions[currentSessionId] || null;
  },

  get sessionId() {
    return get().currentSessionId;
  },

  get currentRabbi() {
    return get().selectedRabbiId;
  },

  get messages() {
    const session = get().currentSession;
    return session?.messages || [];
  },

  get references() {
    const session = get().currentSession;
    return session?.references || [];
  },
  
  // Helper to log to both console and sessionStorage for debugging
  logWithPersistence: (message, data = null) => {
    console.log(message, data);
    try {
      const logs = JSON.parse(sessionStorage.getItem('chavrusa-debug-logs') || '[]');
      logs.push({ timestamp: new Date().toISOString(), message, data });
      sessionStorage.setItem('chavrusa-debug-logs', JSON.stringify(logs.slice(-20))); // Keep last 20 logs
    } catch (e) {
      // Ignore storage errors
    }
  },

  // Actions
  initializeApp: async () => {
    // Don't reinitialize if already done
    if (get().initialized) {
      return;
    }

    // Wait for persist rehydration to complete before initializing
    if (!get().rehydrated) {
      console.log('⏳ Waiting for persist rehydration...');
      // TEMPORARY FIX: Force rehydration to unblock initialization
      set({ rehydrated: true });
      console.log('🔧 Forced rehydration to true');
    }

    try {
      get().logWithPersistence('🚀 Initializing ChavrusaAI with Supabase...');
      set({ isLoading: true });

      // Connect WebSocket
      console.log('🔌 Connecting WebSocket...');
      socketService.connect();

      // Make store accessible globally for debugging
      if (typeof window !== 'undefined') {
        window.chatStore = get();
      }

      // Load rabbis
      console.log('📡 Fetching rabbis from:', `${API_BASE_URL}/chat/rabbis`);
      const rabbisResponse = await axios.get(`${API_BASE_URL}/chat/rabbis`);
      console.log('✅ Rabbis loaded:', rabbisResponse.data.data.rabbis.length);

      set({
        rabbis: rabbisResponse.data.data.rabbis
      });

      // Wait for auth store to fully initialize before checking authentication
      const authStore = useAuthStore.getState();
      const authState = {
        initialized: authStore.initialized,
        isAuthenticated: authStore.isAuthenticated(),
        hasUser: !!authStore.user,
        hasSession: !!authStore.session
      };
      get().logWithPersistence('🔍 Auth state during chat init:', authState);

      if (!authStore.initialized) {
        get().logWithPersistence('⏳ Waiting for auth initialization...');

        // Force auth initialization if not already started
        if (!authStore.loading) {
          get().logWithPersistence('🔄 Starting auth initialization...');
          await authStore.initialize();
        }

        // Wait up to 5 seconds for auth to initialize
        let attempts = 0;
        while (!useAuthStore.getState().initialized && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        const finalAuthStore = useAuthStore.getState();
        get().logWithPersistence('✅ Auth initialization complete after ' + (attempts * 100) + 'ms', {
          initialized: finalAuthStore.initialized,
          hasUser: !!finalAuthStore.user,
          hasSession: !!finalAuthStore.session
        });
      }

      // Force load sessions - just call the API directly
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (authSession?.access_token) {
          const response = await axios.get(`${API_BASE_URL}/chat/sessions`, {
            headers: {
              'Authorization': `Bearer ${authSession.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          const userSessions = response.data.data.sessions;
          if (userSessions && userSessions.length > 0) {
            const sessionsById = {};
            userSessions.forEach(chatSession => {
              sessionsById[chatSession.id] = {
                id: chatSession.id,
                title: chatSession.title,
                rabbi: chatSession.rabbi,
                messages: [],
                references: [],
                createdAt: new Date(chatSession.createdAt),
                lastActivity: new Date(chatSession.lastActivity),
                messageCount: chatSession.messageCount
              };
            });

            set({
              sessions: sessionsById,
              currentSessionId: userSessions[0].id
            });
          }
        }
      } catch (error) {
        // Ignore errors, just continue
      }

      set({ isLoading: false, initialized: true });

      console.log('✅ App initialization complete');

      // Show debug logs in console for troubleshooting
      console.log('📊 Debug logs from initialization:');
      try {
        const logs = JSON.parse(sessionStorage.getItem('chavrusa-debug-logs') || '[]');
        console.table(logs);
      } catch (e) {
        console.log('No debug logs available');
      }

      toast.success('Connected to ChavrusaAI!');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Fallback to built-in rabbis so user can still select and chat
      set({
        rabbis: FALLBACK_RABBIS,
        sessions: {},
        currentSessionId: null,
        isLoading: false,
        connectionStatus: 'degraded'
      });
      toast.error('Backend unavailable. Using offline mode.');
    }
  },

  // Validate session states against available rabbis
  validateSessionStates: (availableRabbis) => {
    const { sessions, currentSessionId } = get();
    const validRabbiIds = new Set(availableRabbis.map(r => r.id));
    let needsUpdate = false;
    const updatedSessions = {};

    Object.entries(sessions).forEach(([sessionId, session]) => {
      const updatedSession = { ...session };

      // Check if session has a valid rabbi
      if (session.rabbi && !validRabbiIds.has(session.rabbi)) {
        console.warn(`Invalid rabbi ID in session ${sessionId}: ${session.rabbi}`);
        updatedSession.rabbi = null;
        needsUpdate = true;
      }

      updatedSessions[sessionId] = updatedSession;
    });

    if (needsUpdate) {
      console.log('🔧 Cleaning up invalid session states');
      set({ sessions: updatedSessions });
    }

    // Re-sync selectedRabbiId from current session if missing
    const current = get().currentSession;
    if (!get().selectedRabbiId && current?.rabbi) {
      set({ selectedRabbiId: current.rabbi });
    }
  },

  createSession: async (title = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/session`,
        {},
        { headers: getAuthHeaders() }
      );
      const sessionId = response.data.data.sessionId;

      console.log('🚀 Creating generic session:', { sessionId });

      const newSession = {
        id: sessionId,
        messages: [],
        references: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        title: title || 'New Chat'
      };

      set(state => ({
        sessions: {
          ...state.sessions,
          [sessionId]: newSession
        },
        currentSessionId: sessionId
      }));

      console.log('✅ Generic session created:', { sessionId });

      // Join WebSocket session
      socketService.joinSession(sessionId);

      return sessionId;
    } catch (error) {
      console.warn('Backend unavailable while creating session. Falling back to offline session.', error?.message || error);
      // Create a local session ID (32-char hex) compatible with validators
      const offlineSessionId = uuidv4().replace(/-/g, '');

      const newSession = {
        id: offlineSessionId,
        messages: [],
        references: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        title: title || 'New Chat'
      };

      set(state => ({
        sessions: {
          ...state.sessions,
          [offlineSessionId]: newSession
        },
        currentSessionId: offlineSessionId,
        connectionStatus: 'degraded'
      }));

      toast('Started offline session. Responses are simulated.');
      return offlineSessionId;
    }
  },

  switchSession: async (sessionId) => {
    const { sessions } = get();
    if (sessions[sessionId]) {
      set({ currentSessionId: sessionId, isLoading: true });
      socketService.joinSession(sessionId);

      // Load messages for this session if not already loaded
      const session = sessions[sessionId];
      if (session.messages.length === 0 && session.messageCount > 0) {
        console.log('📡 Loading messages for session:', sessionId);
        try {
          const historyResponse = await axios.get(`${API_BASE_URL}/chat/history/${sessionId}`, {
            headers: getAuthHeaders()
          });

          const messages = historyResponse.data.data.messages.map((msg) => ({
            id: msg.id || uuidv4(),
            content: msg.content,
            isUser: msg.isUser,
            timestamp: new Date(msg.timestamp),
            status: 'delivered',
            references: msg.references || []
          }));

          set(state => ({
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...state.sessions[sessionId],
                messages: messages,
                references: messages.flatMap(msg => msg.references || []),
                lastActivity: new Date()
              }
            },
            isLoading: false
          }));

          console.log('✅ Messages loaded for session:', messages.length);
        } catch (error) {
          console.error('Failed to load session messages:', error);
          set({ isLoading: false });
          toast.error('Failed to load conversation history');
          return;
        }
      } else {
        set({ isLoading: false });
      }

      // Update last activity
      set(state => ({
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...state.sessions[sessionId],
            lastActivity: new Date()
          }
        }
      }));

      toast.success('Switched to chat session');
    }
  },

  deleteSession: (sessionId) => {
    const { sessions, currentSessionId } = get();
    if (sessions[sessionId]) {
      const newSessions = { ...sessions };
      delete newSessions[sessionId];

      const remainingSessions = Object.keys(newSessions);
      const newCurrentSessionId = sessionId === currentSessionId
        ? (remainingSessions.length > 0 ? remainingSessions[0] : null)
        : currentSessionId;

      set({
        sessions: newSessions,
        currentSessionId: newCurrentSessionId
      });

      if (newCurrentSessionId && newCurrentSessionId !== sessionId) {
        socketService.joinSession(newCurrentSessionId);
      }

      toast.success('Session deleted');
    }
  },

  updateSessionTitle: (sessionId, title) => {
    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...state.sessions[sessionId],
          title
        }
      }
    }));
  },

  getSortedSessions: () => {
    const { sessions } = get();
    return Object.values(sessions).sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  },

  selectRabbi: (rabbi) => {
    set({ selectedRabbiId: rabbi });
    toast.success(`Selected ${rabbi}`);
  },

  sendMessage: async (content) => {
    const { selectedRabbiId, currentSessionId } = get();

    // Check if rabbi is selected
    if (!selectedRabbiId) {
      toast.error('Please select a rabbi before sending a message');
      return;
    }

    // Use existing session or create new one
    let sessionId = currentSessionId;
    if (!sessionId) {
      // Check if we have any existing sessions to use
      const { sessions } = get();
      const existingSessions = Object.keys(sessions);
      if (existingSessions.length > 0) {
        sessionId = existingSessions[0];
        set({ currentSessionId: sessionId });
      } else {
        // Only create new session if no existing sessions
        try {
          sessionId = await get().createSession();
        } catch (error) {
          console.error('Failed to create session for message:', error);
          toast.error('Failed to start conversation');
          return;
        }
      }
    }

    console.log('✅ SendMessage starting:', { sessionId, selectedRabbiId, messageLength: content.length });

    // Add user message immediately
    const userMessage = {
      id: uuidv4(),
      content,
      isUser: true,
      timestamp: new Date(),
      status: 'sending'
    };

    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...state.sessions[sessionId],
          messages: [...state.sessions[sessionId].messages, userMessage],
          lastActivity: new Date()
        }
      },
      isTyping: true
    }));

    try {
      // Create abort controller for this request
      const abortController = new AbortController();
      set({ currentAbortController: abortController });

      // Get fresh auth headers and validate token
      const authHeaders = getAuthHeaders();
      const userContext = getUserContext();

      // Debug log the auth state
      console.log('🔐 Auth state check:', {
        hasAuthHeader: !!authHeaders.Authorization,
        tokenLength: authHeaders.Authorization?.replace('Bearer ', '').length,
        isAuthenticated: !!userContext,
        userId: userContext?.id
      });

      const response = await axios.post(`${API_BASE_URL}/chat/message`,
        {
          message: content,
          sessionId: sessionId,
          rabbi: selectedRabbiId,
          userContext
        },
        {
          headers: authHeaders,
          timeout: 30000, // 30 second timeout
          signal: abortController.signal
        }
      );

      console.log('✅ Backend response received:', response.data);
      console.log('✅ AI Response content:', response.data?.data?.aiResponse);

      // Add AI response - with safer property access
      const aiResponse = response.data?.data?.aiResponse;
      const references = response.data?.data?.references || [];

      if (!aiResponse) {
        throw new Error('AI response is missing from backend response');
      }

      const aiMessage = {
        id: uuidv4(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
        status: 'delivered',
        references: references
      };

      set(state => {
        const currentSession = state.sessions[sessionId];

        // Create clean new messages array
        const updatedMessages = [
          ...currentSession.messages.map(msg =>
            msg.id === userMessage.id ? { ...msg, status: 'delivered' } : msg
          ),
          aiMessage
        ];

        return {
          ...state,
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...currentSession,
              messages: updatedMessages,
              references: [...currentSession.references, ...(references || [])],
              lastActivity: new Date()
            }
          },
          isTyping: false
        };
      });

      // Clear abort controller on success
      set({ currentAbortController: null });

    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Response data:', error.response?.data);

      // Clear abort controller
      set({ currentAbortController: null });

      // Handle abort
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log('Request was aborted by user');
        // Mark user message as failed and stop typing
        set(state => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              messages: state.sessions[sessionId].messages.map(msg =>
                msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg
              )
            }
          },
          isTyping: false
        }));
        toast.error('Message cancelled');
        return;
      }

      // Handle specific error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn('Request timed out. Backend may be processing slowly.');
        toast.error('Request timed out. Please try again.');
      } else if (error.response?.status >= 500) {
        console.warn('Server error occurred while sending message.');
        toast.error('Server error. Please try again in a moment.');
      } else {
        console.warn('Backend unavailable while sending message. Falling back to offline simulated response.');
      }

      // Create a simple simulated AI response based on selected rabbi
      const simulateResponse = (rabbiId, text) => {
        const rabbiNameMap = {
          'rashi': 'Rashi',
          'rambam': 'Rambam',
          'rabbi-yosef-caro': 'Rabbi Yosef Caro',
          'baal-shem-tov': 'Baal Shem Tov'
        };
        const name = rabbiNameMap[rabbiId] || 'Your Chavrusa';
        return `${name}: (offline) I received your question: "${text.slice(0, 140)}". Please start the backend to get full AI answers.`;
      };

      const aiMessage = {
        id: uuidv4(),
        content: simulateResponse(selectedRabbiId, content),
        isUser: false,
        timestamp: new Date(),
        status: 'delivered',
        references: []
      };

      console.log('🔥 ADDING FALLBACK MESSAGE:', aiMessage.content);

      set(state => ({
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...state.sessions[sessionId],
            messages: state.sessions[sessionId].messages.map(msg =>
              msg.id === userMessage.id ? { ...msg, status: 'delivered' } : msg
            ).concat([aiMessage]),
            lastActivity: new Date()
          }
        },
        isTyping: false
      }));

      // Also surface a small notice once
      if (get().connectionStatus !== 'connected') {
        toast('Offline mode: showing simulated responses.');
      }
    }
  },

  retryMessage: async (messageId) => {
    const { currentSessionId, messages } = get();
    const message = messages.find(msg => msg.id === messageId);

    if (message && message.status === 'failed' && currentSessionId) {
      // Remove failed message and resend
      set(state => ({
        sessions: {
          ...state.sessions,
          [currentSessionId]: {
            ...state.sessions[currentSessionId],
            messages: state.sessions[currentSessionId].messages.filter(msg => msg.id !== messageId)
          }
        }
      }));

      await get().sendMessage(message.content);
    }
  },

  clearChat: () => {
    const { currentSessionId } = get();
    if (currentSessionId) {
      set(state => ({
        sessions: {
          ...state.sessions,
          [currentSessionId]: {
            ...state.sessions[currentSessionId],
            messages: [],
            references: []
          }
        }
      }));
    }
  },

  // Abort the current message request
  abortCurrentMessage: () => {
    const { currentAbortController } = get();
    if (currentAbortController) {
      currentAbortController.abort();
      console.log('🛑 Aborting current message request');
      set({
        currentAbortController: null,
        isTyping: false
      });
      toast.error('Message cancelled');
    }
  },

  clearAllSessions: () => {
    set({
      sessions: {},
      currentSessionId: null
    });
  },

  // Debug helper to force clear everything and restart
  debugRestart: () => {
    // Clear current state (no localStorage to clear anymore)
    set({
      sessions: {},
      currentSessionId: null,
      selectedRabbiId: null,
      isLoading: false,
      isTyping: false,
      connectionStatus: 'connected',
      rabbis: []
    });
    // Force reload
    window.location.reload();
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  loadSessionHistory: async (sessionId) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`${API_BASE_URL}/chat/history/${sessionId}`,
        { headers: getAuthHeaders() }
      );

      const messages = response.data.data.messages.map((msg) => ({
        id: msg.id || uuidv4(), // Use existing ID or generate new UUID
        content: msg.content,
        isUser: msg.isUser,
        timestamp: new Date(msg.timestamp),
        status: 'delivered',
        references: msg.references || []
      }));

      const loadedSession = {
        id: sessionId,
        rabbi: typeof response.data.data.rabbi === 'string'
          ? response.data.data.rabbi.toLowerCase()
          : response.data.data.rabbi,
        messages,
        references: messages.flatMap(msg => msg.references || []),
        createdAt: new Date(response.data.data.createdAt || Date.now()),
        lastActivity: new Date(),
        title: response.data.data.title || `Learning with ${response.data.data.rabbi}`
      };

      set(state => ({
        sessions: {
          ...state.sessions,
          [sessionId]: loadedSession
        },
        currentSessionId: sessionId,
        isLoading: false
      }));

      // Join WebSocket session
      socketService.joinSession(sessionId);
    } catch (error) {
      console.error('Failed to load session history:', error);
      set({ isLoading: false });
      toast.error('Failed to load conversation history');
    }
  },

  // Helper methods for WebSocket updates
  addReceivedMessage: (message) => {
    const { currentSessionId } = get();
    if (currentSessionId) {
      set(state => ({
        sessions: {
          ...state.sessions,
          [currentSessionId]: {
            ...state.sessions[currentSessionId],
            messages: [...state.sessions[currentSessionId].messages, message],
            lastActivity: new Date()
          }
        },
        isTyping: false
      }));
    }
  },

  setTyping: (isTyping) => {
    set({ isTyping });
  },

  updateMessageStatus: (messageId, status) => {
    const { currentSessionId } = get();
    if (currentSessionId) {
      set(state => ({
        sessions: {
          ...state.sessions,
          [currentSessionId]: {
            ...state.sessions[currentSessionId],
            messages: state.sessions[currentSessionId].messages.map(msg =>
              msg.id === messageId ? { ...msg, status } : msg
            )
          }
        }
      }));
    }
  },

  addReference: (reference) => {
    const { currentSessionId } = get();
    if (currentSessionId) {
      set(state => ({
        sessions: {
          ...state.sessions,
          [currentSessionId]: {
            ...state.sessions[currentSessionId],
            references: [...state.sessions[currentSessionId].references, reference]
          }
        }
      }));
    }
  },

  // Translation actions
  setLanguage: (language) => {
    set({ currentLanguage: language });
  },

  setTranslation: (key, translation) => {
    set(state => ({
      translations: {
        ...state.translations,
        [key]: translation
      }
    }));
  },

  getTranslation: (key) => {
    const { translations } = get();
    return translations[key];
  },

  clearTranslations: () => {
    set({ translations: {} });
  },

  // Load user sessions from Supabase (extracted from initializeApp)
  loadUserSessions: async () => {
    console.log('🚀 loadUserSessions started');
    try {
      // Get current session from Supabase directly to ensure we have valid auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // Clear sessions if no auth
        set({
          sessions: {},
          currentSessionId: null
        });
        return false;
      }

      // Check if we already have persisted sessions with messages
      const { sessions: existingSessions } = get();
      const hasPersistedSessions = Object.keys(existingSessions).length > 0;
      const hasMessagesInSessions = Object.values(existingSessions).some(s => s.messages && s.messages.length > 0);

      if (hasPersistedSessions && hasMessagesInSessions) {
        console.log('📦 Using persisted sessions with messages, skipping API load');
        return true;
      }

      const sessionsResponse = await axios.get(`${API_BASE_URL}/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const userSessions = sessionsResponse.data.data.sessions;
      if (!userSessions || userSessions.length === 0) {
        return false;
      }

      // Transform sessions to store format - merge with existing if available
      const sessionsById = { ...existingSessions };
      userSessions.forEach(apiSession => {
        const existingSession = sessionsById[apiSession.id];
        sessionsById[apiSession.id] = {
          id: apiSession.id,
          title: apiSession.title,
          rabbi: apiSession.rabbi,
          messages: existingSession?.messages || [], // Preserve existing messages
          references: existingSession?.references || [],
          createdAt: apiSession.createdAt ? new Date(apiSession.createdAt) : new Date(),
          lastActivity: apiSession.lastActivity ? new Date(apiSession.lastActivity) : new Date(),
          messageCount: apiSession.messageCount || 0
        };
      });

      // Set most recent session as current if none selected
      const currentSessionId = get().currentSessionId || userSessions[0].id;

      set({
        sessions: sessionsById,
        currentSessionId: currentSessionId
      });

      // Load messages for each session that doesn't have messages yet
      console.log('📥 Loading messages for sessions...');
      for (const session of userSessions) {
        const hasMessages = sessionsById[session.id]?.messages?.length > 0;
        if (!hasMessages && session.messageCount > 0) {
          console.log(`📥 Loading messages for session ${session.id}`);
          try {
            await get().loadSessionHistory(session.id);
          } catch (error) {
            console.error(`Failed to load messages for session ${session.id}:`, error);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('❌ loadUserSessions failed:', error.response?.status, error.response?.data || error.message);
      return false;
    }
  },

  // Debug function to check initialization logs
  getDebugLogs: () => {
    try {
      const logs = JSON.parse(sessionStorage.getItem('chavrusa-debug-logs') || '[]');
      console.table(logs);
      return logs;
    } catch (e) {
      console.log('No debug logs found');
      return [];
    }
  }
});

// Create store with persist middleware for initialization state
const useChatStore = create(
  persist(
    devtools(chatStore, {
      name: 'chavrusa-chat-store' // For debugging only
    }),
    {
      name: 'chavrusa-chat-persist',
      partialize: (state) => ({
        initialized: state.initialized,
        sessions: state.sessions, // Now includes full message content
        currentSessionId: state.currentSessionId,
        selectedRabbiId: state.selectedRabbiId, // Persist selected rabbi
        rehydrated: state.rehydrated
      }),
      onRehydrateStorage: () => (state) => {
        // Set rehydrated flag after persist loads
        if (state) {
          state.rehydrated = true;
          console.log('🔄 Persist rehydration complete');
          // Trigger initialization after rehydration
          setTimeout(() => {
            const currentState = useChatStore.getState();
            if (!currentState.initialized) {
              currentState.initializeApp();
            }
          }, 50);
        }
      }
    }
  )
);

export default useChatStore;