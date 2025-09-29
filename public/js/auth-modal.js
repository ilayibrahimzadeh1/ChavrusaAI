/**
 * Authentication Modal Component for ChavrusaAI
 * Handles user signup, signin, and profile management UI
 */

class AuthModal {
    constructor(authClient) {
        this.authClient = authClient;
        this.modal = null;
        this.currentMode = 'signin'; // 'signin', 'signup', 'profile'
        this.isVisible = false;

        this.createModal();
        this.bindEvents();
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        const modalHTML = `
            <div id="auth-modal" class="auth-modal hidden">
                <div class="auth-modal-overlay"></div>
                <div class="auth-modal-container">
                    <div class="auth-modal-header">
                        <h2 class="auth-modal-title">Sign In</h2>
                        <button class="auth-modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="auth-modal-content">
                        <!-- Sign In Form -->
                        <form id="signin-form" class="auth-form active">
                            <div class="form-group">
                                <label for="signin-email">Email</label>
                                <input type="email" id="signin-email" name="email" required autocomplete="username">
                            </div>
                            <div class="form-group">
                                <label for="signin-password">Password</label>
                                <input type="password" id="signin-password" name="password" required autocomplete="current-password">
                            </div>
                            <button type="submit" class="auth-btn primary">
                                <span class="btn-text">Sign In</span>
                                <i class="fas fa-spinner fa-spin btn-spinner hidden"></i>
                            </button>
                            <div class="auth-switch">
                                Don't have an account?
                                <a href="#" class="switch-to-signup">Sign up</a>
                            </div>
                        </form>

                        <!-- Sign Up Form -->
                        <form id="signup-form" class="auth-form">
                            <div class="form-group">
                                <label for="signup-display-name">Display Name (Optional)</label>
                                <input type="text" id="signup-display-name" name="displayName" autocomplete="name">
                            </div>
                            <div class="form-group">
                                <label for="signup-email">Email</label>
                                <input type="email" id="signup-email" name="email" required autocomplete="username">
                            </div>
                            <div class="form-group">
                                <label for="signup-password">Password</label>
                                <input type="password" id="signup-password" name="password" required autocomplete="new-password" minlength="6">
                                <small class="form-help">Minimum 6 characters</small>
                            </div>
                            <div class="form-group">
                                <label for="signup-confirm-password">Confirm Password</label>
                                <input type="password" id="signup-confirm-password" name="confirmPassword" required autocomplete="new-password">
                            </div>
                            <button type="submit" class="auth-btn primary">
                                <span class="btn-text">Sign Up</span>
                                <i class="fas fa-spinner fa-spin btn-spinner hidden"></i>
                            </button>
                            <div class="auth-switch">
                                Already have an account?
                                <a href="#" class="switch-to-signin">Sign in</a>
                            </div>
                        </form>

                        <!-- Profile Form -->
                        <form id="profile-form" class="auth-form">
                            <div class="profile-info">
                                <div class="profile-avatar">
                                    <i class="fas fa-user-circle"></i>
                                </div>
                                <div class="profile-details">
                                    <div class="profile-email"></div>
                                    <div class="profile-status"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="profile-display-name">Display Name</label>
                                <input type="text" id="profile-display-name" name="displayName" autocomplete="name">
                            </div>
                            <div class="form-group">
                                <label for="profile-preferred-rabbi">Preferred Rabbi</label>
                                <select id="profile-preferred-rabbi" name="preferredRabbi">
                                    <option value="">Select a rabbi...</option>
                                    <option value="Rashi">Rashi</option>
                                    <option value="Rambam">Rambam</option>
                                    <option value="Rabbi Yosef Caro">Rabbi Yosef Caro</option>
                                    <option value="Baal Shem Tov">Baal Shem Tov</option>
                                    <option value="Rabbi Soloveitchik">Rabbi Soloveitchik</option>
                                    <option value="Arizal">Arizal</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="auth-btn primary">
                                    <span class="btn-text">Update Profile</span>
                                    <i class="fas fa-spinner fa-spin btn-spinner hidden"></i>
                                </button>
                                <button type="button" class="auth-btn secondary" id="signout-btn">
                                    Sign Out
                                </button>
                            </div>
                        </form>

                        <!-- Error Messages -->
                        <div id="auth-error" class="auth-message error hidden">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span class="message-text"></span>
                        </div>

                        <!-- Success Messages -->
                        <div id="auth-success" class="auth-message success hidden">
                            <i class="fas fa-check-circle"></i>
                            <span class="message-text"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('auth-modal');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (!this.modal) return;

        // Modal close events
        this.modal.querySelector('.auth-modal-close').addEventListener('click', () => this.hide());
        this.modal.querySelector('.auth-modal-overlay').addEventListener('click', () => this.hide());

        // Form mode switching
        this.modal.querySelector('.switch-to-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchMode('signup');
        });

        this.modal.querySelector('.switch-to-signin').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchMode('signin');
        });

        // Form submissions
        this.modal.querySelector('#signin-form').addEventListener('submit', (e) => this.handleSignin(e));
        this.modal.querySelector('#signup-form').addEventListener('submit', (e) => this.handleSignup(e));
        this.modal.querySelector('#profile-form').addEventListener('submit', (e) => this.handleProfileUpdate(e));

        // Sign out button
        this.modal.querySelector('#signout-btn').addEventListener('click', () => this.handleSignout());

        // Password confirmation validation
        const confirmPasswordInput = this.modal.querySelector('#signup-confirm-password');
        confirmPasswordInput.addEventListener('blur', () => this.validatePasswordMatch());
        confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Show modal with specific mode
     */
    show(mode = 'signin') {
        this.switchMode(mode);
        this.modal.classList.remove('hidden');
        this.isVisible = true;
        this.clearMessages();

        // Focus first input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('.auth-form.active input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Hide modal
     */
    hide() {
        this.modal.classList.add('hidden');
        this.isVisible = false;
        this.clearMessages();
        this.resetForms();
    }

    /**
     * Switch between different auth modes
     */
    switchMode(mode) {
        this.currentMode = mode;

        // Update title
        const titles = {
            signin: 'Sign In',
            signup: 'Sign Up',
            profile: 'Profile'
        };
        this.modal.querySelector('.auth-modal-title').textContent = titles[mode];

        // Show/hide forms
        this.modal.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        const targetForm = this.modal.querySelector(`#${mode}-form`);
        if (targetForm) {
            targetForm.classList.add('active');
        }

        this.clearMessages();
    }

