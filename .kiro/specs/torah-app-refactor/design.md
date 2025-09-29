# Design Document

## Overview

The Torah Learning Partner application will be refactored from a monolithic single-file structure into a well-organized, maintainable Node.js application with proper separation of concerns. The application provides an AI-powered Torah study experience with different rabbi personalities, integrating with the Sefaria API for Torah texts and OpenAI for intelligent responses.

## Architecture

### High-Level Architecture

The application follows a layered architecture pattern:

```
┌─────────────────┐
│   Frontend      │ (HTML/CSS/JS)
├─────────────────┤
│   API Layer     │ (Express Routes)
├─────────────────┤
│  Service Layer  │ (Business Logic)
├─────────────────┤
│  Data Layer     │ (Session Management)
├─────────────────┤
│ External APIs   │ (OpenAI, Sefaria)
└─────────────────┘
```

### Project Structure

```
torah-learning-app/
├── src/
│   ├── config/
│   │   ├── index.js              # Configuration management
│   │   └── rabbis.js             # Rabbi personas configuration
│   ├── controllers/
│   │   ├── chatController.js     # Chat endpoint handlers
│   │   └── healthController.js   # Health check endpoints
│   ├── services/
│   │   ├── aiService.js          # OpenAI integration
│   │   ├── sefariaService.js     # Sefaria API integration
│   │   ├── sessionService.js     # Session management
│   │   └── referenceService.js   # Torah reference detection
│   ├── middleware/
│   │   ├── errorHandler.js       # Global error handling
│   │   ├── validation.js         # Input validation
│   │   └── security.js           # Security middleware
│   ├── routes/
│   │   ├── api.js                # API routes
│   │   └── index.js              # Route aggregation
│   ├── utils/
│   │   ├── logger.js             # Logging utility
│   │   └── helpers.js            # Common helper functions
│   └── app.js                    # Express app configuration
├── public/
│   ├── css/
│   │   └── styles.css            # Main stylesheet
│   ├── js/
│   │   ├── app.js                # Main application logic
│   │   ├── ui.js                 # UI management
│   │   └── api.js                # API communication
│   ├── images/                   # Rabbi images and assets
│   └── index.html                # Main HTML file
├── tests/
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── docs/
│   └── api.md                    # API documentation
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js                     # Application entry point
```

## Components and Interfaces

### Backend Components

#### 1. Configuration Management (`src/config/`)

**Purpose:** Centralized configuration management with environment variable support.

**Key Features:**
- Environment-specific configurations
- Validation of required configuration values
- Default values for development
- Secure API key management

**Interface:**
```javascript
// config/index.js
module.exports = {
  port: process.env.PORT || 3000,
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 1000
  },
  sefaria: {
    baseUrl: 'https://www.sefaria.org/api',
    timeout: 5000
  },
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000 // 1 hour
  }
};
```

#### 2. AI Service (`src/services/aiService.js`)

**Purpose:** Handles all OpenAI API interactions with proper error handling and retry logic.

**Key Features:**
- Rabbi persona management
- Context-aware conversation handling
- Error handling and fallback responses
- Token usage optimization

**Interface:**
```javascript
class AIService {
  async generateResponse(message, rabbi, sessionContext, references = [])
  async validateApiKey()
  getRabbiPersona(rabbiName)
  buildConversationContext(sessionHistory, references)
}
```

#### 3. Sefaria Service (`src/services/sefariaService.js`)

**Purpose:** Integrates with Sefaria API for Torah text retrieval and reference validation.

**Key Features:**
- Torah reference detection and validation
- Text retrieval with caching
- Commentary and translation support
- Rate limiting and error handling

**Interface:**
```javascript
class SefariaService {
  async getTextByReference(reference)
  async searchTexts(query)
  validateReference(reference)
  parseReference(referenceString)
  async getCommentary(reference, commentator)
}
```

#### 4. Session Service (`src/services/sessionService.js`)

**Purpose:** Manages user sessions and conversation history with memory cleanup.

**Key Features:**
- Session creation and management
- Conversation history storage
- Memory cleanup for inactive sessions
- Context preservation

**Interface:**
```javascript
class SessionService {
  createSession()
  getSession(sessionId)
  updateSession(sessionId, data)
  addMessage(sessionId, message, isUser)
  getConversationHistory(sessionId)
  cleanupInactiveSessions()
}
```

#### 5. Reference Service (`src/services/referenceService.js`)

**Purpose:** Detects and processes Torah references in user messages and AI responses.

**Key Features:**
- Advanced reference pattern matching
- Reference normalization
- Context-aware reference suggestions
- Integration with Sefaria service

