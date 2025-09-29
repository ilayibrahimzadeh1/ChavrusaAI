const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    const dbPath = this.initializeDatabasePath();
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  initializeDatabasePath() {
    try {
      // Get database path from environment or use secure default
      const dbDir = process.env.DATABASE_DIR || path.join(__dirname, '../../data');
      const dbName = process.env.DATABASE_NAME || 'chavrusa.db';

      // Validate and sanitize the directory path
      const resolvedDir = path.resolve(dbDir);

      // Security check: ensure path doesn't escape expected directories
      const expectedBase = path.resolve(__dirname, '../..');
      if (!resolvedDir.startsWith(expectedBase)) {
        throw new Error('Database directory path is outside allowed scope');
      }

      // Create directory if it doesn't exist
      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true, mode: 0o755 });
        logger.info('Created database directory', { path: resolvedDir });
      }

      // Validate directory is writable
      try {
        fs.accessSync(resolvedDir, fs.constants.W_OK);
      } catch (error) {
        throw new Error(`Database directory is not writable: ${resolvedDir}`);
      }

      const dbPath = path.join(resolvedDir, dbName);
      logger.info('Database path initialized', { path: dbPath });

      return dbPath;

    } catch (error) {
      logger.error('Failed to initialize database path', { error: error.message });
      throw error;
    }
  }

  initializeTables() {
    try {
      // Sessions table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          rabbi TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          context TEXT
        )
      `);

      // Messages table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          content TEXT NOT NULL,
          is_user BOOLEAN NOT NULL,
          status TEXT DEFAULT 'delivered',
          message_references TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `);

      // References table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS torah_references (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          reference TEXT NOT NULL,
          text TEXT,
          url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `);

      // WebSocket sessions table for persistent session tracking
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS websocket_sessions (
          socket_id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          ip_address TEXT,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `);

      // Create indexes
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_references_session ON torah_references(session_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
        CREATE INDEX IF NOT EXISTS idx_websocket_sessions_session ON websocket_sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_websocket_sessions_activity ON websocket_sessions(last_activity);
      `);

      logger.info('Database tables initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  // Helper method for safe JSON parsing
  safeJsonParse(jsonString, fallback = null) {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return fallback;
      }
      return JSON.parse(jsonString);
    } catch (error) {
      logger.warn('Failed to parse JSON, using fallback', {
        error: error.message,
        fallback
      });
      return fallback;
    }
  }

  // Database transaction wrapper for atomic operations
  executeTransaction(operations) {
    const transaction = this.db.transaction(() => {
      for (const operation of operations) {
        operation();
      }
    });

    try {
      return transaction();
    } catch (error) {
      logger.error('Transaction failed', { error: error.message });
      throw error;
    }
  }

  // Session methods
  createSession(sessionId, rabbi = null) {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, rabbi, context)
      VALUES (?, ?, ?)
    `);
    
    const context = JSON.stringify({
      recentReferences: [],
      topics: [],
      conversationSummary: ''
    });
    
    const result = stmt.run(sessionId, rabbi, context);
    return result.changes > 0;
  }

  getSession(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `);
    
    const session = stmt.get(sessionId);
    if (session) {
      session.context = this.safeJsonParse(session.context, {
        recentReferences: [],
        topics: [],
        conversationSummary: ''
      });
    }
    return session;
  }

  updateSession(sessionId, updates) {
    const { rabbi, context } = updates;
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET rabbi = COALESCE(?, rabbi),
          context = COALESCE(?, context),
          last_activity = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const contextStr = context ? JSON.stringify(context) : null;
    const result = stmt.run(rabbi, contextStr, sessionId);
    return result.changes > 0;
  }

  deleteSession(sessionId) {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE id = ?
    `);
    
    const result = stmt.run(sessionId);
    return result.changes > 0;
  }

  // Message methods
  addMessage(sessionId, content, isUser, status = 'delivered', references = []) {
    return this.executeTransaction([
      () => {
        const stmt = this.db.prepare(`
          INSERT INTO messages (session_id, content, is_user, status, message_references)
          VALUES (?, ?, ?, ?, ?)
        `);

        const referencesStr = JSON.stringify(references);
        const result = stmt.run(sessionId, content, isUser ? 1 : 0, status, referencesStr);

        // Update session last activity within the same transaction
        const updateStmt = this.db.prepare(`
          UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?
        `);
        updateStmt.run(sessionId);

        return result.lastInsertRowid;
      }
    ]);
  }

  getMessages(sessionId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    const messages = stmt.all(sessionId, limit);
    return messages.map(msg => ({
      ...msg,
      is_user: Boolean(msg.is_user),
      references: this.safeJsonParse(msg.message_references, [])
    })).reverse();
  }

  updateMessageStatus(messageId, status) {
    const stmt = this.db.prepare(`
      UPDATE messages SET status = ? WHERE id = ?
    `);
    
    const result = stmt.run(status, messageId);
    return result.changes > 0;
  }

  // Reference methods
  addReference(sessionId, reference, text, url) {
    const stmt = this.db.prepare(`
      INSERT INTO torah_references (session_id, reference, text, url)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(sessionId, reference, text, url);
    return result.lastInsertRowid;
  }

  getReferences(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM torah_references 
      WHERE session_id = ?
      ORDER BY created_at DESC
    `);
    
    return stmt.all(sessionId);
  }

  // Utility methods
  updateSessionActivity(sessionId) {
    const stmt = this.db.prepare(`
      UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?
    `);
    
    stmt.run(sessionId);
  }

  getSessionStats(sessionId) {
    const messageCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE session_id = ?
    `).get(sessionId);
    
    const referenceCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM torah_references WHERE session_id = ?
    `).get(sessionId);
    
    const userMessages = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND is_user = 1
    `).get(sessionId);
    
    const aiMessages = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND is_user = 0
    `).get(sessionId);
    
    return {
      totalMessages: messageCount.count,
      userMessages: userMessages.count,
      aiMessages: aiMessages.count,
      totalReferences: referenceCount.count
    };
  }

  getAllSessions(limit = 20) {
    const stmt = this.db.prepare(`
      SELECT s.*, 
             COUNT(m.id) as message_count,
             MAX(m.created_at) as last_message
      FROM sessions s
      LEFT JOIN messages m ON s.id = m.session_id
      GROUP BY s.id
      ORDER BY s.last_activity DESC
      LIMIT ?
    `);
    
    const sessions = stmt.all(limit);
    return sessions.map(session => ({
      ...session,
      context: this.safeJsonParse(session.context, {
        recentReferences: [],
        topics: [],
        conversationSummary: ''
      })
    }));
  }

  cleanupOldSessions(daysOld = 30) {
    const stmt = this.db.prepare(`
      DELETE FROM sessions 
      WHERE last_activity < datetime('now', '-' || ? || ' days')
    `);
    
    const result = stmt.run(daysOld);
    logger.info(`Cleaned up ${result.changes} old sessions`);
    return result.changes;
  }

  // WebSocket session methods
  addWebSocketSession(socketId, sessionId, userAgent = null, ipAddress = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO websocket_sessions (socket_id, session_id, user_agent, ip_address)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(socketId, sessionId, userAgent, ipAddress);
    return result.changes > 0;
  }

  getWebSocketSession(socketId) {
    const stmt = this.db.prepare(`
      SELECT * FROM websocket_sessions WHERE socket_id = ?
    `);

    return stmt.get(socketId);
  }

  updateWebSocketActivity(socketId) {
    const stmt = this.db.prepare(`
      UPDATE websocket_sessions SET last_activity = CURRENT_TIMESTAMP WHERE socket_id = ?
    `);

    const result = stmt.run(socketId);
    return result.changes > 0;
  }

  removeWebSocketSession(socketId) {
    const stmt = this.db.prepare(`
      DELETE FROM websocket_sessions WHERE socket_id = ?
    `);

    const result = stmt.run(socketId);
    return result.changes > 0;
  }

  getActiveWebSocketSessions(sessionId) {
    const stmt = this.db.prepare(`
      SELECT socket_id FROM websocket_sessions
      WHERE session_id = ? AND last_activity > datetime('now', '-5 minutes')
    `);

    return stmt.all(sessionId).map(row => row.socket_id);
  }

  cleanupInactiveWebSocketSessions(minutesOld = 30) {
    const stmt = this.db.prepare(`
      DELETE FROM websocket_sessions
      WHERE last_activity < datetime('now', '-' || ? || ' minutes')
    `);

    const result = stmt.run(minutesOld);
    logger.info(`Cleaned up ${result.changes} inactive WebSocket sessions`);
    return result.changes;
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();