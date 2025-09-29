const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Supabase client configuration for server-side operations
 * Uses service role key for admin operations and bypass RLS when needed
 */
class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    // Make Supabase optional - log warning but don't crash if not configured
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      logger.warn('Supabase environment variables not configured - Supabase features will be disabled');
      this.isEnabled = false;
      return;
    }

    this.isEnabled = true;

    try {
      // Service role client for admin operations
      this.adminClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Anon client for user operations (respects RLS)
      this.userClient = createClient(this.supabaseUrl, this.supabaseAnonKey);

      logger.info('Supabase client initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize Supabase client:', error.message);
      this.isEnabled = false;
    }
  }

  /**
   * Get admin client for bypassing RLS (use carefully)
   * @returns {Object} Supabase admin client
   */
  getAdminClient() {
    if (!this.isEnabled) {
      logger.warn('Supabase is not enabled');
      return null;
    }
    return this.adminClient;
  }

  /**
   * Get user client for normal operations (respects RLS)
   * @returns {Object} Supabase user client
   */
  getUserClient() {
    if (!this.isEnabled) {
      logger.warn('Supabase is not enabled');
      return null;
    }
    return this.userClient;
  }

  /**
   * Validate JWT token and get user information
   * @param {string} token - JWT token from Authorization header
   * @returns {Object} User data and session info
   */
  async validateToken(token) {
    if (!this.isEnabled) {
      logger.warn('Supabase is not enabled - token validation disabled');
      return { user: null, error: 'Supabase not configured' };
    }

    try {
      const { data: { user }, error } = await this.userClient.auth.getUser(token);

      if (error) {
        logger.warn('Token validation failed', { error: error.message });
        return { user: null, error };
      }

      return { user, error: null };
    } catch (error) {
      logger.error('Error validating token', { error: error.message });
      return { user: null, error };
    }
  }

  /**
   * Create or update user profile
   * @param {string} userId - User ID from auth.users
   * @param {Object} profileData - Profile information
   * @returns {Object} Created/updated profile
   */
  async createUserProfile(userId, profileData = {}) {
    try {
      const { data, error } = await this.adminClient
        .from('user_profiles')
        .upsert({
          id: userId,
          display_name: profileData.display_name || null,
          preferred_rabbi: profileData.preferred_rabbi || null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating user profile', { error: error.message, userId });
        throw error;
      }

      logger.info('User profile created/updated', { userId, profileId: data.id });
      return data;
    } catch (error) {
      logger.error('Failed to create user profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Object} User profile data
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.adminClient
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        logger.error('Error fetching user profile', { error: error.message, userId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get user profile', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Test database connection
   * @returns {boolean} Connection status
   */
  async testConnection() {
    try {
      const { data, error } = await this.adminClient
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error) {
        logger.error('Database connection test failed', { error: error.message });
        return false;
      }

      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection error', { error: error.message });
      return false;
    }
  }

  /**
   * Get service health information
   * @returns {Object} Health status
   */
  getHealthInfo() {
    return {
      supabaseUrl: this.supabaseUrl ? 'configured' : 'missing',
      serviceKey: this.supabaseServiceKey ? 'configured' : 'missing',
      anonKey: this.supabaseAnonKey ? 'configured' : 'missing',
      clientsInitialized: !!(this.adminClient && this.userClient)
    };
  }
}

// Export singleton instance with error handling
let supabaseInstance;
try {
  supabaseInstance = new SupabaseService();
  logger.info('Supabase service loaded successfully');
} catch (error) {
  // Create a disabled instance if Supabase is not configured
  supabaseInstance = {
    isEnabled: false,
    getAdminClient: () => null,
    getUserClient: () => null,
    validateToken: async () => ({ user: null, error: 'Supabase not configured' }),
    testConnection: async () => false,
    getHealthInfo: () => ({
      supabaseUrl: 'not configured',
      serviceKey: 'not configured',
      anonKey: 'not configured',
      clientsInitialized: false,
      isEnabled: false
    })
  };
  logger.warn('Supabase service disabled - configuration missing');
}

module.exports = supabaseInstance;