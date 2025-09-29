# Development Guide

## Project Structure

### Overview
The Torah Learning App follows a modular architecture with clear separation of concerns:

```
torah-learning-app/
├── src/                    # Backend source code
│   ├── config/            # Configuration management
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   └── utils/            # Helper functions
├── public/               # Frontend assets
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript modules
│   ├── images/          # Static images
│   └── index.html       # Main HTML file
├── tests/               # Test files
├── docs/                # Documentation
└── server.js            # Application entry point
```

### Backend Architecture

#### Configuration Layer (`src/config/`)
- **index.js**: Main configuration with environment variables
- **rabbis.js**: Rabbi personality definitions and system prompts

#### Service Layer (`src/services/`)
- **aiService.js**: OpenAI integration and response generation
- **sefariaService.js**: Sefaria API integration and Torah text retrieval
- **sessionService.js**: Session management and conversation history
- **referenceService.js**: Torah reference detection and processing

#### Controller Layer (`src/controllers/`)
- **chatController.js**: Chat-related endpoints
- **healthController.js**: Health check and monitoring endpoints

#### Middleware Layer (`src/middleware/`)
- **security.js**: Security headers, rate limiting, CORS
- **validation.js**: Input validation and sanitization
- **errorHandler.js**: Global error handling and recovery

#### Route Layer (`src/routes/`)
- **api.js**: API route definitions
- **index.js**: Route aggregation

#### Utilities (`src/utils/`)
- **logger.js**: Logging utility with different levels
- **helpers.js**: Common helper functions

### Frontend Architecture

#### Modular JavaScript
- **api.js**: API communication with error handling
- **ui.js**: UI management and DOM manipulation
- **app.js**: Main application logic and state management

#### CSS Organization
- **styles.css**: Comprehensive stylesheet with CSS variables
- Responsive design with mobile-first approach
- Component-based styling

## Development Setup

### Prerequisites
- Node.js 16.0.0+
- npm 8.0.0+
- Git
- Code editor (VS Code recommended)

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd torah-learning-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

### Environment Configuration
```env
# Required
OPENAI_API_KEY=your-openai-api-key-here

# Optional (with defaults)
PORT=3000
NODE_ENV=development
OPENAI_MODEL=gpt-4
MAX_TOKENS=1000
LOG_LEVEL=info
```

### Development Commands
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format

# Validate configuration
npm run health
```

## Code Style and Standards

### JavaScript Style Guide
- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use async/await over Promises
- Follow camelCase naming convention
- Add JSDoc comments for functions

#### Example Function Documentation
```javascript
/**
 * Generate AI response for user message
 * @param {string} message - User's message
 * @param {string} rabbi - Selected rabbi name
 * @param {Object} sessionContext - Session context and history
 * @param {Array} references - Torah references with text
 * @returns {Promise<string>} AI-generated response
 */
async function generateResponse(message, rabbi, sessionContext, references) {
  // Implementation
}
```

### Error Handling Patterns
```javascript
// Service layer error handling
try {
  const result = await externalService.call();
  return result;
} catch (error) {
  logger.error('Service call failed', { error: error.message });
  throw new ExternalServiceError('Service', error.message);
}

// Controller layer error handling
const someEndpoint = catchAsync(async (req, res) => {
  const result = await someService.process(req.body);
  res.status(200).json({ success: true, data: result });
});
```

### Logging Standards
```javascript
// Use structured logging
logger.info('User action completed', {
  userId: user.id,
  action: 'message_sent',
  sessionId: session.id,
  duration: Date.now() - startTime
});

// Log levels
logger.error('Critical error', { error: error.message });
logger.warn('Warning condition', { condition: 'rate_limit_approaching' });
logger.info('Normal operation', { operation: 'session_created' });
logger.debug('Debug information', { debugData: complexObject });
```

## Testing Strategy

### Test Structure
```
tests/
├── unit/                 # Unit tests
│   ├── services/        # Service layer tests
│   ├── controllers/     # Controller tests
│   └── utils/           # Utility function tests
├── integration/         # Integration tests
│   ├── api/            # API endpoint tests
│   └── external/       # External service tests
└── fixtures/           # Test data and mocks
```

### Writing Tests
```javascript
// Unit test example
describe('SessionService', () => {
  let sessionService;

  beforeEach(() => {
    sessionService = new SessionService();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const sessionId = sessionService.createSession();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(32);
    });

    it('should initialize session with correct structure', () => {
      const sessionId = sessionService.createSession();
      const session = sessionService.getSession(sessionId);
      
      expect(session).toMatchObject({
        id: sessionId,
        createdAt: expect.any(Date),
        lastActivity: expect.any(Date),
        rabbi: null,
        messages: [],
        context: {
          recentReferences: [],
          topics: []
        }
      });
    });
  });
});

