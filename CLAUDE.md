# CLAUDE.md
DO NOT USE CONSOLE LOGS. LOGS DONT WORK LOGS DONT WORK FUCK CONSOLE LOGS

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChavrusaAI is a modern AI-powered Torah learning platform featuring:
- **Frontend**: React 18 + Vite + TailwindCSS + Zustand state management
- **Backend**: Express.js with SQLite database and Socket.IO for real-time communication
- **AI Integration**: OpenAI GPT-5 with historically accurate rabbi personalities
- **Torah Database**: Sefaria.org API integration for authentic Jewish texts

## Common Development Commands

### Setup and Installation
```bash
# Install all dependencies (root and client)
npm install
cd client && npm install && cd ..

# Copy environment template
cp .env.example .env
# Then edit .env with your OpenAI API key

# Validate configuration
npm run health
```

### Development Workflow
```bash
# Start both backend and frontend in parallel
npm run dev:all

# Start individual servers
npm run dev        # Backend only (port 8081)
npm run client     # Frontend only (port 3003)

# Access points
# Frontend: http://localhost:3003
# Backend API: http://localhost:8081/api
# WebSocket: ws://localhost:8081
```

### Testing and Quality
```bash
# Run tests
npm test                  # All tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Code quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier formatting
```

### Production Build
```bash
# Build client for production
npm run build:client

# Start production server
npm start
```

## Architecture Overview

### High-Level Structure
```
ChavrusaAI/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── components/       # React components (<500 lines each)
│   │   ├── store/           # Zustand state management
│   │   ├── services/        # Frontend services (Socket.IO, API)
│   │   └── App.jsx          # Main app component
├── src/                      # Express.js Backend
│   ├── config/              # Configuration and rabbi personalities
│   ├── services/            # Business logic (AI, database, WebSocket)
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Security, validation, error handling
│   └── routes/              # API route definitions
├── data/                    # SQLite database storage
└── server.js               # Application entry point
```

### Core Services Architecture

**Backend Services (`src/services/`)**:
- `aiService.js` - OpenAI integration with rabbi personalities
- `databaseService.js` - SQLite operations (sessions, messages, references)
- `socketService.js` - WebSocket management for real-time features
- `sessionService.js` - Session management and conversation context
- `sefariaService.js` - Torah text retrieval from Sefaria API

**Frontend State Management**:
- `chatStore.js` - Chat state, messages, and session management
- `authStore.js` - User authentication state (Supabase integration)

### Rabbi Personality System

Rabbi personalities are defined in `src/config/rabbis.js` with detailed system prompts:
- **Rashi** - 11th century commentator, focuses on peshat (literal meaning)
- **Rambam** - 12th century philosopher, rational approach
- **Rabbi Yosef Caro** - 16th century halakhic authority
- **Baal Shem Tov** - 18th century Hasidic founder, spiritual approach
- **Rabbi Soloveitchik** - 20th century Modern Orthodox philosopher
- **Arizal** - 16th century Kabbalistic master

Each rabbi has unique specialties, era context, and teaching style encoded in their system prompts.

### Database Schema (SQLite)

**Sessions Table**:
- Stores chat sessions with rabbi context and activity tracking
- Fields: id, rabbi, created_at, last_activity, context

**Messages Table**:
- Stores all user and AI messages with status tracking
- Fields: id, session_id, content, is_user, status, references, created_at

**References Table**:
- Stores Torah references found in conversations
- Fields: id, session_id, reference, text, url, created_at

### Real-time Features (Socket.IO)

- **Typing indicators** - Shows when AI is processing
- **Message status** - Tracks sending/delivered/failed states
- **Session synchronization** - Keeps multiple clients in sync
- **Connection monitoring** - Real-time connection status updates

## Key Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your-key-here

# Server
PORT=8081
NODE_ENV=development

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3003

# Optional Supabase (for auth)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Database Location
- Development: `./data/chavrusa.db`
- Configurable via `DATABASE_DIR` environment variable

## Important Development Notes

### Code Organization Principles
- **All components under 500 lines** - Enforced modular architecture
- **Service layer separation** - Business logic isolated from controllers
- **Error handling** - Comprehensive error recovery with user-friendly messages
- **Security first** - Input validation, rate limiting, CORS, security headers

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for API endpoints
- Frontend component testing with React Testing Library
- Test fixtures and mocks in `tests/fixtures/`

### Adding New Features

**New Rabbi Personality**:
1. Add to `src/config/rabbis.js` with system prompt
2. Add rabbi image to `client/src/assets/images/`
3. Update frontend rabbi selection UI

**New API Endpoint**:
1. Create controller in `src/controllers/`
2. Add route in `src/routes/api.js`
3. Add validation middleware if needed
4. Write integration tests

**Frontend Component**:
1. Create in `client/src/components/`
2. Follow existing patterns (Zustand for state, TailwindCSS for styling)
3. Keep under 500 lines
4. Add to appropriate parent component

### Security Considerations
- All user inputs are validated and sanitized
- Rate limiting prevents API abuse
- CORS configured for frontend origin only
- Security headers via Helmet.js
- Never expose OpenAI API key to frontend

### Performance Notes
- Database cleanup runs every 4 hours (configurable)
- WebSocket connections are monitored and cleaned up
- Static assets served with caching headers
- Compression middleware enabled
- Client-side state persistence with Zustand

## Common Issues and Solutions

### OpenAI API Issues
- Verify API key is set in `.env`
- Check API credits/usage limits
- Monitor rate limiting (status 429)

### Database Issues
- Ensure `./data/` directory exists and is writable
- Check SQLite database file permissions
- Use `npm run health` to validate configuration

### WebSocket Connection Issues
- Verify CORS settings match client URL
- Check firewall settings for WebSocket ports
- Monitor connection status in browser dev tools

### Frontend Build Issues
- Ensure Node.js version 16+ is installed
- Clear `node_modules` and reinstall if needed
- Check Vite configuration in `client/vite.config.js`

This codebase follows modern full-stack development practices with emphasis on modularity, security, and user experience. All components are designed to be maintainable and under 500 lines as specified in the architecture requirements.