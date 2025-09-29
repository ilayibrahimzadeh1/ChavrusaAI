/**
 * Frontend Authentication Client for ChavrusaAI
 * Handles user authentication, session management, and JWT tokens
 */

class AuthClient {
    constructor(apiClient) {
        this.api = apiClient;
        this.token = this.loadToken();
        this.user = this.loadUser();
        this.refreshTimer = null;
        this.listeners = [];

        // Add authorization header if token exists
        if (this.token) {
            this.setAuthHeader(this.token);
        }
    }

    /**
     * Authentication state management
     */
    isAuthenticated() {
        return !!(this.token && this.user);
    }

    getCurrentUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    /**
     * Event listeners for auth state changes
     */
    addAuthListener(callback) {
        this.listeners.push(callback);
    }

    removeAuthListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    notifyAuthChange(authenticated, user = null) {
        this.listeners.forEach(callback => {
            try {
                callback(authenticated, user);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    /**
     * Token management
     */
    setAuthHeader(token) {
        this.api.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    removeAuthHeader() {
        delete this.api.defaultHeaders['Authorization'];
    }

    saveToken(token) {
        if (token) {
            localStorage.setItem('chavrusa_auth_token', token);
            this.token = token;
            this.setAuthHeader(token);
        }
    }

    saveUser(user) {
        if (user) {
            localStorage.setItem('chavrusa_user', JSON.stringify(user));
            this.user = user;
        }
    }

    loadToken() {
        return localStorage.getItem('chavrusa_auth_token');
    }

    loadUser() {
        const userJson = localStorage.getItem('chavrusa_user');
        return userJson ? JSON.parse(userJson) : null;
    }

    clearAuth() {
        localStorage.removeItem('chavrusa_auth_token');
        localStorage.removeItem('chavrusa_user');
        localStorage.removeItem('chavrusa_refresh_token');
        this.token = null;
        this.user = null;
        this.removeAuthHeader();
        this.clearRefreshTimer();
    }

    /**
     * Authentication API methods
     */
    async signup(email, password, displayName = null) {
        try {
            const response = await this.api.post('/auth/signup', {
                email,
                password,
                displayName
            });

            if (response.success && response.data.session) {
                this.handleAuthSuccess(response.data);
                return {
                    success: true,
                    user: response.data.user,
                    needsEmailConfirmation: response.data.needsEmailConfirmation
                };
            }

            return { success: false, error: 'Signup failed' };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error.message || 'Signup failed',
                code: error.code
            };
        }
    }

    async signin(email, password) {
        try {
            const response = await this.api.post('/auth/signin', {
                email,
                password
            });

            if (response.success && response.data.session) {
                this.handleAuthSuccess(response.data);
                return {
                    success: true,
                    user: response.data.user,
                    profile: response.data.profile
                };
            }

            return { success: false, error: 'Signin failed' };
        } catch (error) {
            console.error('Signin error:', error);
            return {
                success: false,
                error: error.message || 'Signin failed',
                code: error.code
            };
        }
    }

    async signout() {
        try {
            // Only call API if we have a token
            if (this.token) {
                await this.api.post('/auth/signout');
            }
        } catch (error) {
            console.error('Signout error:', error);
            // Continue with local cleanup even if API call fails
        } finally {
            this.handleSignout();
        }

        return { success: true };
    }

    async refreshSession() {
        try {
            const refreshToken = localStorage.getItem('chavrusa_refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await this.api.post('/auth/refresh', {
                refreshToken
            });

            if (response.success && response.data.session) {
                this.handleAuthSuccess(response.data);
                return { success: true };
            }

            throw new Error('Token refresh failed');
        } catch (error) {
            console.error('Token refresh error:', error);
            this.handleSignout();
            return { success: false, error: error.message };
        }
    }

    /**
     * Profile management
     */
    async getProfile() {
        try {
            const response = await this.api.get('/auth/profile');
            if (response.success) {
                this.saveUser(response.data.user);
                return {
                    success: true,
                    user: response.data.user,
                    profile: response.data.profile
                };
            }
            return { success: false, error: 'Failed to fetch profile' };
        } catch (error) {
            console.error('Get profile error:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch profile'
            };
        }
    }

    async updateProfile(displayName, preferredRabbi = null) {
        try {
            const response = await this.api.put('/auth/profile', {
                displayName,
                preferredRabbi
            });

            if (response.success) {
                // Update local user data
                if (this.user) {
                    this.user = {
                        ...this.user,
                        displayName: displayName
                    };
                    this.saveUser(this.user);
                }

                return {
                    success: true,
                    profile: response.data.profile
                };
            }

            return { success: false, error: 'Profile update failed' };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: error.message || 'Profile update failed'
            };
        }
    }

    /**
     * Session handling
     */
    handleAuthSuccess(authData) {
        const { user, session, profile } = authData;

        // Save authentication data
        this.saveToken(session.access_token);
        this.saveUser(user);

        // Save refresh token if available
        if (session.refresh_token) {
            localStorage.setItem('chavrusa_refresh_token', session.refresh_token);
        }

        // Set up automatic token refresh
        this.setupTokenRefresh(session.expires_at);

        // Notify listeners
        this.notifyAuthChange(true, user);
    }

    handleSignout() {
        this.clearAuth();
        this.notifyAuthChange(false, null);
    }

    /**
     * Automatic token refresh
     */
    setupTokenRefresh(expiresAt) {
        this.clearRefreshTimer();

        if (!expiresAt) return;

        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = Date.now();
        const refreshTime = expirationTime - currentTime - (5 * 60 * 1000); // Refresh 5 minutes before expiry

        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => {
                this.refreshSession();
            }, refreshTime);
        }
    }

