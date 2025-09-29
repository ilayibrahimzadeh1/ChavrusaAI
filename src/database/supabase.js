const supabaseService = require('../services/supabaseClient');
const logger = require('../utils/logger');

/**
 * Database service wrapper for Supabase operations
 * Handles conversations, messages, and user data with proper context
 */

class SupabaseDatabase {
  constructor() {
    this.supabase = supabaseService.getAdminClient();
  }

  /**
   * Create a new conversation for a user
   * @param {string} conversationId - Session ID to use as conversation ID
   * @param {string} userId - User ID
   * @param {string} rabbiName - Selected rabbi
   * @param {string} title - Optional conversation title
   * @returns {Object} Created conversation
   */
  async createConversation(conversationId, userId, rabbiName, title = null) {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: userId,
          rabbi_name: rabbiName,
          title: title || `Conversation with ${rabbiName}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create conversation', {
          error: error.message,
          conversationId,
          userId,
          rabbiName,
          title
        });
        throw error;
      }

      logger.info('Conversation created successfully', {
        conversationId: data.id,
        userId,
        rabbiName,
        title
      });

      return data;
    } catch (error) {
      logger.error('Error creating conversation', {
        error: error.message,
        conversationId,
        userId,
        rabbiName
      });
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of conversations to return
   * @returns {Array} User's conversations
   */
  async getUserConversations(userId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          id,
          rabbi_name,
          title,
          created_at,
          updated_at,
          messages(count)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get user conversations', {
          error: error.message,
          userId,
          limit
        });
        throw error;
      }

      logger.debug('Retrieved user conversations', {
        userId,
        conversationCount: data.length
      });

      return data;
    } catch (error) {
      logger.error('Error getting user conversations', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get a specific conversation with messages
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Conversation with messages
   */
  async getConversationWithMessages(conversationId, userId) {
    try {
      // First verify user owns this conversation
      const { data: conversation, error: convError } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        logger.warn('Conversation not found or access denied', {
          conversationId,
          userId,
          error: convError?.message
        });
        throw new Error('Conversation not found or access denied');
      }

      // Get messages for this conversation
      const { data: messages, error: msgError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        logger.error('Failed to get conversation messages', {
          error: msgError.message,
          conversationId,
          userId
        });
        throw msgError;
      }

      const result = {
        ...conversation,
        messages: messages || []
      };

      logger.debug('Retrieved conversation with messages', {
        conversationId,
        userId,
        messageCount: messages.length
      });

      return result;
    } catch (error) {
      logger.error('Error getting conversation with messages', {
        error: error.message,
        conversationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {boolean} isUser - Whether message is from user or AI
   * @param {Array} torahReferences - Optional Torah references
   * @returns {Object} Created message
   */
  async addMessage(conversationId, content, isUser, torahReferences = null) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: content,
          is_user: isUser,
          torah_references: torahReferences,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add message', {
          error: error.message,
          conversationId,
          isUser,
          contentLength: content.length
        });
        throw error;
      }

      // Update conversation timestamp
      await this.updateConversationTimestamp(conversationId);

      logger.debug('Message added successfully', {
        messageId: data.id,
        conversationId,
        isUser,
        contentLength: content.length
      });

      return data;
    } catch (error) {
      logger.error('Error adding message', {
        error: error.message,
        conversationId,
        isUser
      });
      throw error;
    }
  }

  /**
   * Update conversation timestamp
   * @param {string} conversationId - Conversation ID
   */
  async updateConversationTimestamp(conversationId) {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        logger.error('Failed to update conversation timestamp', {
          error: error.message,
          conversationId
        });
      }
    } catch (error) {
      logger.error('Error updating conversation timestamp', {
        error: error.message,
        conversationId
      });
    }
  }

  /**
   * Delete a conversation and all its messages
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {boolean} Success status
   */
  async deleteConversation(conversationId, userId) {
    try {
      // Verify user owns this conversation
      const { data: conversation, error: convError } = await this.supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        logger.warn('Conversation not found or access denied for deletion', {
          conversationId,
          userId,
          error: convError?.message
        });
        throw new Error('Conversation not found or access denied');
      }

      // Delete the conversation (messages will be deleted via cascade)
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete conversation', {
          error: error.message,
          conversationId,
          userId
        });
        throw error;
      }

      logger.info('Conversation deleted successfully', {
        conversationId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Error deleting conversation', {
        error: error.message,
        conversationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Update conversation title
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} title - New title
   * @returns {Object} Updated conversation
   */
  async updateConversationTitle(conversationId, userId, title) {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .update({
          title: title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update conversation title', {
          error: error.message,
          conversationId,
          userId,
          title
        });
        throw error;
      }

      logger.info('Conversation title updated', {
        conversationId,
        userId,
        newTitle: title
      });

      return data;
    } catch (error) {
      logger.error('Error updating conversation title', {
        error: error.message,
        conversationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get conversation messages with pagination
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @param {number} limit - Messages per page
   * @param {number} offset - Offset for pagination
   * @returns {Array} Messages
   */
  async getConversationMessages(conversationId, userId, limit = 50, offset = 0) {
    try {
      // Verify user owns this conversation
      const { data: conversation, error: convError } = await this.supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to get conversation messages', {
          error: error.message,
          conversationId,
          userId
        });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting conversation messages', {
        error: error.message,
        conversationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Search conversations by content
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Array} Matching conversations and messages
   */
  async searchConversations(userId, query, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          id,
          rabbi_name,
          title,
          created_at,
          messages!inner(
            id,
            content,
            is_user,
            created_at
          )
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,messages.content.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        logger.error('Failed to search conversations', {
          error: error.message,
          userId,
          query
        });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error searching conversations', {
        error: error.message,
        userId,
        query
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Object} User statistics
   */
  async getUserStatistics(userId) {
    try {
      const { data: conversations, error: convError } = await this.supabase
        .from('conversations')
        .select('id, rabbi_name, created_at')
        .eq('user_id', userId);

      if (convError) {
        throw convError;
      }

      const { data: messages, error: msgError } = await this.supabase
        .from('messages')
        .select('id, is_user, conversation_id')
        .in('conversation_id', conversations.map(c => c.id));

      if (msgError) {
        throw msgError;
      }

      const stats = {
        totalConversations: conversations.length,
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.is_user).length,
        aiMessages: messages.filter(m => !m.is_user).length,
        rabbiStats: conversations.reduce((acc, conv) => {
          acc[conv.rabbi_name] = (acc[conv.rabbi_name] || 0) + 1;
          return acc;
        }, {}),
        firstConversation: conversations.length > 0 ?
          conversations.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0].created_at : null
      };

      return stats;
    } catch (error) {
      logger.error('Error getting user statistics', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new SupabaseDatabase();