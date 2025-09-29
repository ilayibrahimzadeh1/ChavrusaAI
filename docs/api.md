# API Documentation

## Overview

The Torah Learning App provides a RESTful API for managing chat sessions, rabbi interactions, and Torah reference lookups. All API endpoints return JSON responses and use standard HTTP status codes.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required. Rate limiting is applied to prevent abuse.

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **AI Endpoints**: 10 requests per minute per IP

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "abc123"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `EXTERNAL_SERVICE_ERROR`: Third-party service unavailable
- `INTERNAL_ERROR`: Server error

## Endpoints

### Health Check

#### GET /api/health

Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "requestId": "abc123"
}
```

#### GET /api/health/detailed

Detailed health check with service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "ai": {
      "status": "healthy",
      "connectionTest": true,
      "apiKeyConfigured": true
    },
    "sefaria": {
      "status": "healthy",
      "connectionTest": true
    },
    "session": {
      "status": "healthy",
      "totalSessions": 5
    }
  },
  "system": {
    "memory": {
      "used": 45,
      "total": 128
    }
  }
}
```

### Chat Sessions

#### POST /api/chat/session

Create a new chat session.

**Request Body:**
```json
{
  "rabbi": "Rashi"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123def456",
    "rabbi": "Rashi",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "message": "Session created with Rashi"
  }
}
```

#### GET /api/chat/session/:sessionId

Get session information.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123def456",
    "rabbi": "Rashi",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastActivity": "2024-01-01T00:05:00.000Z",
    "messageCount": 4,
    "recentReferences": ["Genesis 1:1", "Exodus 20:1"]
  }
}
```

#### DELETE /api/chat/session/:sessionId

Delete a session.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123def456",
    "message": "Session deleted successfully"
  }
}
```

### Rabbi Management

#### POST /api/chat/rabbi

Set or change rabbi for a session.

**Request Body:**
```json
{
  "sessionId": "abc123def456",
  "rabbi": "Rambam"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123def456",
    "rabbi": "Rambam",
    "rabbiInfo": {
      "name": "Rambam",
      "displayName": "Rambam (Maimonides)",
      "era": "12th century Spain/Egypt",
      "description": "Rational philosopher",
      "specialties": ["Jewish Philosophy", "Halakha"]
    },
    "message": "Now learning with Rambam (Maimonides)"
  }
}
```

#### GET /api/chat/rabbis

Get list of available rabbis.

**Response:**
```json
{
  "success": true,
  "data": {
    "rabbis": [
      {
        "name": "Rashi",
        "displayName": "Rashi",
        "era": "11th century France",
        "description": "Clear, concise commentator",
        "specialties": ["Torah Commentary", "Talmud", "Peshat"],
        "image": "rashi ai.png"
      }
    ],
    "count": 6
  }
}
```

### Chat Messages

#### POST /api/chat/message

Send a message and get AI response.

**Request Body:**
```json
{
  "message": "What does Genesis 1:1 mean?",
  "sessionId": "abc123def456",
  "rabbi": "Rashi"  // Optional, will use session's current rabbi
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123def456",
    "userMessage": "What does Genesis 1:1 mean?",
    "aiResponse": "In the beginning of God's creating...",
    "rabbi": "Rashi",
    "rabbiInfo": {
      "name": "Rashi",
      "displayName": "Rashi"
    },
    "references": [
      {
        "reference": "Genesis 1:1",
        "text": "In the beginning God created the heaven and the earth.",
        "url": "https://www.sefaria.org/Genesis.1.1"
      }
    ],
    "detectedReferences": ["Genesis 1:1"],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Conversation History

#### GET /api/chat/history/:sessionId

Get conversation history for a session.

**Query Parameters:**
- `limit`: Number of messages to return (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123def456",
    "messages": [
      {
        "content": "What does Genesis 1:1 mean?",
        "isUser": true,
        "timestamp": "2024-01-01T00:00:00.000Z",
        "references": []
      },
      {
        "content": "In the beginning of God's creating...",
        "isUser": false,
        "timestamp": "2024-01-01T00:00:30.000Z",
        "references": ["Genesis 1:1"]
      }
    ],
    "totalMessages": 2,
    "rabbi": "Rashi"
  }
}
```