    /**
     * Handle sign in form submission
     */
    async handleSignin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.setLoading(true, 'signin');

        try {
            const result = await this.authClient.signin(email, password);

            if (result.success) {
                this.showSuccess('Signed in successfully!');
                setTimeout(() => this.hide(), 1500);
            } else {
                this.showError(result.error || 'Sign in failed');
            }
        } catch (error) {
            this.showError('An unexpected error occurred');
            console.error('Signin error:', error);
        } finally {
            this.setLoading(false, 'signin');
        }
    }

    /**
     * Handle sign up form submission
     */
    async handleSignup(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const displayName = formData.get('displayName');

        if (!email || !password || !confirmPassword) {
            this.showError('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        this.setLoading(true, 'signup');

        try {
            const result = await this.authClient.signup(email, password, displayName);

            if (result.success) {
                if (result.needsEmailConfirmation) {
                    this.showSuccess('Account created! Please check your email to confirm your account.');
                } else {
                    this.showSuccess('Account created successfully!');
                    setTimeout(() => this.hide(), 1500);
                }
            } else {
                this.showError(result.error || 'Sign up failed');
            }
        } catch (error) {
            this.showError('An unexpected error occurred');
            console.error('Signup error:', error);
        } finally {
            this.setLoading(false, 'signup');
        }
    }

    /**
     * Handle profile update form submission
     */
    async handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const displayName = formData.get('displayName');
        const preferredRabbi = formData.get('preferredRabbi');

        this.setLoading(true, 'profile');

        try {
            const result = await this.authClient.updateProfile(displayName, preferredRabbi);

            if (result.success) {
                this.showSuccess('Profile updated successfully!');
            } else {
                this.showError(result.error || 'Profile update failed');
            }
        } catch (error) {
            this.showError('An unexpected error occurred');
            console.error('Profile update error:', error);
        } finally {
            this.setLoading(false, 'profile');
        }
    }

    /**
     * Handle sign out
     */
    async handleSignout() {
        try {
            await this.authClient.signout();
            this.hide();
        } catch (error) {
            console.error('Signout error:', error);
            this.showError('Error signing out');
        }
    }

    /**
     * Load user profile data into form
     */
    loadProfileData(user, profile) {
        if (!user) return;

        // Update profile info display
        this.modal.querySelector('.profile-email').textContent = user.email;
        this.modal.querySelector('.profile-status').textContent =
            user.emailConfirmed ? 'Email confirmed' : 'Email not confirmed';

        // Update form fields
        if (profile) {
            this.modal.querySelector('#profile-display-name').value = profile.display_name || '';
            this.modal.querySelector('#profile-preferred-rabbi').value = profile.preferred_rabbi || '';
        }
    }

    /**
     * Validate password match in signup form
     */
    validatePasswordMatch() {
        const password = this.modal.querySelector('#signup-password').value;
        const confirmPassword = this.modal.querySelector('#signup-confirm-password').value;
        const confirmInput = this.modal.querySelector('#signup-confirm-password');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.setCustomValidity('Passwords do not match');
            confirmInput.classList.add('error');
        } else {
            confirmInput.setCustomValidity('');
            confirmInput.classList.remove('error');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = this.modal.querySelector('#auth-error');
        errorEl.querySelector('.message-text').textContent = message;
        errorEl.classList.remove('hidden');

        const successEl = this.modal.querySelector('#auth-success');
        successEl.classList.add('hidden');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successEl = this.modal.querySelector('#auth-success');
        successEl.querySelector('.message-text').textContent = message;
        successEl.classList.remove('hidden');

        const errorEl = this.modal.querySelector('#auth-error');
        errorEl.classList.add('hidden');
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.modal.querySelector('#auth-error').classList.add('hidden');
        this.modal.querySelector('#auth-success').classList.add('hidden');
    }

    /**
     * Set loading state for forms
     */
    setLoading(loading, formType) {
        const form = this.modal.querySelector(`#${formType}-form`);
        const btn = form.querySelector('.auth-btn.primary');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-spinner');

        if (loading) {
            btn.disabled = true;
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    /**
     * Reset all forms
     */
    resetForms() {
        this.modal.querySelectorAll('.auth-form').forEach(form => {
            form.reset();
        });

        // Clear custom validation
        this.modal.querySelectorAll('input').forEach(input => {
            input.setCustomValidity('');
            input.classList.remove('error');
        });
    }
}

// Export for use in other modules
window.AuthModal = AuthModal;