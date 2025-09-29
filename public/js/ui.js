/**
 * UI management module for Torah Learning App
 */

class UIManager {
    constructor() {
        this.elements = this.initializeElements();
        this.state = {
            currentRabbi: null,
            sessionId: null,
            isTyping: false,
            isMobileMenuOpen: false,
            isReferencePanelOpen: false
        };
        this.rabbiInfo = this.initializeRabbiInfo();
        this.bindEvents();
    }

    initializeElements() {
        return {
            // Main containers
            chatContainer: document.getElementById('chat-container'),
            welcomeScreen: document.getElementById('welcome-screen'),
            sidebar: document.querySelector('.sidebar'),
            overlay: document.getElementById('overlay'),
            
            // Chat elements
            messageForm: document.getElementById('message-form'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.querySelector('.send-btn'),
            typingIndicator: document.getElementById('typing-indicator'),
            
            // Rabbi selection
            currentRabbiImg: document.getElementById('current-rabbi-img'),
            currentRabbiName: document.getElementById('current-rabbi-name'),
            currentRabbiEra: document.getElementById('current-rabbi-era'),
            rabbiOptions: document.querySelectorAll('.rabbi-option'),
            rabbiCards: document.querySelectorAll('.rabbi-card'),
            
            // UI controls
            newChatBtn: document.querySelector('.new-chat-btn'),
            mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
            toggleReferencesBtn: document.getElementById('toggle-references'),
            closeReferencesBtn: document.querySelector('.close-references'),
            referencesPanel: document.getElementById('references-panel'),
            
            // Status and feedback
            statusDiv: document.getElementById('status'),
            questionPills: document.querySelectorAll('.question-pill')
        };
    }

    initializeRabbiInfo() {
        return {
            'Rashi': {
                name: 'Rashi',
                era: '11th century France',
                description: 'Clear, concise commentator',
                image: 'images/rashi ai.png'
            },
            'Rambam': {
                name: 'Rambam',
                era: '12th century Spain/Egypt',
                description: 'Rational philosopher',
                image: 'images/ramban.png'
            },
            'Rabbi Yosef Caro': {
                name: 'Rabbi Yosef Caro',
                era: '16th century Israel',
                description: 'Halakhic codifier',
                image: 'images/rabbi yosef caro.png'
            },
            'Baal Shem Tov': {
                name: 'The Baal Shem Tov',
                era: '18th century Poland',
                description: 'Spiritual leader and teacher',
                image: 'images/baal shem tov.png'
            }
        };
    }

    bindEvents() {
        // Rabbi selection events
        [...this.elements.rabbiOptions, ...this.elements.rabbiCards].forEach(element => {
            element.addEventListener('click', (e) => this.handleRabbiSelection(e));
        });

        // Message form events
        this.elements.messageForm.addEventListener('submit', (e) => this.handleMessageSubmit(e));

        // UI control events
        this.elements.newChatBtn.addEventListener('click', () => this.handleNewChat());
        this.elements.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        this.elements.toggleReferencesBtn.addEventListener('click', () => this.toggleReferencesPanel());
        this.elements.closeReferencesBtn.addEventListener('click', () => this.closeReferencesPanel());
        this.elements.overlay.addEventListener('click', () => this.closeAllPanels());

        // Question pill events
        this.elements.questionPills.forEach(pill => {
            pill.addEventListener('click', (e) => this.handleQuestionPillClick(e));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window resize events
        window.addEventListener('resize', () => this.handleWindowResize());
    }

    // Rabbi selection methods
    handleRabbiSelection(event) {
        const rabbi = event.currentTarget.dataset.rabbi;
        if (this.state.currentRabbi === rabbi) return;

        this.setCurrentRabbi(rabbi);
        this.onRabbiSelected(rabbi);
    }

    setCurrentRabbi(rabbi) {
        if (!this.rabbiInfo[rabbi]) return;

        this.state.currentRabbi = rabbi;
        const rabbiData = this.rabbiInfo[rabbi];

        // Update header display
        this.elements.currentRabbiName.textContent = rabbiData.name;
        this.elements.currentRabbiEra.textContent = rabbiData.era;
        this.elements.currentRabbiImg.src = rabbiData.image;
        this.elements.currentRabbiImg.alt = rabbiData.name;

        // Update sidebar highlighting
        this.elements.rabbiOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.rabbi === rabbi);
        });

        this.showStatus(`Now learning with ${rabbiData.name}`, 'success');
    }

    onRabbiSelected(rabbi) {
        // This method should be overridden by the main app
        console.log('Rabbi selected:', rabbi);
    }

    // Message handling methods
    handleMessageSubmit(event) {
        event.preventDefault();
        const message = this.elements.messageInput.value.trim();
        
        if (!message) return;
        if (!this.state.currentRabbi) {
            this.showStatus('Please select a Rabbi first', 'error');
            return;
        }

        this.onMessageSubmit(message);
    }

    onMessageSubmit(message) {
        // This method should be overridden by the main app
        console.log('Message submitted:', message);
    }

    clearMessageInput() {
        this.elements.messageInput.value = '';
    }

    setInputEnabled(enabled) {
        this.elements.messageInput.disabled = !enabled;
        this.elements.sendBtn.disabled = !enabled;
        
        if (enabled) {
            this.elements.messageInput.focus();
        }
    }

    // Message display methods
    addMessage(content, isUser, timestamp = null) {
        this.hideWelcomeScreen();

        const messageElement = this.createMessageElement(content, isUser, timestamp);
        this.elements.chatContainer.appendChild(messageElement);
        this.scrollToBottom();

        return messageElement;
    }