**Interface:**
```javascript
class ReferenceService {
  detectReferences(text)
  normalizeReference(reference)
  async enrichWithContext(references)
  suggestRelatedReferences(reference)
}
```

### Frontend Components

#### 1. Main Application (`public/js/app.js`)

**Purpose:** Core application logic and state management.

**Key Features:**
- Application initialization
- State management
- Event coordination
- Error handling

#### 2. UI Management (`public/js/ui.js`)

**Purpose:** Handles all user interface interactions and updates.

**Key Features:**
- Message rendering
- Rabbi selection interface
- Loading states and animations
- Responsive design handling

#### 3. API Communication (`public/js/api.js`)

**Purpose:** Manages all client-server communication.

**Key Features:**
- HTTP request handling
- Error handling and retry logic
- Response processing
- Connection status monitoring

## Data Models

### Session Model
```javascript
{
  id: String,
  createdAt: Date,
  lastActivity: Date,
  rabbi: String,
  messages: [
    {
      content: String,
      isUser: Boolean,
      timestamp: Date,
      references: [String]
    }
  ],
  context: {
    recentReferences: [String],
    topics: [String]
  }
}
```

### Reference Model
```javascript
{
  reference: String,        // "Genesis 1:1"
  normalizedRef: String,    // "Genesis.1.1"
  text: String,
  translation: String,
  commentary: Object,
  source: String,           // "sefaria"
  cachedAt: Date
}
```

### Rabbi Persona Model
```javascript
{
  name: String,
  displayName: String,
  era: String,
  description: String,
  systemPrompt: String,
  image: String,
  specialties: [String]
}
```

## Error Handling

### Error Categories

1. **Client Errors (4xx)**
   - Invalid input validation
   - Missing required parameters
   - Authentication issues

2. **Server Errors (5xx)**
   - External API failures
   - Database connection issues
   - Internal processing errors

3. **External API Errors**
   - OpenAI API failures
   - Sefaria API unavailability
   - Network timeouts

### Error Response Format
```javascript
{
  error: {
    code: String,           // "INVALID_INPUT", "API_UNAVAILABLE"
    message: String,        // User-friendly message
    details: String,        // Technical details (dev mode only)
    timestamp: Date,
    requestId: String
  }
}
```

### Error Handling Strategy

1. **Graceful Degradation:** When external APIs fail, provide fallback responses
2. **User-Friendly Messages:** Convert technical errors to understandable language
3. **Retry Logic:** Implement exponential backoff for transient failures
4. **Logging:** Comprehensive error logging for debugging
5. **Circuit Breaker:** Prevent cascading failures from external services

## Testing Strategy

### Unit Testing
- Service layer functions
- Utility functions
- Configuration validation
- Reference detection algorithms

### Integration Testing
- API endpoint testing
- External API integration
- Session management
- End-to-end conversation flows

### Frontend Testing
- UI component functionality
- API communication
- Error handling
- Responsive design

### Testing Tools
- **Backend:** Jest, Supertest
- **Frontend:** Jest, Testing Library
- **E2E:** Playwright or Cypress
- **API Testing:** Postman/Newman

## Security Considerations

### Input Validation
- Sanitize all user inputs
- Validate message length and content
- Prevent injection attacks
- Rate limiting on API endpoints

### API Security
- Secure API key storage
- Environment variable validation
- HTTPS enforcement
- CORS configuration

### Session Security
- Secure session identifiers
- Session timeout handling
- Memory cleanup for sensitive data
- Input sanitization

### Headers and Middleware
```javascript
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## Performance Optimization

### Caching Strategy
- **Sefaria API responses:** Cache frequently requested texts
- **AI responses:** Cache common questions and responses
- **Static assets:** Proper browser caching headers
- **Session data:** In-memory storage with cleanup

### Response Optimization
- **Streaming responses:** For long AI-generated content
- **Compression:** Gzip compression for API responses
- **Minification:** CSS and JavaScript minification
- **Image optimization:** Optimized rabbi images

### Resource Management
- **Connection pooling:** For external API calls
- **Memory management:** Regular cleanup of inactive sessions
- **Rate limiting:** Prevent abuse and manage resources
- **Lazy loading:** Load rabbi personas on demand

## Deployment Considerations

### Environment Configuration
- Development, staging, and production configurations
- Environment variable validation
- Secure secret management
- Health check endpoints

### Monitoring and Logging
- Application performance monitoring
- Error tracking and alerting
- API usage metrics
- User interaction analytics

### Scalability
- Stateless application design
- Session storage externalization (Redis for production)
- Load balancer compatibility
- Horizontal scaling support