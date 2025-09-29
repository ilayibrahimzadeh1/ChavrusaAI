const { generateSessionId } = require('../utils/helpers');
const logger = require('../utils/logger');
const supabaseDb = require('../database/supabase');

class SessionService {
  constructor() {
    // In-memory cache for active sessions
    this.cache = new Map();
  }

  /**
   * Create a new session
   * @returns {string} Session ID
   */
  createSession() {
    const sessionId = generateSessionId();

    // Note: Supabase conversations are created when first message is sent
    // For now, just create a local session object
    const session = {
      id: sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      rabbi: null,
      messages: [],
      context: {
        recentReferences: [],
        topics: [],
        conversationSummary: ''
      }
    };

    this.cache.set(sessionId, session);
    logger.info('Session created', { sessionId });

    return sessionId;
  }

  /**
   * Get session by ID
   * @param {string} sessionId
   * @param {string} userId - Optional user ID for Supabase sync
   * @returns {Object|null} Session object or null if not found
   */
  async getSession(sessionId, userId = null) {
    if (!sessionId) {
      return null;
    }

    // Check cache first
    if (this.cache.has(sessionId)) {
      const session = this.cache.get(sessionId);
      session.lastActivity = new Date();
      return session;
    }

    // If user is authenticated, try to load from Supabase
    if (userId) {
      try {
        // First, try to get the user's conversations and find one that matches our session pattern
        const conversations = await supabaseDb.getUserConversations(userId, 50);
        const matchingConversation = conversations.find(conv =>
          conv.title && conv.title.includes(sessionId.substring(0, 8))
        );

        if (matchingConversation) {
          // Load the full conversation with messages
          const conversation = await supabaseDb.getConversationWithMessages(matchingConversation.id, userId);

          if (conversation) {
            // Convert Supabase conversation to session format
            const session = {
              id: sessionId, // Keep the original sessionId for frontend compatibility
              conversationId: conversation.id, // Store the Supabase conversation ID
              createdAt: new Date(conversation.created_at),
              lastActivity: new Date(conversation.updated_at || conversation.created_at),
              rabbi: conversation.rabbi_name,
              messages: conversation.messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                isUser: msg.is_user,
                timestamp: new Date(msg.created_at),
                references: msg.torah_references || [],
                status: 'delivered'
              })),
              context: {
                recentReferences: conversation.messages
                  .filter(msg => msg.torah_references)
                  .flatMap(msg => msg.torah_references)
                  .slice(-20),
                topics: [],
                conversationSummary: ''
              }
            };

            // Cache the restored session
            this.cache.set(sessionId, session);
            logger.debug('Session loaded from Supabase', {
              sessionId,
              conversationId: conversation.id,
              messageCount: session.messages.length
            });
            return session;
          }
        }
      } catch (error) {
        logger.warn('Failed to load session from Supabase, using cache only', {
          sessionId,
          userId,
          error: error.message
        });
      }
    }

    return null;
  }

  /**
   * Update session data
   * @param {string} sessionId
   * @param {Object} data
   * @returns {boolean} Success status
   */
  updateSession(sessionId, data) {
    if (this.cache.has(sessionId)) {
      // Update cache
      const session = this.cache.get(sessionId);
      Object.assign(session, data);
      session.lastActivity = new Date();
    }

    logger.debug('Session updated', { sessionId, updatedFields: Object.keys(data) });
    return true;
  }

  /**
   * Set rabbi for session
   * @param {string} sessionId
   * @param {string} rabbi
   * @returns {boolean} Success status
   */
  setSessionRabbi(sessionId, rabbi) {
    return this.updateSession(sessionId, { rabbi });
  }

  /**
   * Add a message to session
   * @param {string} sessionId
   * @param {string} content
   * @param {boolean} isUser
   * @param {Array} references
   * @param {string} userId - Optional user ID for authenticated users
   * @returns {boolean} Success status
   */
  async addMessage(sessionId, content, isUser, references = [], userId = null) {
    try {
      // Ensure conversation exists in Supabase before adding message
      await this.ensureConversationExists(sessionId, userId);

      // Save to Supabase database only for authenticated users
      let message = null;
      if (userId) {
        try {
          // Get the correct conversation ID from the session
          const session = this.cache.get(sessionId);
          const conversationId = session?.conversationId || sessionId; // Fallback to sessionId if no conversationId

          message = await supabaseDb.addMessage(conversationId, content, isUser, references);
          logger.debug('Message saved to Supabase successfully', {
            sessionId,
            conversationId,
            messageId: message?.id,
            isUser
          });
        } catch (error) {
          logger.warn('Failed to save message to Supabase, continuing with cache only', {
            sessionId,
            userId,
            error: error.message,
            isUser
          });
          // Continue with cache-only storage for resilience
        }
      }

      // Update cache if present (for both authenticated and anonymous users)
      if (this.cache.has(sessionId)) {
        const session = this.cache.get(sessionId);
        session.messages.push({
          id: message?.id || `temp_${Date.now()}`, // Use temp ID for anonymous users
          content,
          isUser,
          timestamp: new Date(),
          references: references || [],
          status: 'delivered'
        });

        // Update context with references
        if (references && references.length > 0) {
          session.context.recentReferences = [
            ...new Set([...session.context.recentReferences, ...references])
          ].slice(-20);
        }

        session.lastActivity = new Date();
      }

      logger.debug('Message added to session', {
        sessionId,
        isUser,
        contentLength: content.length,
        authenticated: !!userId,
        supabaseSaved: !!message
      });
      return true;
    } catch (error) {
      logger.error('Critical error in addMessage function', {
        sessionId,
        userId,
        error: error.message,
        isUser
      });

      // Even if there's a critical error, try to at least update cache
      try {
        if (this.cache.has(sessionId)) {
          const session = this.cache.get(sessionId);
          session.messages.push({
            id: `temp_${Date.now()}`,
            content,
            isUser,
            timestamp: new Date(),
            references: references || [],
            status: 'delivered'
          });
          session.lastActivity = new Date();
          logger.info('Message saved to cache despite Supabase error', { sessionId });
          return true;
        }
      } catch (cacheError) {
        logger.error('Failed to save message to cache as well', {
          sessionId,
          cacheError: cacheError.message
        });
      }
    }

    return false;
  }

  /**
   * Ensure conversation exists in Supabase
   * @param {string} sessionId
   * @param {string} userId - Optional user ID for authenticated users
   */
  async ensureConversationExists(sessionId, userId = null) {
    try {
      // Check if conversation already exists
      const session = this.cache.get(sessionId);
      if (!session) return;

      // Only create conversations in Supabase for authenticated users
      if (!userId) {
        logger.debug('Skipping Supabase conversation creation for anonymous user', { sessionId });
        return;
      }

      // Check if conversation is already created for this session
      if (session.conversationId) {
        logger.debug('Conversation already exists for session', {
          sessionId,
          conversationId: session.conversationId
        });
        return;
      }

      // Use sessionId as conversation ID for consistency
      const conversation = await supabaseDb.createConversation(
        sessionId,                                   // Use session ID as conversation ID
        userId,
        session.rabbi || 'general',
        `Conversation ${sessionId.substring(0, 8)}`
      );

      // Store the Supabase conversation ID in the session for future message operations
      if (conversation && conversation.id) {
        session.conversationId = conversation.id;
        logger.debug('Conversation created in Supabase', {
          sessionId,
          conversationId: conversation.id,
          userId
        });
      }
    } catch (error) {
      // If conversation already exists, that's fine
      if (error.message.includes('duplicate key value') || error.message.includes('UNIQUE constraint')) {
        logger.debug('Conversation already exists, continuing normally', { sessionId });
        // Mark it as created in the session to avoid future attempts
        const session = this.cache.get(sessionId);
        if (session) {
          session.conversationId = sessionId;
        }
        return;
      } else {
        // Log warning but don't throw - allow local chat to continue
        logger.warn('Supabase conversation creation failed, continuing with local chat', {
          sessionId,
          error: error.message
        });
        return;
      }
    }
  }

  /**
   * Get conversation history
   * @param {string} sessionId
   * @param {number} limit
   * @returns {Array} Messages array
   */
  getConversationHistory(sessionId, limit = 20) {
    // Try cache first
    if (this.cache.has(sessionId)) {
      const session = this.cache.get(sessionId);
      return session.messages.slice(-limit);
    }

    // For Supabase, we don't pre-load conversation history
    // Messages are loaded when needed via the API
    return [];
  }

  /**
   * Get session statistics
   * @param {string} sessionId
   * @returns {Object} Statistics
   */
  getSessionStats(sessionId) {
    if (this.cache.has(sessionId)) {
      const session = this.cache.get(sessionId);
      return {
        messageCount: session.messages.length,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        rabbi: session.rabbi
      };
    }
    return null;
  }

  /**
   * Delete a session
   * @param {string} sessionId
   * @returns {boolean} Success status
   */
  deleteSession(sessionId) {
    // Remove from cache
    this.cache.delete(sessionId);

    // Note: Supabase conversations can be deleted via API if needed
    logger.info('Session deleted', { sessionId });
    return true;
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - Optional user ID for Supabase sync
   * @param {number} limit
   * @returns {Array} Sessions array
   */
  async getAllSessions(userId = null, limit = 20) {
    // If user is authenticated, load from Supabase
    if (userId) {
      try {
        const conversations = await supabaseDb.getUserConversations(userId, limit);
        const sessions = conversations.map(conv => ({
          id: conv.id,
          createdAt: new Date(conv.created_at),
          lastActivity: new Date(conv.updated_at || conv.created_at),
          rabbi: conv.rabbi_name,
          messageCount: Array.isArray(conv.messages) ? conv.messages.length : (conv.messages?.count || 0),
          title: conv.title
        }));

        logger.debug('Loaded user sessions from Supabase', {
          userId,
          sessionCount: sessions.length
        });

        return sessions;
      } catch (error) {
        logger.warn('Failed to load user sessions from Supabase, using cache only', {
          userId,
          error: error.message
        });
      }
    }

    // Return cached sessions as fallback
    const sessions = Array.from(this.cache.values()).slice(0, limit);
    return sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      rabbi: session.rabbi,
      messageCount: session.messages.length
    }));
  }

  /**
   * Clean up old sessions from cache
   */
  cleanupCache() {
    const maxAge = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    for (const [sessionId, session] of this.cache.entries()) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.cache.delete(sessionId);
        logger.debug('Session removed from cache', { sessionId });
      }
    }
  }
}

// Create singleton instance
const sessionService = new SessionService();

// Set up cache cleanup timer
setInterval(() => {
  sessionService.cleanupCache();
}, 10 * 60 * 1000); // Every 10 minutes

module.exports = sessionService;