    clearRefreshTimer() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Session validation
     */
    async validateSession() {
        if (!this.token) {
            return { valid: false, error: 'No token' };
        }

        try {
            const response = await this.getProfile();
            if (response.success) {
                return { valid: true, user: response.user };
            } else {
                // Token might be invalid, try to refresh
                const refreshResult = await this.refreshSession();
                if (refreshResult.success) {
                    return { valid: true, user: this.user };
                } else {
                    this.handleSignout();
                    return { valid: false, error: 'Session expired' };
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);

            // If it's an auth error, try refresh
            if (error.status === 401) {
                const refreshResult = await this.refreshSession();
                if (refreshResult.success) {
                    return { valid: true, user: this.user };
                }
            }

            this.handleSignout();
            return { valid: false, error: error.message };
        }
    }

    /**
     * Initialize authentication on app startup
     */
    async initialize() {
        if (this.token) {
            const validation = await this.validateSession();
            if (!validation.valid) {
                console.log('Session invalid, user needs to sign in again');
                return { authenticated: false, user: null };
            }
            return { authenticated: true, user: this.user };
        }
        return { authenticated: false, user: null };
    }

    /**
     * Auth status check
     */
    async checkAuthStatus() {
        try {
            const response = await this.api.get('/auth/health');
            return {
                healthy: response.success,
                database: response.data?.database === 'connected'
            };
        } catch (error) {
            console.error('Auth health check failed:', error);
            return { healthy: false, database: false };
        }
    }
}

/**
 * Authentication error handler for API requests
 */
class AuthInterceptor {
    constructor(authClient) {
        this.authClient = authClient;
        this.originalRequest = authClient.api.request.bind(authClient.api);

        // Override the request method to handle auth errors
        authClient.api.request = this.interceptRequest.bind(this);
    }

    async interceptRequest(endpoint, options = {}) {
        try {
            return await this.originalRequest(endpoint, options);
        } catch (error) {
            // Handle 401 errors by attempting token refresh
            if (error.status === 401 && this.authClient.token) {
                const refreshResult = await this.authClient.refreshSession();

                if (refreshResult.success) {
                    // Retry the original request with new token
                    return await this.originalRequest(endpoint, options);
                } else {
                    // Refresh failed, sign out user
                    this.authClient.handleSignout();
                    throw new APIError('Session expired. Please sign in again.', 401, 'SESSION_EXPIRED');
                }
            }

            throw error;
        }
    }
}

// Export for use in other modules
window.AuthClient = AuthClient;
window.AuthInterceptor = AuthInterceptor;