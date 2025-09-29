const { Server } = require('socket.io');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    const config = require('../config');

    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || config.security.corsOrigin,
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle session join
      socket.on('join-session', (sessionId) => {
        if (sessionId) {
          socket.join(`session-${sessionId}`);
          logger.info(`Socket ${socket.id} joined session ${sessionId}`);

          // Notify others in session
          socket.to(`session-${sessionId}`).emit('user-joined', {
            timestamp: new Date()
          });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        if (data.sessionId) {
          socket.to(`session-${data.sessionId}`).emit('typing-started', {
            user: data.user,
            timestamp: new Date()
          });
        }
      });

      socket.on('typing-stop', (data) => {
        if (data.sessionId) {
          socket.to(`session-${data.sessionId}`).emit('typing-stopped', {
            user: data.user,
            timestamp: new Date()
          });
        }
      });

      // Handle message status updates
      socket.on('message-status', (data) => {
        if (data.sessionId) {
          this.io.to(`session-${data.sessionId}`).emit('message-status-update', {
            messageId: data.messageId,
            status: data.status,
            timestamp: new Date()
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  // Emit events to specific sessions
  emitToSession(sessionId, event, data) {
    if (this.io) {
      this.io.to(`session-${sessionId}`).emit(event, data);
    }
  }

  // Send message update to session
  sendMessageUpdate(sessionId, messageData) {
    this.emitToSession(sessionId, 'message-received', messageData);
  }

  // Send typing status to session
  sendTypingStatus(sessionId, isTyping, user) {
    this.emitToSession(sessionId, isTyping ? 'typing-started' : 'typing-stopped', {
      user,
      timestamp: new Date()
    });
  }

  // Join a socket to a session (called by session service)
  joinSession(sessionId) {
    // This method is called by sessionService but we handle joining in the 'join-session' event
    logger.debug(`Session ${sessionId} ready for WebSocket connections`);
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Get connection info
  getConnectionInfo() {
    if (!this.io) return { connected: 0, rooms: [] };

    const sockets = this.io.sockets.sockets;
    const rooms = this.io.sockets.adapter.rooms;

    return {
      connected: sockets.size,
      rooms: Array.from(rooms.keys()).filter(room => room.startsWith('session-'))
    };
  }
}

// Export singleton instance
module.exports = new SocketService();