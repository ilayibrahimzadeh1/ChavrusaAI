/**
 * API communication module for Torah Learning App
 */

class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make HTTP request with error handling and retry logic
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new APIError(
                    errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    errorData.error?.code
                );
            }

            return await response.json();
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            
            // Network or other errors
            throw new APIError(
                'Network error: Unable to connect to server',
                0,
                'NETWORK_ERROR'
            );
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Chat API methods
    async createSession(rabbi = null) {
        return this.post('/chat/session', { rabbi });
    }

    async sendMessage(message, sessionId, rabbi = null) {
        return this.post('/chat/message', { message, sessionId, rabbi });
    }

    async setRabbi(sessionId, rabbi) {
        return this.post('/chat/rabbi', { sessionId, rabbi });
    }

    async getSession(sessionId) {
        return this.get(`/chat/session/${sessionId}`);
    }

    async getConversationHistory(sessionId, limit = 20) {
        return this.get(`/chat/history/${sessionId}`, { limit });
    }

    async getRabbis() {
        return this.get('/chat/rabbis');
    }

    async getReference(reference) {
        return this.get(`/reference/${encodeURIComponent(reference)}`);
    }

    async searchTexts(query, limit = 10) {
        return this.get('/search', { q: query, limit });
    }

    async deleteSession(sessionId) {
        return this.delete(`/chat/session/${sessionId}`);
    }

    // Health check methods
    async healthCheck() {
        return this.get('/health');
    }

    async testConnection() {
        return this.get('/test');
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, status = 0, code = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.code = code;
    }

    isNetworkError() {
        return this.status === 0;
    }

    isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    isServerError() {
        return this.status >= 500;
    }

    isRateLimitError() {
        return this.status === 429;
    }
}

/**
 * Connection status monitor
 */
class ConnectionMonitor {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.isOnline = true;
        this.checkInterval = 30000; // 30 seconds
        this.intervalId = null;
        this.listeners = [];
    }

    start() {
        this.intervalId = setInterval(() => {
            this.checkConnection();
        }, this.checkInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async checkConnection() {
        try {
            await this.apiClient.healthCheck();
            this.setOnlineStatus(true);
        } catch (error) {
            this.setOnlineStatus(false);
        }
    }

    setOnlineStatus(online) {
        if (this.isOnline !== online) {
            this.isOnline = online;
            this.notifyListeners(online);
        }
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    notifyListeners(online) {
        this.listeners.forEach(callback => {
            try {
                callback(online);
            } catch (error) {
                console.error('Error in connection status listener:', error);
            }
        });
    }
}

// Export for use in other modules
window.APIClient = APIClient;
window.APIError = APIError;
window.ConnectionMonitor = ConnectionMonitor;