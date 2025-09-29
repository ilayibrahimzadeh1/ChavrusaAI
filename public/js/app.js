/**
 * Main application logic for Torah Learning App
 */

class TorahLearningApp {
    constructor() {
        this.apiClient = new APIClient();
        this.uiManager = new UIManager();
        this.connectionMonitor = new ConnectionMonitor(this.apiClient);

        // Initialize authentication
        this.authClient = new AuthClient(this.apiClient);
        this.authModal = new AuthModal(this.authClient);

        this.state = {
            sessionId: null,
            currentRabbi: null,
            isConnected: true,
            conversationHistory: [],
            references: [],
            // Authentication state
            isAuthenticated: false,
            user: null,
            profile: null
        };

        this.initialize();
    }

    async initialize() {
        try {
            // Set up UI event handlers
            this.setupUIHandlers();

            // Set up authentication
            this.setupAuthentication();

            // Initialize authentication state
            await this.initializeAuth();

            // Start connection monitoring
            this.setupConnectionMonitoring();

            // Test initial connection
            await this.testConnection();

            console.log('Torah Learning App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.uiManager.showStatus('Failed to initialize application', 'error');
        }
    }

    setupUIHandlers() {
        // Override UI manager methods to handle app logic
        this.uiManager.onRabbiSelected = (rabbi) => this.handleRabbiSelection(rabbi);
        this.uiManager.onMessageSubmit = (message) => this.handleMessageSubmit(message);
        this.uiManager.onNewChat = () => this.handleNewChat();
    }

    setupAuthentication() {
        // Set up authentication interceptor for automatic token refresh
        new AuthInterceptor(this.authClient);

        // Listen for authentication state changes
        this.authClient.addAuthListener((authenticated, user) => {
            this.handleAuthStateChange(authenticated, user);
        });

        // Add authentication UI handlers
        this.setupAuthUIHandlers();
    }

    setupAuthUIHandlers() {
        // Add login/logout buttons to UI if they exist
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const profileBtn = document.getElementById('profile-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfileModal());
        }
    }

    async initializeAuth() {
        try {
            const authStatus = await this.authClient.initialize();
            this.state.isAuthenticated = authStatus.authenticated;
            this.state.user = authStatus.user;

            if (authStatus.authenticated) {
                // Get user profile
                const profileResult = await this.authClient.getProfile();
                if (profileResult.success) {
                    this.state.profile = profileResult.profile;
                }

                console.log('User authenticated:', this.state.user);
                this.updateAuthUI();
            } else {
                console.log('User not authenticated');
                this.updateAuthUI();
            }
        } catch (error) {
            console.error('Error initializing authentication:', error);
            this.state.isAuthenticated = false;
            this.state.user = null;
            this.updateAuthUI();
        }
    }

    setupConnectionMonitoring() {
        this.connectionMonitor.addListener((isOnline) => {
            this.state.isConnected = isOnline;
            const message = isOnline ? 'Connection restored' : 'Connection lost';
            const type = isOnline ? 'success' : 'error';
            this.uiManager.showStatus(message, type);
        });

        this.connectionMonitor.start();
    }

    async testConnection() {
        try {
            await this.apiClient.testConnection();
            this.uiManager.showStatus('Connected to server', 'success');
        } catch (error) {
            console.error('Connection test failed:', error);
            this.uiManager.showStatus('Server connection failed', 'error');
        }
    }

    // Rabbi selection handling
    async handleRabbiSelection(rabbi) {
        try {
            this.state.currentRabbi = rabbi;
            
            // Create new session or update existing one
            if (!this.state.sessionId) {
                const response = await this.apiClient.createSession(rabbi);
                this.state.sessionId = response.data.sessionId;
                console.log('New session created:', this.state.sessionId);
            } else {
                await this.apiClient.setRabbi(this.state.sessionId, rabbi);
                console.log('Rabbi updated for session:', this.state.sessionId);
            }

            // Add welcome message from rabbi
            const rabbiInfo = this.uiManager.rabbiInfo[rabbi];
            const welcomeMessage = this.getPersonalizedWelcome(rabbiInfo);
            this.uiManager.addMessage(welcomeMessage, false);

        } catch (error) {
            console.error('Error selecting rabbi:', error);
            this.handleAPIError(error, 'Failed to select rabbi');
        }
    }

    // Message handling
    async handleMessageSubmit(message) {
        try {
            // Add user message to UI immediately
            this.uiManager.addMessage(message, true);
            this.uiManager.clearMessageInput();
            this.uiManager.setInputEnabled(false);
            this.uiManager.showTypingIndicator();

            // Send message to API
            const response = await this.apiClient.sendMessage(
                message, 
                this.state.sessionId, 
                this.state.currentRabbi
            );

            // Update session ID if needed
            if (!this.state.sessionId && response.data.sessionId) {
                this.state.sessionId = response.data.sessionId;
            }

            // Hide typing indicator
            this.uiManager.hideTypingIndicator();

            // Add rabbi response to UI
            this.uiManager.addMessage(response.data.aiResponse, false);

            // Update references if provided
            if (response.data.references && response.data.references.length > 0) {
                this.state.references = [...this.state.references, ...response.data.references];
                this.uiManager.updateReferencesPanel(this.state.references);
            }

            // Update conversation history
            this.state.conversationHistory.push(
                { content: message, isUser: true, timestamp: new Date() },
                { content: response.data.aiResponse, isUser: false, timestamp: new Date() }
            );

        } catch (error) {
            console.error('Error sending message:', error);
            this.uiManager.hideTypingIndicator();
            
            // Show error message in chat
            const errorMessage = this.getErrorMessage(error);
            this.uiManager.addMessage(errorMessage, false);
            
            this.handleAPIError(error, 'Failed to send message');
        } finally {
            this.uiManager.setInputEnabled(true);
        }
    }

    // New chat handling
    async handleNewChat() {
        try {
            // Clear UI
            this.uiManager.clearChat();

            // Reset state
            this.state.sessionId = null;
            this.state.conversationHistory = [];
            this.state.references = [];

            // Clear references panel
            this.uiManager.updateReferencesPanel([]);

            // If a rabbi is selected, create new session and show welcome
            if (this.state.currentRabbi) {
                const response = await this.apiClient.createSession(this.state.currentRabbi);
                this.state.sessionId = response.data.sessionId;

                const rabbiInfo = this.uiManager.rabbiInfo[this.state.currentRabbi];
                const welcomeMessage = this.getPersonalizedWelcome(rabbiInfo);
                this.uiManager.addMessage(welcomeMessage, false);
            }

            this.uiManager.showStatus('New conversation started', 'success');

        } catch (error) {
            console.error('Error starting new chat:', error);
            this.handleAPIError(error, 'Failed to start new conversation');
        }
    }

    // Authentication handling methods
    handleAuthStateChange(authenticated, user) {
        this.state.isAuthenticated = authenticated;
        this.state.user = user;

        if (authenticated) {
            console.log('User signed in:', user);
            this.uiManager.showStatus(`Welcome, ${user.displayName || user.email}!`, 'success');

            // Load user profile
            this.loadUserProfile();
        } else {
            console.log('User signed out');
            this.state.profile = null;
            this.uiManager.showStatus('Signed out successfully', 'success');
        }

        this.updateAuthUI();
    }

    async loadUserProfile() {
        try {
            const result = await this.authClient.getProfile();
            if (result.success) {
                this.state.profile = result.profile;
                console.log('Profile loaded:', this.state.profile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    showLoginModal() {
        this.authModal.show('signin');
    }

    showProfileModal() {
        if (this.state.isAuthenticated) {
            this.authModal.loadProfileData(this.state.user, this.state.profile);
            this.authModal.show('profile');
        } else {
            this.showLoginModal();
        }
    }

    async handleLogout() {
        try {
            await this.authClient.signout();
        } catch (error) {
            console.error('Logout error:', error);
            this.uiManager.showStatus('Error during logout', 'error');
        }
    }

    updateAuthUI() {
        // Update authentication-related UI elements
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const profileBtn = document.getElementById('profile-btn');
        const userInfo = document.getElementById('user-info');

        if (this.state.isAuthenticated) {
            // Show authenticated state
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (profileBtn) profileBtn.style.display = 'block';

            if (userInfo) {
                const displayName = this.state.user?.displayName ||
                                   this.state.user?.email ||
                                   'User';
                userInfo.textContent = displayName;
                userInfo.style.display = 'block';
            }
        } else {
            // Show unauthenticated state
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'none';

            if (userInfo) {
                userInfo.style.display = 'none';
            }
        }
    }

    getPersonalizedWelcome(rabbiInfo) {
        const baseName = rabbiInfo.name;
        if (this.state.isAuthenticated && this.state.user?.displayName) {
            return `Shalom, ${this.state.user.displayName}! I am ${baseName}. How may I assist you with your Torah learning today?`;
        }
        return `Shalom! I am ${baseName}. How may I assist you with your Torah learning today?`;
    }

    getUserContext() {
        if (this.state.isAuthenticated && this.state.user) {
            return {
                id: this.state.user.id,
                email: this.state.user.email,
                displayName: this.state.user.displayName,
                emailVerified: this.state.user.emailVerified,
                profile: this.state.profile
            };
        }
        return null;
    }

    // Error handling
    handleAPIError(error, userMessage) {
        console.error('API Error:', error);
        
        let statusMessage = userMessage;
        let statusType = 'error';
        
        if (error instanceof APIError) {
            if (error.isNetworkError()) {
                statusMessage = 'Network connection error. Please check your internet connection.';
            } else if (error.isRateLimitError()) {
                statusMessage = 'Too many requests. Please wait a moment before trying again.';
                statusType = 'warning';
            } else if (error.isServerError()) {
                statusMessage = 'Server error. Please try again later.';
            } else {
                statusMessage = error.message;
            }
        }
        
        this.uiManager.showStatus(statusMessage, statusType);
    }

    getErrorMessage(error) {
        if (error instanceof APIError) {
            if (error.isNetworkError()) {
                return 'I apologize, but I\'m having trouble connecting to the server. Please check your internet connection and try again.';
            } else if (error.isRateLimitError()) {
                return 'I need to take a brief pause. Please wait a moment before asking your next question.';
            } else if (error.isServerError()) {
                return 'I\'m experiencing some technical difficulties. Please try asking your question again.';
            }
        }
        
        return 'I apologize, but I encountered an error processing your message. Please try again.';
    }

    // Utility methods
    async loadConversationHistory() {
        if (!this.state.sessionId) return;
        
        try {
            const response = await this.apiClient.getConversationHistory(this.state.sessionId);
            this.state.conversationHistory = response.data.messages;
            
            // Display messages in UI
            this.uiManager.clearChat();
            this.state.conversationHistory.forEach(msg => {
                this.uiManager.addMessage(msg.content, msg.isUser, msg.timestamp);
            });
            
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    async searchTorahTexts(query) {
        try {
            const response = await this.apiClient.searchTexts(query);
            return response.data.results;
        } catch (error) {
            console.error('Error searching Torah texts:', error);
            return [];
        }
    }

    async getTorahReference(reference) {
        try {
            const response = await this.apiClient.getReference(reference);
            return response.data;
        } catch (error) {
            console.error('Error getting Torah reference:', error);
            return null;
        }
    }

    // Cleanup
    destroy() {
        this.connectionMonitor.stop();

        // Clear authentication listeners
        if (this.authClient) {
            this.authClient.clearRefreshTimer();
        }

        console.log('Torah Learning App destroyed');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TorahLearningApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.destroy();
    }
});