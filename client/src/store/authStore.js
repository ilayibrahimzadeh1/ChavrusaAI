import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      session: null,
      profile: null,
      loading: false,
      error: null,
      initialized: false,

      // Enhanced auth state
      emailVerificationSent: false,
      passwordResetSent: false,
      lastEmailSent: null,
      authStep: 'signin', // signin, signup, verification, reset
      pendingEmail: null,

      // Initialize auth state and set up auth listener
      initialize: async () => {
        try {
          set({ loading: true })

          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            console.error('Error getting session:', error)
            set({ error: error.message, loading: false })
            return
          }

          if (session) {
            await get().setSession(session)
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email)

            // Handle all events that provide a valid session
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
              if (session) {
                console.log('🔄 Updating session for event:', event)
                try {
                  await get().setSession(session)

                  // Load chat sessions after auth is fully updated
                  const { default: useChatStore } = await import('./chatStore')
                  const chatStore = useChatStore.getState()
                  await chatStore.loadUserSessions()
                } catch (error) {
                  console.error('Error updating session:', error)
                }
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('🚪 Clearing auth on sign out')
              get().clearAuth()

              // Clear chat sessions on sign out
              const { default: useChatStore } = await import('./chatStore')
              const chatStore = useChatStore.getState()
              chatStore.clearAllSessions()
            }
          })

          set({ initialized: true, loading: false })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ initialized: true, loading: false, error: error.message })
        }
      },

      // Set session and fetch user profile
      setSession: async (session) => {
        set({ session, user: session?.user || null })

        if (session?.user) {
          await get().fetchProfile()
        }
      },

      // Clear authentication state while preserving chat data
      clearAuth: () => {
        // Preserve chat sessions during auth state changes
        try {
          const chatStorage = localStorage.getItem('chavrusa-chat-persist');
          const preservedChatData = chatStorage ? JSON.parse(chatStorage) : null;

          set({
            user: null,
            session: null,
            profile: null,
            error: null,
            emailVerificationSent: false,
            passwordResetSent: false,
            lastEmailSent: null,
            authStep: 'signin',
            pendingEmail: null
          });

          // Restore chat sessions after auth clear
          if (preservedChatData && preservedChatData.state) {
            setTimeout(() => {
              try {
                localStorage.setItem('chavrusa-chat-persist', chatStorage);
                console.log('🔒 Chat sessions preserved during auth state change');
              } catch (error) {
                console.warn('Failed to restore chat sessions:', error);
              }
            }, 100);
          }
        } catch (error) {
          console.warn('Auth clear with chat preservation failed:', error);
          // Fallback to normal clear
          set({
            user: null,
            session: null,
            profile: null,
            error: null,
            emailVerificationSent: false,
            passwordResetSent: false,
            lastEmailSent: null,
            authStep: 'signin',
            pendingEmail: null
          });
        }
      },

      // Set auth step and related state
      setAuthStep: (step, email = null) => {
        set({
          authStep: step,
          pendingEmail: email,
          error: null
        })
      },

      // Sign up new user
      signUp: async (email, password, userData = {}) => {
        try {
          set({ loading: true, error: null })

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userData
            }
          })

          if (error) {
            // Enhanced error handling with user-friendly messages
            let friendlyMessage = error.message
            if (error.message.includes('already registered')) {
              friendlyMessage = 'This email is already registered. Try signing in instead.'
            } else if (error.message.includes('password')) {
              friendlyMessage = 'Password must be at least 6 characters long.'
            } else if (error.message.includes('email')) {
              friendlyMessage = 'Please enter a valid email address.'
            }

            set({ error: friendlyMessage, loading: false })
            return { success: false, error: friendlyMessage }
          }

          // Set verification state
          set({
            loading: false,
            emailVerificationSent: true,
            lastEmailSent: new Date().toISOString(),
            authStep: 'verification',
            pendingEmail: email
          })

          return { success: true, data, requiresVerification: !data.session }
        } catch (error) {
          console.error('Sign up error:', error)
          const friendlyMessage = 'An unexpected error occurred. Please try again.'
          set({ error: friendlyMessage, loading: false })
          return { success: false, error: friendlyMessage }
        }
      },

      // Resend verification email
      resendVerificationEmail: async (email = null) => {
        try {
          set({ loading: true, error: null })

          const emailToUse = email || get().pendingEmail
          if (!emailToUse) {
            set({ error: 'No email address found', loading: false })
            return { success: false, error: 'No email address found' }
          }

          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: emailToUse
          })

          if (error) {
            set({ error: error.message, loading: false })
            return { success: false, error: error.message }
          }

          set({
            loading: false,
            lastEmailSent: new Date().toISOString()
          })

          return { success: true }
        } catch (error) {
          console.error('Resend verification error:', error)
          set({ error: error.message, loading: false })
          return { success: false, error: error.message }
        }
      },

      // Sign in existing user
      signIn: async (email, password) => {
        try {
          set({ loading: true, error: null })

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (error) {
            // Enhanced error handling with user-friendly messages
            let friendlyMessage = error.message
            if (error.message.includes('Invalid login credentials')) {
              friendlyMessage = 'Invalid email or password. Please check your credentials and try again.'
            } else if (error.message.includes('Email not confirmed')) {
              friendlyMessage = 'Please verify your email address before signing in. Check your inbox for a verification link.'
              set({
                authStep: 'verification',
                pendingEmail: email,
                emailVerificationSent: true
              })
            } else if (error.message.includes('Too many requests')) {
              friendlyMessage = 'Too many sign-in attempts. Please wait a moment and try again.'
            }

            set({ error: friendlyMessage, loading: false })
            return { success: false, error: friendlyMessage }
          }

          // Clear verification state on successful signin
          set({
            loading: false,
            authStep: 'signin',
            emailVerificationSent: false,
            pendingEmail: null
          })

          return { success: true, data }
        } catch (error) {
          console.error('Sign in error:', error)
          const friendlyMessage = 'An unexpected error occurred. Please try again.'
          set({ error: friendlyMessage, loading: false })
          return { success: false, error: friendlyMessage }
        }
      },

      // Sign out user
      signOut: async () => {
        try {
          set({ loading: true, error: null })

          const { error } = await supabase.auth.signOut()

          if (error) {
            set({ error: error.message, loading: false })
            return { success: false, error: error.message }
          }

          get().clearAuth()
          set({ loading: false })
          return { success: true }
        } catch (error) {
          console.error('Sign out error:', error)
          set({ error: error.message, loading: false })
          return { success: false, error: error.message }
        }
      },

      // Fetch user profile
      fetchProfile: async () => {
        try {
          const { user } = get()
          if (!user) return

          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const profile = await response.json()
            set({ profile })
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      },

      // Update user profile
      updateProfile: async (updates) => {
        try {
          set({ loading: true, error: null })

          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
          })

          if (!response.ok) {
            const error = await response.text()
            set({ error, loading: false })
            return { success: false, error }
          }

          const profile = await response.json()
          set({ profile, loading: false })
          return { success: true, profile }
        } catch (error) {
          console.error('Update profile error:', error)
          set({ error: error.message, loading: false })
          return { success: false, error: error.message }
        }
      },

      // Reset password
      resetPassword: async (email) => {
        try {
          set({ loading: true, error: null })

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          })

          if (error) {
            let friendlyMessage = error.message
            if (error.message.includes('email')) {
              friendlyMessage = 'Please enter a valid email address.'
            } else if (error.message.includes('not found')) {
              friendlyMessage = 'No account found with this email address.'
            }

            set({ error: friendlyMessage, loading: false })
            return { success: false, error: friendlyMessage }
          }

          set({
            loading: false,
            passwordResetSent: true,
            lastEmailSent: new Date().toISOString(),
            authStep: 'reset',
            pendingEmail: email
          })

          return { success: true }
        } catch (error) {
          console.error('Reset password error:', error)
          const friendlyMessage = 'An unexpected error occurred. Please try again.'
          set({ error: friendlyMessage, loading: false })
          return { success: false, error: friendlyMessage }
        }
      },

      // Get auth headers for API calls
      getAuthHeaders: () => {
        const { session } = get()
        return session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      },

      // Check if user is authenticated
      isAuthenticated: () => {
        const { session } = get()
        return !!session?.access_token
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Get verification state
      getVerificationState: () => {
        const state = get()
        return {
          emailVerificationSent: state.emailVerificationSent,
          passwordResetSent: state.passwordResetSent,
          lastEmailSent: state.lastEmailSent,
          authStep: state.authStep,
          pendingEmail: state.pendingEmail
        }
      },

      // Check if can resend email (60 second cooldown)
      canResendEmail: () => {
        const { lastEmailSent } = get()
        if (!lastEmailSent) return true

        const lastSent = new Date(lastEmailSent)
        const now = new Date()
        const diffInSeconds = (now - lastSent) / 1000

        return diffInSeconds >= 60
      }
    }),
    {
      name: 'chavrusa-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        emailVerificationSent: state.emailVerificationSent,
        passwordResetSent: state.passwordResetSent,
        lastEmailSent: state.lastEmailSent,
        authStep: state.authStep,
        pendingEmail: state.pendingEmail
      })
    }
  )
)

export default useAuthStore