const express = require('express');
const supabaseService = require('../services/supabaseClient');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Authentication Controller
 * Handles user registration, login, profile management
 */

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters long',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseService.getUserClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || null
        }
      }
    });

    if (error) {
      logger.warn('User signup failed', {
        error: error.message,
        email,
        requestId: req.requestId
      });

      return res.status(400).json({
        error: {
          code: 'SIGNUP_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    // Create user profile if user was created successfully
    if (data.user) {
      try {
        await supabaseService.createUserProfile(data.user.id, {
          display_name: displayName || null
        });
      } catch (profileError) {
        logger.error('Failed to create user profile after signup', {
          error: profileError.message,
          userId: data.user.id,
          requestId: req.requestId
        });
        // Don't fail the signup, profile can be created later
      }
    }

    logger.info('User signed up successfully', {
      userId: data.user?.id,
      email,
      emailConfirmed: data.user?.email_confirmed_at ? true : false,
      requestId: req.requestId
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          emailConfirmed: data.user?.email_confirmed_at ? true : false,
          createdAt: data.user?.created_at
        },
        session: data.session,
        needsEmailConfirmation: !data.user?.email_confirmed_at
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    logger.error('Signup endpoint error', {
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during signup',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
});

/**
 * POST /api/auth/signin
 * Authenticate user with email and password
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabaseService.getUserClient().auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.warn('User signin failed', {
        error: error.message,
        email,
        requestId: req.requestId
      });

      return res.status(401).json({
        error: {
          code: 'SIGNIN_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    // Get or create user profile
    let profile = null;
    try {
      profile = await supabaseService.getUserProfile(data.user.id);
      if (!profile) {
        profile = await supabaseService.createUserProfile(data.user.id, {
          display_name: data.user.user_metadata?.display_name || null
        });
      }
    } catch (profileError) {
      logger.error('Failed to get/create user profile during signin', {
        error: profileError.message,
        userId: data.user.id,
        requestId: req.requestId
      });
    }

    logger.info('User signed in successfully', {
      userId: data.user.id,
      email,
      requestId: req.requestId
    });

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at ? true : false,
          lastSignIn: data.user.last_sign_in_at,
          createdAt: data.user.created_at
        },
        profile,
        session: data.session
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    logger.error('Signin endpoint error', {
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during signin',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
});

/**
 * POST /api/auth/signout
 * Sign out the current user
 */
router.post('/signout', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabaseService.getUserClient().auth.signOut();

    if (error) {
      logger.error('Signout failed', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      return res.status(400).json({
        error: {
          code: 'SIGNOUT_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    logger.info('User signed out successfully', {
      userId: req.user.id,
      requestId: req.requestId
    });

    res.json({
      success: true,
      message: 'Signed out successfully',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    logger.error('Signout endpoint error', {
      error: error.message,
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during signout',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user's profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await supabaseService.getUserProfile(req.user.id);

    if (!profile) {
      // Create profile if it doesn't exist
      const newProfile = await supabaseService.createUserProfile(req.user.id, {
        display_name: req.user.userMetadata?.display_name || null
      });

      return res.json({
        success: true,
        data: {
          user: req.user,
          profile: newProfile
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    res.json({
      success: true,
      data: {
        user: req.user,
        profile
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    logger.error('Get profile endpoint error', {
      error: error.message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user profile',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update current user's profile
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, preferredRabbi } = req.body;

    const updatedProfile = await supabaseService.createUserProfile(req.user.id, {
      display_name: displayName,
      preferred_rabbi: preferredRabbi
    });

    logger.info('User profile updated', {
      userId: req.user.id,
      changes: { displayName, preferredRabbi },
      requestId: req.requestId
    });

    res.json({
      success: true,
      data: {
        profile: updatedProfile
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    logger.error('Update profile endpoint error', {
      error: error.message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user profile',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    const { data, error } = await supabaseService.getUserClient().auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({
        error: {
          code: 'REFRESH_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    }

    res.json({
      success: true,
      data: {
        session: data.session,
        user: data.user
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });

  } catch (error) {
    logger.error('Token refresh endpoint error', {
      error: error.message,
      requestId: req.requestId
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during token refresh',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
});

/**
 * GET /api/auth/health
 * Health check for authentication service
 */
router.get('/health', async (req, res) => {
  try {
    const healthInfo = supabaseService.getHealthInfo();
    const dbConnected = await supabaseService.testConnection();

    res.json({
      success: true,
      data: {
        service: 'authentication',
        status: 'healthy',
        database: dbConnected ? 'connected' : 'disconnected',
        supabase: healthInfo,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Auth health check error', {
      error: error.message,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Authentication service health check failed',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }
});

module.exports = router;