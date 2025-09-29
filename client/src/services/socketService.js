import io from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
  }

  connect() {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:8081';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      
      // Rejoin session if we have one
      if (this.sessionId) {
        this.joinSession(this.sessionId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Handle real-time message updates (server emits 'message-received')
    this.socket.on('message-received', (message) => {
      const store = window.chatStore;
      if (store) {
        store.addReceivedMessage(message);
      }
    });

    // Handle typing indicators (server emits 'typing-started' / 'typing-stopped')
    this.socket.on('typing-started', () => {
      const store = window.chatStore;
      if (store) {
        store.setTyping(true);
      }
    });
    this.socket.on('typing-stopped', () => {
      const store = window.chatStore;
      if (store) {
        store.setTyping(false);
      }
    });

    // Handle message status updates
    this.socket.on('message-status-update', ({ messageId, status }) => {
      const store = window.chatStore;
      if (store) {
        store.updateMessageStatus(messageId, status);
      }
    });

    // Handle reference found
    this.socket.on('reference-found', (reference) => {
      const store = window.chatStore;
      if (store) {
        store.addReference(reference);
      }
      
      toast.success('New reference found!', {
        icon: '📚',
        duration: 2000
      });
    });

    // Handle session updates
    this.socket.on('session-update', (update) => {
      console.log('Session update:', update);
    });

    // Handle user joined/left
    this.socket.on('user-joined', ({ timestamp }) => {
      console.log('User joined session at', timestamp);
    });

    this.socket.on('user-left', ({ timestamp }) => {
      console.log('User left session at', timestamp);
    });
  }

  // Join a session room
  joinSession(sessionId) {
    if (this.socket && sessionId) {
      this.sessionId = sessionId;
      this.socket.emit('join-session', sessionId);
    }
  }

  // Leave current session
  leaveSession() {
    if (this.socket && this.sessionId) {
      this.socket.emit('leave-session', this.sessionId);
      this.sessionId = null;
    }
  }

  // Emit typing start
  startTyping(user = 'user') {
    if (this.socket) {
      this.socket.emit('typing-start', { user, sessionId: this.sessionId });
    }
  }

  // Emit typing stop
  stopTyping(user = 'user') {
    if (this.socket) {
      this.socket.emit('typing-stop', { user, sessionId: this.sessionId });
    }
  }

  // Update message status
  updateMessageStatus(messageId, status) {
    if (this.socket) {
      this.socket.emit('message-status', { messageId, status, sessionId: this.sessionId });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();