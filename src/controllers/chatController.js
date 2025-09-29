const sessionService = require('../services/sessionService');
const aiService = require('../services/aiService');
const sefariaService = require('../services/sefariaService');
const logger = require('../utils/logger');
const { catchAsync, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { getAllRabbis, getRabbiPersona, getAllRabbiIds, getIdFromName, getNameFromId } = require('../config/rabbis');

/**
 * Create a new chat session
 */
const createSession = catchAsync(async (req, res) => {
  const { rabbi } = req.body;

  // Create new session
  const sessionId = sessionService.createSession();

  // Set rabbi if provided (store ID directly)
  let rabbiId = null;
  if (rabbi) {
    sessionService.setSessionRabbi(sessionId, rabbi); // Store rabbi ID directly
    rabbiId = rabbi;
  }

  const userId = req.user?.id || null;
  const session = await sessionService.getSession(sessionId, userId);

  logger.info('New chat session created', {
    sessionId,
    rabbiId: rabbiId || 'none',
    requestId: req.requestId
  });

  res.status(201).json({
    success: true,
    data: {
      sessionId,
      rabbi: rabbiId,
      createdAt: session.createdAt,
      message: rabbi
        ? `Session created with ${getRabbiPersona(rabbi).displayName}`
        : 'Session created. Please select a rabbi to begin learning.'
    },
    requestId: req.requestId
  });
});

/**
 * Get session information
 */
const getSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  const userId = req.user?.id || null;
  const session = await sessionService.getSession(sessionId, userId);
  if (!session) {
    throw new NotFoundError('Session');
  }

  const stats = sessionService.getSessionStats(sessionId);

  logger.debug('Session information retrieved', { sessionId, requestId: req.requestId });

  res.status(200).json({
    success: true,
    data: {
      sessionId: session.id,
      rabbi: session.rabbi,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.messages.length,
      recentReferences: session.context.recentReferences,
      stats
    },
    requestId: req.requestId
  });
});

/**
 * Set or change rabbi for a session
 */
const setRabbi = catchAsync(async (req, res) => {
  const { sessionId, rabbi } = req.body;

  const userId = req.user?.id || null;
  const session = await sessionService.getSession(sessionId, userId);
  if (!session) {
    throw new NotFoundError('Session');
  }

  // Store rabbi ID directly
  const success = sessionService.setSessionRabbi(sessionId, rabbi);
  if (!success) {
    throw new ValidationError('Failed to set rabbi for session');
  }

  const rabbiPersona = getRabbiPersona(rabbi);

  logger.info('Rabbi set for session', {
    sessionId,
    rabbiId: rabbi,
    displayName: rabbiPersona.displayName,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      rabbi: rabbiPersona.id, // Return the ID to frontend
      rabbiInfo: {
        id: rabbiPersona.id,
        name: rabbiPersona.name,
        displayName: rabbiPersona.displayName,
        era: rabbiPersona.era,
        description: rabbiPersona.description,
        specialties: rabbiPersona.specialties
      },
      message: `Now learning with ${rabbiPersona.displayName}`
    },
    requestId: req.requestId
  });
});

/**
 * Send a message and get AI response
 */
