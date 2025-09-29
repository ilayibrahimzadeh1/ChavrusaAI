const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const { getRabbiPersona, defaultPersona } = require('../config/rabbis');
const { delay, calculateBackoff } = require('../utils/helpers');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.model = config.openai.model;
    this.maxTokens = config.openai.maxTokens;
    this.temperature = config.openai.temperature;
    this.retryAttempts = 3;
  }

  /**
   * Validate OpenAI API key
   * @returns {boolean}
   */
  async validateApiKey() {
    try {
      await this.openai.models.list();
      logger.info('OpenAI API key validation successful');
      return true;
    } catch (error) {
      logger.error('OpenAI API key validation failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get rabbi persona configuration
   * @param {string} rabbiName 
   * @returns {Object}
   */
  getRabbiPersona(rabbiName) {
    if (!rabbiName) {
      return defaultPersona;
    }
    return getRabbiPersona(rabbiName);
  }

  /**
   * Build conversation context from session history with enhanced validation
   * @param {Array} sessionHistory
   * @param {Array} references
   * @returns {Array}
   */
  buildConversationContext(sessionHistory = [], references = []) {
    const messages = [];

    // Add reference context if available
    if (references && references.length > 0) {
      const referenceContext = references.map(ref => {
        if (ref && ref.text) {
          return `${ref.reference}: "${ref.text}"`;
        }
        return ref && ref.reference ? ref.reference : 'Unknown reference';
      }).join('\n\n');

      messages.push({
        role: 'system',
        content: `The following Torah texts are relevant to this conversation:\n\n${referenceContext}`
      });
    }

    // Add conversation history with proper validation
    if (Array.isArray(sessionHistory)) {
      sessionHistory.forEach((msg, index) => {
        if (!msg || typeof msg !== 'object') {
          logger.warn('Invalid message in session history', { index, message: msg });
          return;
        }

        // Handle both old format (isUser) and new format (role)
        let role;
        if (msg.role) {
          role = msg.role;
        } else if (msg.hasOwnProperty('isUser')) {
          role = msg.isUser ? 'user' : 'assistant';
        } else {
          logger.warn('Message missing role information', { index, message: msg });
          return;
        }

        // Validate content
        if (!msg.content || typeof msg.content !== 'string') {
          logger.warn('Message missing valid content', { index, message: msg });
          return;
        }

        messages.push({
          role: role,
          content: msg.content.trim()
        });
      });
    } else {
      logger.warn('Session history is not an array', { sessionHistory });
    }

    logger.debug('Built conversation context', {
      messageCount: messages.length,
      referencesCount: references.length
    });

    return messages;
  }

  /**
   * Generate response with retry logic
   * @param {Array} messages 
   * @param {Object} options 
   * @param {number} attempt 
   * @returns {string}
   */
  async generateResponseWithRetry(messages, options = {}, attempt = 0) {
    try {
      logger.debug('Generating AI response', { 
        attempt, 
        messageCount: messages.length,
        model: this.model 
      });

      // Enhanced conversation management with proper context preservation
      const systemPrompt = messages.find(msg => msg.role === 'system')?.content || '';
      const conversationMessages = messages.filter(msg => msg.role !== 'system');
      const currentMessage = messages[messages.length - 1]?.content || '';

      // Validate message structure
      if (!systemPrompt) {
        throw new Error('Rabbi persona system prompt missing from conversation context');
      }

      // Build structured conversation context with proper validation
      let conversationHistory = '';
      if (conversationMessages.length > 1) {
        conversationHistory = conversationMessages.slice(0, -1).map(msg => {
          const speaker = msg.role === 'user' ? 'Student' : 'Rabbi';
          const content = msg.content || '';
          return `${speaker}: ${content}`;
        }).join('\n\n');
      }

      // Create properly structured input maintaining rabbi persona integrity
      const fullInput = [
        `RABBI PERSONA: ${systemPrompt}`,
        '',
        conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}` : '',
        '',
        `CURRENT STUDENT QUESTION: ${currentMessage}`,
        '',
        'RESPOND AS THE RABBI DESCRIBED ABOVE, MAINTAINING CHARACTER AND TEACHING STYLE:'
      ].filter(Boolean).join('\n');

      // Validate input before API call
      if (fullInput.length < 50) {
        throw new Error('Conversation context too short - possible data loss');
      }

      const completion = await this.openai.responses.create({
        model: this.model,
        input: fullInput,
        reasoning: { effort: "low" },
        text: { verbosity: "medium" }
      });

      const response = completion.output_text;
      
      if (!response) {
        throw new Error('No response content received from OpenAI');
      }

      logger.info('AI response generated successfully', {
        responseLength: response.length,
        tokensUsed: completion.usage?.total_tokens || 0,
        model: this.model
      });

      return response;

    } catch (error) {
      logger.warn('AI response generation failed', {
        attempt,
        error: error.message,
        errorType: error.constructor.name
      });

      if (attempt < this.retryAttempts - 1) {
        const backoffDelay = calculateBackoff(attempt);
        logger.info('Retrying AI response generation', { 
          attempt: attempt + 1, 
          delay: backoffDelay 
        });
        await delay(backoffDelay);
        return this.generateResponseWithRetry(messages, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Validate session context integrity
   * @param {Object} sessionContext
   * @param {string} rabbi
   * @returns {Object}
   */
  validateSessionContext(sessionContext = {}, rabbi) {
    const validatedContext = {
      messages: [],
      sessionId: sessionContext.sessionId || null,
      rabbi: rabbi || sessionContext.rabbi || null,
      startTime: sessionContext.startTime || new Date().toISOString(),
      ...sessionContext
    };

    // Validate messages array
    if (sessionContext.messages && Array.isArray(sessionContext.messages)) {
      validatedContext.messages = sessionContext.messages.filter(msg =>
        msg && typeof msg === 'object' && msg.content && typeof msg.content === 'string'
      );
    }

    // Log context validation results
    logger.debug('Session context validated', {
      originalMessageCount: sessionContext.messages?.length || 0,
      validatedMessageCount: validatedContext.messages.length,
      rabbi: validatedContext.rabbi,
      sessionId: validatedContext.sessionId
    });

    return validatedContext;
  }

  /**
   * Generate response from AI with enhanced session management and user context
   * @param {string} message - User message
   * @param {string} rabbi - Rabbi name
   * @param {Object} sessionContext - Session context with history and references
   * @param {Array} references - Torah references with text
   * @param {Object} userContext - Optional authenticated user context
   * @returns {string}
   */
  async generateResponse(message, rabbi, sessionContext = {}, references = [], userContext = null) {
    try {
      // Input validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('Message is required and must be a non-empty string');
      }

      if (!rabbi || typeof rabbi !== 'string') {
        throw new Error('Rabbi selection is required');
      }

      // Validate and clean session context
      const validatedContext = this.validateSessionContext(sessionContext, rabbi);

      // Get rabbi persona with validation
      const rabbiPersona = this.getRabbiPersona(rabbi);
      if (!rabbiPersona || !rabbiPersona.systemPrompt) {
        throw new Error(`Invalid rabbi persona: ${rabbi}`);
      }

      // Enhance system prompt with user context when available
      let enhancedSystemPrompt = rabbiPersona.systemPrompt;
      if (userContext && userContext.id) {
        const userInfo = [];

        if (userContext.displayName) {
          userInfo.push(`The student you are speaking with goes by ${userContext.displayName}`);
        }

        if (userContext.email) {
          userInfo.push(`Their email is ${userContext.email}`);
        }

        if (userInfo.length > 0) {
          enhancedSystemPrompt += `\n\nADDITIONAL CONTEXT: ${userInfo.join('. ')}.`;
        }
      }

      logger.debug('Generating response with validated context', {
        rabbi: rabbiPersona.name,
        displayName: rabbiPersona.displayName,
        messageLength: message.length,
        historyCount: validatedContext.messages.length,
        sessionId: validatedContext.sessionId,
        isAuthenticated: !!userContext?.id,
        userDisplayName: userContext?.displayName || 'anonymous'
      });

      // Build messages array for OpenAI
      const messages = [];

      // Add system prompt with rabbi persona and user context
      messages.push({
        role: 'system',
        content: enhancedSystemPrompt
      });

      // Add conversation context with proper validation
      const contextMessages = this.buildConversationContext(
        validatedContext.messages || [],
        references || []
      );
      messages.push(...contextMessages);

      // Add current user message
      messages.push({
        role: 'user',
        content: message.trim()
      });

      // Validate message structure before API call
      if (messages.length < 2) {
        throw new Error('Insufficient message context for conversation');
      }

      // Generate response with enhanced error handling
      const response = await this.generateResponseWithRetry(messages);

      // Post-process response to maintain character consistency
      const processedResponse = this.postProcessResponse(response, rabbiPersona);

      // Validate response quality
      if (!processedResponse || processedResponse.trim().length < 10) {
        logger.warn('Generated response too short, using fallback');
        return this.getFallbackResponse(rabbi, new Error('Response too short'));
      }

      logger.info('Response generated successfully', {
        rabbi: rabbiPersona.displayName,
        userMessageLength: message.length,
        responseLength: processedResponse.length,
        referencesUsed: references?.length || 0,
        sessionId: validatedContext.sessionId,
        isAuthenticated: !!userContext?.id,
        userId: userContext?.id || null
      });

      return processedResponse;

    } catch (error) {
      logger.error('Error generating AI response', {
        rabbi,
        messageLength: message?.length || 0,
        error: error.message,
        errorType: error.constructor.name,
        sessionId: sessionContext?.sessionId,
        isAuthenticated: !!userContext?.id,
        userId: userContext?.id || null
      });

      // Return contextual fallback response
      return this.getFallbackResponse(rabbi, error);
    }
  }

  /**
   * Post-process the AI response
   * @param {string} response 
   * @param {Object} rabbiPersona 
   * @returns {string}
   */
  postProcessResponse(response, rabbiPersona) {
    if (!response) {
      return response;
    }

    // Remove any potential AI self-references
    let processed = response
      .replace(/As an AI/gi, 'As a teacher')
      .replace(/I am an AI/gi, 'I am here to help')
      .replace(/AI assistant/gi, 'learning companion');

    // Ensure response stays in character
    if (processed.toLowerCase().includes('i am an ai') || 
        processed.toLowerCase().includes('as an artificial intelligence')) {
      logger.warn('Response broke character, applying fallback', { 
        rabbi: rabbiPersona.name 
      });
      processed = this.getCharacterFallback(rabbiPersona);
    }

    return processed;
  }

  /**
   * Get fallback response when AI generation fails
   * @param {string} rabbi 
   * @param {Error} error 
   * @returns {string}
   */
  getFallbackResponse(rabbi, error) {
    const rabbiPersona = this.getRabbiPersona(rabbi);
    
    // Check error type for specific fallbacks
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return `I apologize, but I'm experiencing high demand right now. Please try again in a moment. In the meantime, perhaps you could share what specific aspect of Torah study you'd like to explore?`;
    }

    if (error.message.includes('content policy') || error.message.includes('safety')) {
      return `I want to ensure our discussion remains focused on Torah learning and Jewish wisdom. Could you rephrase your question in a way that relates to our study?`;
    }

    // General fallback based on rabbi
    const fallbacks = {
      'Rashi': `I apologize, but I'm having difficulty responding right now. As we say, "Who is wise? One who learns from every person." Perhaps you could share more about what you'd like to understand from the text?`,
      'Rambam': `I must pause our discussion momentarily due to technical difficulties. As I've written, the pursuit of knowledge requires patience. Please try your question again.`,
      'Rabbi Yosef Caro': `Forgive me, but I'm experiencing some difficulty at the moment. In matters of learning, persistence is key. Please ask your question again.`,
      'Baal Shem Tov': `My dear friend, sometimes we must pause and breathe. Even in difficulty, there is a spark of the Divine. Please share your question again, and we'll continue our learning together.`,
      'Rabbi Soloveitchik': `I'm experiencing a temporary difficulty in our dialogue. As I've often taught, intellectual honesty requires acknowledging our limitations. Please restate your inquiry.`,
      'Arizal': `The flow of divine wisdom sometimes encounters obstacles. Let us try again, with proper intention and focus.`
    };

    return fallbacks[rabbi] || fallbacks['Rashi'];
  }

  /**
   * Get character fallback when response breaks character
   * @param {Object} rabbiPersona 
   * @returns {string}
   */
  getCharacterFallback(rabbiPersona) {
    const fallbacks = {
      'Rashi': `Let me focus on the text before us. What specific verse or passage would you like me to explain?`,
      'Rambam': `Let us return to our systematic study. What aspect of Torah or Jewish law would you like to explore?`,
      'Rabbi Yosef Caro': `Let us focus on the practical application of Jewish law. What halakhic matter concerns you?`,
      'Baal Shem Tov': `Come, let us learn together with joy and open hearts. What brings you to study today?`,
      'Rabbi Soloveitchik': `Let us engage in rigorous analysis of the text. What conceptual issue would you like to examine?`,
      'Arizal': `Let us delve into the deeper meanings of Torah. What mystical dimension would you like to explore?`
    };

    return fallbacks[rabbiPersona.name] || fallbacks['Rashi'];
  }

  /**
   * Generate a summary of conversation for context
   * @param {Array} messages 
   * @returns {string}
   */
  async generateConversationSummary(messages) {
    try {
      if (!messages || messages.length < 4) {
        return '';
      }

      const conversationText = messages
        .slice(-10) // Last 10 messages
        .map(msg => `${msg.isUser ? 'Student' : 'Rabbi'}: ${msg.content}`)
        .join('\n');

      const summaryMessages = [
        {
          role: 'system',
          content: 'Summarize this Torah learning conversation in 2-3 sentences, focusing on the main topics and questions discussed.'
        },
        {
          role: 'user',
          content: conversationText
        }
      ];

      const summary = await this.generateResponseWithRetry(summaryMessages, {
        maxTokens: 150,
        temperature: 0.3
      });

      logger.debug('Conversation summary generated', { 
        messageCount: messages.length,
        summaryLength: summary.length 
      });

      return summary;

    } catch (error) {
      logger.error('Error generating conversation summary', { error: error.message });
      return '';
    }
  }

  /**
   * Get service health information
   * @returns {Object}
   */
  getHealthInfo() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      retryAttempts: this.retryAttempts,
      apiKeyConfigured: !!config.openai.apiKey && config.openai.apiKey !== 'your-openai-api-key'
    };
  }

  /**
   * Test OpenAI connection
   * @returns {boolean}
   */
  async testConnection() {
    try {
      const testMessages = [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Say "Connection test successful" if you can read this.'
        }
      ];

      const response = await this.generateResponseWithRetry(testMessages, {
        maxTokens: 50,
        temperature: 0
      });

      const success = response.toLowerCase().includes('connection test successful');
      
      if (success) {
        logger.info('OpenAI connection test successful');
      } else {
        logger.warn('OpenAI connection test returned unexpected response', { response });
      }

      return success;

    } catch (error) {
      logger.error('OpenAI connection test failed', { error: error.message });
      return false;
    }
  }
}

// Export singleton instance
module.exports = new AIService();