### Torah References

#### GET /api/reference/:reference

Get Torah text for a specific reference.

**Parameters:**
- `reference`: Torah reference (e.g., "Genesis 1:1")

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "Genesis 1:1",
    "originalReference": "Genesis 1:1",
    "book": "Genesis",
    "chapter": 1,
    "verse": 1,
    "text": "In the beginning God created the heaven and the earth.",
    "hebrew": "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    "translation": "In the beginning God created the heaven and the earth.",
    "source": "sefaria",
    "url": "https://www.sefaria.org/Genesis.1.1",
    "retrievedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/search

Search Torah texts.

**Query Parameters:**
- `q`: Search query (required)
- `limit`: Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "creation",
    "results": [
      {
        "ref": "Genesis 1:1",
        "text": "In the beginning God created...",
        "score": 0.95
      }
    ],
    "count": 1
  }
}
```

### Session Statistics

#### GET /api/chat/session/:sessionId/stats

Get detailed session statistics.

**Response:**
```json
{
  "sessionId": "abc123def456",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastActivity": "2024-01-01T00:05:00.000Z",
  "duration": 300,
  "totalMessages": 4,
  "userMessages": 2,
  "rabbiMessages": 2,
  "currentRabbi": "Rashi",
  "recentReferences": 3
}
```

### Utility Endpoints

#### GET /api/test

Simple connectivity test.

**Response:**
```json
{
  "message": "Torah Learning App API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

#### GET /api/metrics

Get application metrics.

**Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "system": {
    "memory": {
      "rss": 45000000,
      "heapTotal": 30000000,
      "heapUsed": 25000000
    },
    "cpu": {
      "user": 1000000,
      "system": 500000
    }
  },
  "application": {
    "environment": "development",
    "version": "1.0.0",
    "activeSessions": 5
  },
  "services": {
    "ai": {
      "model": "gpt-4",
      "apiKeyConfigured": true
    },
    "sefaria": {
      "baseUrl": "https://www.sefaria.org/api",
      "cacheSize": 25
    }
  }
}
```

## WebSocket Support

Currently not implemented, but planned for future versions to support real-time features.

## SDK Examples

### JavaScript/Node.js

```javascript
const API_BASE = 'http://localhost:3000/api';

class TorahLearningAPI {
  async createSession(rabbi = null) {
    const response = await fetch(`${API_BASE}/chat/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rabbi })
    });
    return response.json();
  }

  async sendMessage(sessionId, message, rabbi = null) {
    const response = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, rabbi })
    });
    return response.json();
  }

  async getReference(reference) {
    const response = await fetch(`${API_BASE}/reference/${encodeURIComponent(reference)}`);
    return response.json();
  }
}

// Usage
const api = new TorahLearningAPI();
const session = await api.createSession('Rashi');
const response = await api.sendMessage(session.data.sessionId, 'What is Genesis 1:1?');
```

### Python

```python
import requests

class TorahLearningAPI:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
    
    def create_session(self, rabbi=None):
        response = requests.post(f'{self.base_url}/chat/session', 
                               json={'rabbi': rabbi})
        return response.json()
    
    def send_message(self, session_id, message, rabbi=None):
        response = requests.post(f'{self.base_url}/chat/message',
                               json={'sessionId': session_id, 
                                   'message': message, 
                                   'rabbi': rabbi})
        return response.json()

# Usage
api = TorahLearningAPI()
session = api.create_session('Rashi')
response = api.send_message(session['data']['sessionId'], 'What is Genesis 1:1?')
```

## Changelog

### v1.0.0
- Initial API release
- Basic chat functionality
- Rabbi personality system
- Sefaria integration
- Session management

## Support

For API support, please:
1. Check this documentation
2. Review the error codes and messages
3. Test with the `/api/test` endpoint
4. Open an issue on GitHub with request/response details