const sendMessage = catchAsync(async (req, res) => {
  const { message, sessionId, rabbi } = req.body;

  // Validate rabbi parameter is provided (required with new architecture)
  if (!rabbi) {
    throw new ValidationError('Rabbi parameter is required');
  }

  // Extract userId for authenticated requests
  const userId = req.user?.id || null;

  // Get or create session
  let session = await sessionService.getSession(sessionId, userId);
  if (!session) {
    // Create session instead of throwing error
    logger.info('Session not found in cache, creating new session', { sessionId, requestId: req.requestId });
    sessionService.createSession(sessionId);
    session = await sessionService.getSession(sessionId, userId);

    if (!session) {
      // If session creation also failed, then throw error
      throw new NotFoundError('Failed to create session');
    }
  }

  // Rabbi is now passed per-message, not stored in session
  // We still update the session rabbi for compatibility, but use the parameter for AI
  if (rabbi !== session.rabbi) {
    sessionService.setSessionRabbi(sessionId, rabbi);
    session = await sessionService.getSession(sessionId, userId);
  }

  // Detect Torah references in the message
  const detectedReferences = sefariaService.detectReferences(message);
  
  // Fetch reference texts if any were detected
  const references = [];
  if (detectedReferences.length > 0) {
    logger.debug('Torah references detected', { 
      sessionId, 
      references: detectedReferences,
      requestId: req.requestId 
    });

    // Fetch texts for references (limit to 3 to avoid overwhelming the AI)
    const referencesToFetch = detectedReferences.slice(0, 3);
    const referencePromises = referencesToFetch.map(ref => 
      sefariaService.getTextByReference(ref)
    );

    const referenceResults = await Promise.allSettled(referencePromises);
    
    referenceResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        references.push(result.value);
      } else {
        logger.warn('Failed to fetch reference text', { 
          reference: referencesToFetch[index],
          error: result.reason?.message,
          requestId: req.requestId 
        });
      }
    });
  }

  // Add user message to session
  try {
    await sessionService.addMessage(sessionId, message, true, detectedReferences, userId);
  } catch (error) {
    logger.error('Failed to add user message to session', {
      sessionId,
      userId,
      error: error.message,
      requestId: req.requestId
    });
    // Continue processing even if message storage fails (graceful degradation)
    // The conversation can still proceed but won't be persisted
  }

  // Get conversation history for context
  const conversationHistory = sessionService.getConversationHistory(sessionId, 10);

  // Build session context
  const sessionContext = {
    messages: conversationHistory,
    recentReferences: session.context.recentReferences,
    topics: session.context.topics
  };

  // Generate AI response using rabbi parameter (not session.rabbi)
  const userContext = req.user ? {
    id: req.user.id,
    displayName: req.user.user_metadata?.name || req.user.email,
    email: req.user.email
  } : null;

  const aiResponse = await aiService.generateResponse(
    message,
    rabbi,
    sessionContext,
    references,
    userContext
  );

  // Detect references in AI response
  const aiReferences = sefariaService.detectReferences(aiResponse);

  // Add AI response to session
  try {
    await sessionService.addMessage(sessionId, aiResponse, false, aiReferences, userId);
  } catch (error) {
    logger.error('Failed to add AI response to session', {
      sessionId,
      userId,
      error: error.message,
      requestId: req.requestId
    });
    // Continue processing to return response even if storage fails
  }

  // Update session context with any new topics (simple keyword extraction)
  const topics = extractTopics(message + ' ' + aiResponse);
  if (topics.length > 0) {
    sessionService.updateSession(sessionId, {
      context: {
        ...session.context,
        topics: [...new Set([...session.context.topics, ...topics])].slice(-10)
      }
    });
  }

  logger.info('Message processed successfully', {
    sessionId,
    rabbi: rabbi,
    messageLength: message.length,
    responseLength: aiResponse.length,
    referencesDetected: detectedReferences.length,
    referencesFetched: references.length,
    aiReferences: aiReferences.length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      userMessage: message,
      aiResponse,
      rabbi: rabbi, // Return the rabbi parameter used for this message
      rabbiInfo: getRabbiPersona(rabbi),
      references: references.map(ref => ({
        reference: ref.reference,
        text: ref.text,
        url: ref.url
      })),
      detectedReferences: [...new Set([...detectedReferences, ...aiReferences])],
      timestamp: new Date().toISOString()
    },
    requestId: req.requestId
  });
});

/**
 * Get conversation history for a session
 */
const getConversationHistory = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const { limit = 20 } = req.query;

  const userId = req.user?.id || null;
  const session = await sessionService.getSession(sessionId, userId);
  if (!session) {
    throw new NotFoundError('Session');
  }

  const history = sessionService.getConversationHistory(sessionId, parseInt(limit));

  logger.debug('Conversation history retrieved', { 
    sessionId, 
    messageCount: history.length,
    requestId: req.requestId 
  });

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      messages: history,
      totalMessages: session.messages.length,
      rabbi: session.rabbi
    },
    requestId: req.requestId
  });
});

/**
 * Get user sessions (conversations) from Supabase
 */
