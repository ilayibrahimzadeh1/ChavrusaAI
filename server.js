const http = require('http');
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const socketService = require('./src/services/socketService');
const supabaseDb = require('./src/database/supabase');
const { 
    handleUnhandledRejection, 
    handleUncaughtException, 
    handleGracefulShutdown 
} = require('./src/middleware/errorHandler');

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
socketService.initialize(server);

// Start server
server.listen(config.port, () => {
    logger.info('ChavrusaAI server started', {
        port: config.port,
        environment: config.env,
        nodeVersion: process.version,
        pid: process.pid
    });
    
    // Log configuration status
    const configStatus = {
        openaiConfigured: !!config.openai.apiKey && config.openai.apiKey !== 'your-openai-api-key',
        sefariaUrl: config.sefaria.baseUrl,
        sessionMaxAge: config.session.maxAge,
        rateLimitEnabled: true,
        databaseEnabled: true,
        webSocketEnabled: true
    };
    
    logger.info('Configuration status', configStatus);
    
    if (!configStatus.openaiConfigured) {
        logger.warn('OpenAI API key not configured - AI features will not work');
    }
    
    // Note: Supabase PostgreSQL handles cleanup automatically
    // No manual session cleanup needed for Supabase
});

// Handle graceful shutdown
const shutdown = async () => {
    logger.info('Starting graceful shutdown...');
    
    // Note: Supabase connections are managed automatically
    logger.info('Database connections will be cleaned up automatically');
    
    // Close server
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);