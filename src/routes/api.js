const express = require('express');
const chatController = require('../controllers/chatController');
const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');
const translationRoutes = require('./translation');
const {
    validateChatMessage,
    validateSessionCreation,
    validateSessionId,
    validateRabbiSelection,
    validateReferenceRequest
} = require('../middleware/validation');
const { aiRateLimiter } = require('../middleware/security');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// Health check routes
router.get('/health', healthController.healthCheck);
router.get('/health/detailed', healthController.detailedHealthCheck);
router.get('/health/ready', healthController.readinessCheck);
router.get('/health/live', healthController.livenessCheck);
router.get('/metrics', healthController.getMetrics);
router.get('/test', healthController.testEndpoint);

// Authentication routes
router.use('/auth', authController);

// Translation routes
router.use('/translate', translationRoutes);

// Chat routes (with optional authentication)
router.post('/chat/session', optionalAuthMiddleware, validateSessionCreation, chatController.createSession);
router.get('/chat/session/:sessionId', optionalAuthMiddleware, validateSessionId, chatController.getSession);
router.get('/chat/sessions', authMiddleware, chatController.getUserSessions);
router.post('/chat/rabbi', optionalAuthMiddleware, validateRabbiSelection, chatController.setRabbi);
router.post('/chat/message', optionalAuthMiddleware, aiRateLimiter, validateChatMessage, chatController.sendMessage);
router.get('/chat/history/:sessionId', optionalAuthMiddleware, validateSessionId, chatController.getConversationHistory);
router.delete('/chat/session/:sessionId', optionalAuthMiddleware, validateSessionId, chatController.deleteSession);
router.get('/chat/session/:sessionId/stats', optionalAuthMiddleware, validateSessionId, chatController.getSessionStats);

// Rabbi information routes
router.get('/chat/rabbis', chatController.getRabbis);

// Torah reference routes
router.get('/reference/:reference', validateReferenceRequest, chatController.getReference);
router.get('/search', chatController.searchTexts);

// Sefaria dynamic discovery routes
router.get('/sefaria/index', chatController.getSefariaIndex);
router.get('/sefaria/versions/:book', chatController.getSefariaVersions);
router.get('/sefaria/related/:reference', validateReferenceRequest, chatController.getSefariaRelated);
router.get('/sefaria/topics', chatController.getSefariaTopics);
router.get('/sefaria/calendars', chatController.getSefariaCalendars);
router.get('/sefaria/lexicon/:word', chatController.getSefariaLexicon);
router.get('/sefaria/commentaries/:book', chatController.getSefariaCommentaries);
router.get('/sefaria/random', chatController.getSefariaRandom);

module.exports = router;