const getUserSessions = catchAsync(async (req, res) => {
  const { limit = 20 } = req.query;
  const userId = req.user?.id || null;

  if (!userId) {
    throw new ValidationError('Authentication required');
  }

  const sessions = await sessionService.getAllSessions(userId, parseInt(limit));

  logger.debug('User sessions retrieved from Supabase', {
    userId,
    sessionCount: sessions.length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: {
      sessions: sessions.map(session => ({
        id: session.id,
        title: session.title || `Conversation ${session.id.substring(0, 8)}`,
        rabbi: session.rabbi,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        messageCount: session.messageCount
      })),
      count: sessions.length
    },
    requestId: req.requestId
  });
});

/**
 * Get available rabbis
 */
const getRabbis = catchAsync(async (req, res) => {
  const rabbis = getAllRabbis().map(rabbiName => {
    const persona = getRabbiPersona(rabbiName);
    return {
      id: persona.id,
      name: persona.name,
      displayName: persona.displayName,
      era: persona.era,
      description: persona.description,
      specialties: persona.specialties,
      image: persona.image
    };
  });

  logger.debug('Available rabbis retrieved', {
    count: rabbis.length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: {
      rabbis,
      count: rabbis.length
    },
    requestId: req.requestId
  });
});

/**
 * Get Torah reference text
 */
const getReference = catchAsync(async (req, res) => {
  const { reference } = req.params;

  if (!sefariaService.validateReference(reference)) {
    throw new ValidationError('Invalid Torah reference format');
  }

  const referenceData = await sefariaService.getTextByReference(reference);
  
  if (!referenceData) {
    throw new NotFoundError('Torah reference text');
  }

  logger.info('Torah reference retrieved', { 
    reference,
    textLength: referenceData.text?.length || 0,
    requestId: req.requestId 
  });

  res.status(200).json({
    success: true,
    data: referenceData,
    requestId: req.requestId
  });
});

/**
 * Search Torah texts
 */
const searchTexts = catchAsync(async (req, res) => {
  const { q: query, limit = 10 } = req.query;

  if (!query || query.trim().length === 0) {
    throw new ValidationError('Search query is required');
  }

  const results = await sefariaService.searchTexts(query.trim(), { limit });

  logger.info('Torah text search completed', { 
    query,
    resultCount: results.length,
    requestId: req.requestId 
  });

  res.status(200).json({
    success: true,
    data: {
      query,
      results,
      count: results.length
    },
    requestId: req.requestId
  });
});

/**
 * Delete a session
 */
const deleteSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  const session = sessionService.getSession(sessionId);
  if (!session) {
    throw new NotFoundError('Session');
  }

  const deleted = sessionService.deleteSession(sessionId);
  
  if (!deleted) {
    throw new ValidationError('Failed to delete session');
  }

  logger.info('Session deleted', { sessionId, requestId: req.requestId });

  res.status(200).json({
    success: true,
    data: {
      sessionId,
      message: 'Session deleted successfully'
    },
    requestId: req.requestId
  });
});

/**
 * Get session statistics
 */
const getSessionStats = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  const session = sessionService.getSession(sessionId);
  if (!session) {
    throw new NotFoundError('Session');
  }

  const stats = sessionService.getSessionStats(sessionId);

  logger.debug('Session statistics retrieved', { sessionId, requestId: req.requestId });

  res.status(200).json({
    success: true,
    data: stats,
    requestId: req.requestId
  });
});

/**
 * Extract topics from text (simple keyword extraction)
 */
function extractTopics(text) {
  const commonTopics = [
    'creation', 'genesis', 'exodus', 'commandments', 'mitzvot', 'shabbat',
    'prayer', 'tefilah', 'torah', 'talmud', 'halakha', 'kabbalah',
    'messiah', 'temple', 'sacrifice', 'covenant', 'israel', 'jerusalem',
    'righteousness', 'justice', 'charity', 'tzedakah', 'repentance', 'teshuvah',
    'faith', 'emunah', 'wisdom', 'chochmah', 'understanding', 'binah'
  ];

  const words = text.toLowerCase().split(/\s+/);
  const foundTopics = commonTopics.filter(topic => 
    words.some(word => word.includes(topic) || topic.includes(word))
  );

  return foundTopics.slice(0, 5); // Limit to 5 topics
}

/**
 * Get Sefaria library index
 */