// Integration test example
describe('Chat API', () => {
  let app;

  beforeAll(async () => {
    app = require('../src/app');
  });

  describe('POST /api/chat/message', () => {
    it('should create session and return AI response', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .send({
          message: 'What is Genesis 1:1?',
          rabbi: 'Rashi'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          sessionId: expect.any(String),
          userMessage: 'What is Genesis 1:1?',
          aiResponse: expect.any(String),
          rabbi: 'Rashi'
        }
      });
    });
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/services/sessionService.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Adding New Features

### Adding a New Rabbi
1. **Update Rabbi Configuration**
   ```javascript
   // src/config/rabbis.js
   const rabbiPersonas = {
     // ... existing rabbis
     "New Rabbi": {
       name: "New Rabbi",
       displayName: "Rabbi Name",
       era: "Time period",
       description: "Brief description",
       image: "rabbi-image.png",
       specialties: ["Specialty 1", "Specialty 2"],
       systemPrompt: `Detailed system prompt...`
     }
   };
   ```

2. **Add Rabbi Image**
   - Place image in `public/images/`
   - Update frontend rabbi info in `public/js/ui.js`

3. **Test the New Rabbi**
   - Create test conversations
   - Verify personality consistency
   - Test with various Torah topics

### Adding a New API Endpoint
1. **Create Controller Method**
   ```javascript
   // src/controllers/newController.js
   const newEndpoint = catchAsync(async (req, res) => {
     const result = await newService.process(req.body);
     res.status(200).json({
       success: true,
       data: result,
       requestId: req.requestId
     });
   });
   ```

2. **Add Route**
   ```javascript
   // src/routes/api.js
   router.post('/new-endpoint', validateInput, newController.newEndpoint);
   ```

3. **Add Validation**
   ```javascript
   // src/middleware/validation.js
   const validateNewInput = (req, res, next) => {
     // Validation logic
     next();
   };
   ```

4. **Write Tests**
   ```javascript
   // tests/integration/api/newEndpoint.test.js
   describe('POST /api/new-endpoint', () => {
     it('should process request successfully', async () => {
       // Test implementation
     });
   });
   ```

### Adding Frontend Features
1. **Extend UI Manager**
   ```javascript
   // public/js/ui.js
   class UIManager {
     newFeature() {
       // Implementation
     }
   }
   ```

2. **Add API Methods**
   ```javascript
   // public/js/api.js
   class APIClient {
     async newApiCall(data) {
       return this.post('/new-endpoint', data);
     }
   }
   ```

3. **Update Main App**
   ```javascript
   // public/js/app.js
   class TorahLearningApp {
     handleNewFeature() {
       // Feature logic
     }
   }
   ```

## Debugging

### Backend Debugging
```javascript
// Enable debug logging
LOG_LEVEL=debug npm run dev

// Use debugger
const debugger = require('debug')('torah-app:service');
debugger('Processing message', { messageId, sessionId });

// Console debugging
console.log('Debug info:', { variable1, variable2 });
```

### Frontend Debugging
```javascript
// Browser console
console.log('State:', app.getState());
console.log('API Response:', response);

// Network tab in DevTools
// Check API requests and responses

// Application tab in DevTools
// Check localStorage and sessionStorage
```

### Common Issues

#### OpenAI API Issues
```javascript
// Check API key configuration
if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key') {
  logger.error('OpenAI API key not configured');
}

// Handle rate limits
if (error.status === 429) {
  logger.warn('OpenAI rate limit exceeded');
  // Implement backoff strategy
}
```

#### Sefaria API Issues
```javascript
// Handle network timeouts
const response = await axios.get(url, { timeout: 5000 });

// Handle invalid references
if (!sefariaService.validateReference(reference)) {
  throw new ValidationError('Invalid Torah reference format');
}
```

## Performance Optimization

### Backend Optimization
- **Caching**: Implement Redis for production
- **Database**: Consider PostgreSQL for persistence
- **Clustering**: Use PM2 for multi-process deployment
- **Monitoring**: Add APM tools like New Relic

### Frontend Optimization
- **Bundling**: Consider webpack for production builds
- **Lazy Loading**: Load rabbi personalities on demand
- **Caching**: Implement service worker for offline support
- **Minification**: Minify CSS and JavaScript

## Security Considerations

### Input Validation
```javascript
// Always validate and sanitize inputs
const { validateMessage, sanitizeInput } = require('../utils/helpers');

const validation = validateMessage(req.body.message);
if (!validation.valid) {
  return res.status(400).json({ error: validation.error });
}

req.body.message = sanitizeInput(req.body.message);
```

### Rate Limiting
```javascript
// Implement different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // requests per window
});
```

### Error Handling
```javascript
// Never expose sensitive information
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId: req.requestId
      }
    });
  } else {
    // Don't leak error details
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        requestId: req.requestId
      }
    });
  }
};
```

## Deployment Preparation

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Load balancer configured
- [ ] CDN setup for static assets
- [ ] Error tracking enabled

### Docker Configuration
```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Deployment commands
```

## Contributing Guidelines

### Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes with tests
4. Run test suite: `npm test`
5. Run linting: `npm run lint`
6. Commit with descriptive message
7. Push to fork and create PR

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Error handling implemented
- [ ] Logging added where appropriate

### Commit Message Format
```
type(scope): description

body (optional)

footer (optional)
```

Examples:
- `feat(chat): add new rabbi personality`
- `fix(api): handle sefaria timeout errors`
- `docs(readme): update installation instructions`
- `test(session): add session cleanup tests`