    createMessageElement(content, isUser, timestamp = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');

        // Create avatar
        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar', isUser ? 'user-avatar' : 'rabbi-avatar');
        
        const iconElement = document.createElement('i');
        iconElement.className = isUser ? 'fas fa-user' : 'fas fa-star-of-david';
        avatarElement.appendChild(iconElement);

        // Create content
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        // Process content for references if it's from rabbi
        const processedContent = isUser ? content : this.processReferences(content);
        contentElement.innerHTML = processedContent;

        // Add timestamp
        const timeElement = document.createElement('div');
        timeElement.classList.add('message-time');
        const time = timestamp ? new Date(timestamp) : new Date();
        timeElement.textContent = this.formatTime(time);
        contentElement.appendChild(timeElement);

        // Assemble message
        if (isUser) {
            messageElement.appendChild(contentElement);
            messageElement.appendChild(avatarElement);
        } else {
            messageElement.appendChild(avatarElement);
            messageElement.appendChild(contentElement);
        }

        return messageElement;
    }

    processReferences(content) {
        // Highlight Torah references in rabbi responses
        return content.replace(
            /(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Psalms|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|I Chronicles|II Chronicles|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi)\s+(\d+):(\d+)(-\d+)?/g,
            '<span class="reference-tooltip" onclick="window.open(\'https://www.sefaria.org/$1_$2:$3\', \'_blank\')"><span>$1 $2:$3$4</span><div class="tooltip-content">Click to view in Sefaria</div></span>'
        );
    }

    formatTime(date) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    scrollToBottom() {
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }

    // Typing indicator methods
    showTypingIndicator() {
        this.state.isTyping = true;
        this.elements.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.state.isTyping = false;
        this.elements.typingIndicator.classList.remove('active');
    }

    // Welcome screen methods
    showWelcomeScreen() {
        this.elements.welcomeScreen.style.display = 'flex';
    }

    hideWelcomeScreen() {
        this.elements.welcomeScreen.style.display = 'none';
    }

    // Status message methods
    showStatus(message, type = 'info', duration = 3000) {
        this.elements.statusDiv.textContent = message;
        this.elements.statusDiv.className = 'active';
        
        // Set background color based on type
        const colors = {
            error: 'rgba(220, 53, 69, 0.9)',
            success: 'rgba(40, 167, 69, 0.9)',
            warning: 'rgba(255, 193, 7, 0.9)',
            info: 'rgba(0, 123, 255, 0.9)'
        };
        
        this.elements.statusDiv.style.backgroundColor = colors[type] || colors.info;
        
        setTimeout(() => {
            this.elements.statusDiv.className = '';
        }, duration);
    }

    // Panel management methods
    toggleMobileMenu() {
        this.state.isMobileMenuOpen = !this.state.isMobileMenuOpen;
        this.elements.sidebar.classList.toggle('active', this.state.isMobileMenuOpen);
        this.elements.overlay.classList.toggle('active', this.state.isMobileMenuOpen);
    }

    toggleReferencesPanel() {
        this.state.isReferencePanelOpen = !this.state.isReferencePanelOpen;
        this.elements.referencesPanel.classList.toggle('active', this.state.isReferencePanelOpen);
        this.elements.overlay.classList.toggle('active', this.state.isReferencePanelOpen);
    }

    closeReferencesPanel() {
        this.state.isReferencePanelOpen = false;
        this.elements.referencesPanel.classList.remove('active');
        this.elements.overlay.classList.remove('active');
    }

    closeAllPanels() {
        this.state.isMobileMenuOpen = false;
        this.state.isReferencePanelOpen = false;
        this.elements.sidebar.classList.remove('active');
        this.elements.referencesPanel.classList.remove('active');
        this.elements.overlay.classList.remove('active');
    }

    // Event handlers
    handleNewChat() {
        this.onNewChat();
    }

    onNewChat() {
        // This method should be overridden by the main app
        console.log('New chat requested');
    }

    handleQuestionPillClick(event) {
        const question = event.target.textContent;
        this.elements.messageInput.value = question;
        this.elements.messageInput.focus();
    }

    handleKeyboardShortcuts(event) {
        // Escape key closes panels
        if (event.key === 'Escape') {
            this.closeAllPanels();
        }
        
        // Ctrl/Cmd + Enter sends message
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            this.elements.messageForm.dispatchEvent(new Event('submit'));
        }
    }

    handleWindowResize() {
        // Close mobile menu on desktop
        if (window.innerWidth > 992) {
            this.state.isMobileMenuOpen = false;
            this.elements.sidebar.classList.remove('active');
            this.elements.overlay.classList.remove('active');
        }
    }

    // References panel methods
    updateReferencesPanel(references) {
        const content = this.elements.referencesPanel.querySelector('.references-content');
        content.innerHTML = '';

        if (!references || references.length === 0) {
            content.innerHTML = '<p>No references found in this conversation.</p>';
            return;
        }

        references.forEach(ref => {
            const item = document.createElement('div');
            item.className = 'reference-item';
            
            item.innerHTML = `
                <h4>${ref.reference}</h4>
                <p>${ref.text || 'Text not available'}</p>
                <div class="reference-source">
                    <a href="${ref.url}" target="_blank">View on Sefaria</a>
                </div>
            `;
            
            content.appendChild(item);
        });
    }

    // Utility methods
    clearChat() {
        // Remove all messages except welcome screen and typing indicator
        const messages = this.elements.chatContainer.querySelectorAll('.message');
        messages.forEach(message => message.remove());
        
        this.showWelcomeScreen();
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }
}

// Export for use in other modules
window.UIManager = UIManager;