const getSefariaIndex = catchAsync(async (req, res) => {
  const indexData = await sefariaService.getIndex();

  if (!indexData) {
    throw new NotFoundError('Sefaria library index');
  }

  logger.info('Sefaria library index retrieved', {
    categoriesCount: Object.keys(indexData).length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: indexData,
    requestId: req.requestId
  });
});

/**
 * Get available versions for a book
 */
const getSefariaVersions = catchAsync(async (req, res) => {
  const { book } = req.params;

  if (!book || book.trim().length === 0) {
    throw new ValidationError('Book name is required');
  }

  const versions = await sefariaService.getVersions(book.trim());

  logger.info('Sefaria versions retrieved', {
    book,
    versionCount: versions.length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: versions,
    requestId: req.requestId
  });
});

/**
 * Get related content for a reference
 */
const getSefariaRelated = catchAsync(async (req, res) => {
  const { reference } = req.params;

  if (!sefariaService.validateReference(reference)) {
    throw new ValidationError('Invalid Torah reference format');
  }

  const relatedData = await sefariaService.getRelated(reference);

  if (!relatedData) {
    throw new NotFoundError('Related content for reference');
  }

  logger.info('Sefaria related content retrieved', {
    reference,
    linksCount: relatedData.links.length,
    topicsCount: relatedData.topics.length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: relatedData,
    requestId: req.requestId
  });
});

/**
 * Get available topics
 */
const getSefariaTopics = catchAsync(async (req, res) => {
  const options = req.query;

  const topics = await sefariaService.getTopics(options);

  logger.info('Sefaria topics retrieved', {
    topicsCount: topics.length,
    options,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: topics,
    requestId: req.requestId
  });
});

/**
 * Get study calendars
 */
const getSefariaCalendars = catchAsync(async (req, res) => {
  const calendars = await sefariaService.getCalendars();

  if (!calendars) {
    throw new NotFoundError('Study calendars');
  }

  logger.info('Sefaria calendars retrieved', {
    calendarsCount: Object.keys(calendars).length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: calendars,
    requestId: req.requestId
  });
});

/**
 * Get lexicon entry for a word
 */
const getSefariaLexicon = catchAsync(async (req, res) => {
  const { word } = req.params;
  const { lang: language = 'hebrew' } = req.query;

  if (!word || word.trim().length === 0) {
    throw new ValidationError('Word is required');
  }

  const lexiconData = await sefariaService.getLexicon(word.trim(), language);

  if (!lexiconData) {
    throw new NotFoundError('Lexicon entry');
  }

  logger.info('Sefaria lexicon entry retrieved', {
    word,
    language,
    entriesCount: lexiconData.entries.length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: lexiconData,
    requestId: req.requestId
  });
});

/**
 * Get available commentaries for a book
 */
const getSefariaCommentaries = catchAsync(async (req, res) => {
  const { book } = req.params;

  if (!book || book.trim().length === 0) {
    throw new ValidationError('Book name is required');
  }

  const commentaries = await sefariaService.getCommentaries(book.trim());

  logger.info('Sefaria commentaries retrieved', {
    book,
    commentariesCount: commentaries.length,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: commentaries,
    requestId: req.requestId
  });
});

/**
 * Get random text
 */
const getSefariaRandom = catchAsync(async (req, res) => {
  const options = req.query;

  const randomText = await sefariaService.getRandomText(options);

  if (!randomText) {
    throw new NotFoundError('Random text');
  }

  logger.info('Sefaria random text retrieved', {
    book: randomText.book,
    reference: randomText.ref,
    requestId: req.requestId
  });

  res.status(200).json({
    success: true,
    data: randomText,
    requestId: req.requestId
  });
});

module.exports = {
  createSession,
  getSession,
  setRabbi,
  sendMessage,
  getConversationHistory,
  getUserSessions,
  getRabbis,
  getReference,
  searchTexts,
  deleteSession,
  getSessionStats,
  // New Sefaria dynamic discovery endpoints
  getSefariaIndex,
  getSefariaVersions,
  getSefariaRelated,
  getSefariaTopics,
  getSefariaCalendars,
  getSefariaLexicon,
  getSefariaCommentaries,
  getSefariaRandom
};