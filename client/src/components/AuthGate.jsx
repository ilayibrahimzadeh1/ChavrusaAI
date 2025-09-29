import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import EmailVerificationNotice from './EmailVerificationNotice';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import tjcommunityLogo from '../assets/tjcommunity.png';
import toast from 'react-hot-toast';

const AuthGate = ({ onBack }) => {
  const [mode, setMode] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const {
    signIn,
    signUp,
    resetPassword,
    resendVerificationEmail,
    loading,
    error,
    clearError,
    authStep,
    pendingEmail,
    setAuthStep,
    getVerificationState,
    canResendEmail
  } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      const result = await signUp(formData.email, formData.password, {
        display_name: formData.displayName
      });

      if (result.success) {
        if (result.requiresVerification) {
          // Show email verification notice
          toast.success('Account created! Please check your email for verification.');
        } else {
          // User is signed in immediately (email confirmation disabled)
          toast.success('Welcome to ChavrusaAI!');
        }
      }
    } else if (mode === 'signin') {
      const result = await signIn(formData.email, formData.password);

      if (result.success) {
        toast.success('Welcome back!');
      }
    } else if (mode === 'forgot') {
      if (!formData.email) {
        toast.error('Please enter your email address');
        return;
      }

      const result = await resetPassword(formData.email);

      if (result.success) {
        toast.success('Password reset link sent to your email!');
        setMode('signin');
      }
    }
  };

  const handleResendEmail = async () => {
    if (!canResendEmail()) {
      toast.error('Please wait before requesting another email');
      return;
    }

    const result = await resendVerificationEmail();
    if (result.success) {
      toast.success('Verification email sent!');
    }
  };

  const handleBackToSignin = () => {
    setAuthStep('signin');
    setMode('signin');
    clearError();
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin';
    setMode(newMode);
    clearError();
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleForgotPassword = () => {
    setMode('forgot');
    clearError();
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      displayName: ''
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/\d/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 30;
    return Math.min(strength, 100);
  };

  // Clear error when mode changes
  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  // Show email verification notice if needed
  if (authStep === 'verification' && pendingEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#31110F]/5 via-amber-50/30 to-[#31110F]/10 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {onBack && (
            <motion.button
              onClick={onBack}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[#31110F]/70 hover:text-[#31110F] mb-8 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to landing</span>
            </motion.button>
          )}

          <EmailVerificationNotice
            email={pendingEmail}
            onResendEmail={handleResendEmail}
            onBackToSignin={handleBackToSignin}
            isVisible={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#31110F]/5 via-amber-50/30 to-[#31110F]/10 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-[#31110F]/70 hover:text-[#31110F] mb-8 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to landing</span>
          </motion.button>
        )}

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-[#31110F]/10 p-8"
        >
          {/* Logo */}
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg border-2 border-[#31110F]/10">
            <img src={tjcommunityLogo} alt="Turkish Jewish Community" className="w-28 h-28 rounded-full" />
          </div>

          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-[#31110F] mb-2">
              {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join ChavrusaAI' : 'Reset Password'}
            </h2>
            <p className="text-[#31110F]/70">
              {mode === 'signin'
                ? 'Sign in to continue your Torah learning journey'
                : mode === 'signup'
                ? 'Create your account to begin learning with our community'
                : 'Enter your email to receive a password reset link'
              }
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Display Name - Signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[#31110F] mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31110F]/40 focus:border-[#31110F]/40 bg-white/90 transition-all hover:border-[#31110F]/30"
                  placeholder="Your name"
                />
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-[#31110F] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31110F]/40 focus:border-[#31110F]/40 bg-white/90 transition-all hover:border-[#31110F]/30"
                placeholder="your@email.com"
              />
            </div>

            {/* Password - Not shown for forgot password */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-[#31110F] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31110F]/40 focus:border-[#31110F]/40 bg-white/90 transition-all hover:border-[#31110F]/30 pr-12"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#31110F]/60 hover:text-[#31110F] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator - Signup only */}
                {mode === 'signup' && (
                  <PasswordStrengthIndicator
                    password={formData.password}
                    showRequirements={true}
                  />
                )}
              </div>
            )}

            {/* Confirm Password - Signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[#31110F] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31110F]/40 focus:border-[#31110F]/40 bg-white/90 transition-all hover:border-[#31110F]/30 pr-12"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#31110F]/60 hover:text-[#31110F] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && formData.confirmPassword &&
                 formData.password !== formData.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm mt-2 font-medium flex items-center gap-1"
                  >
                    ❌ Passwords don't match
                  </motion.p>
                )}
                {formData.password && formData.confirmPassword &&
                 formData.password === formData.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-600 text-sm mt-2 font-medium flex items-center gap-1"
                  >
                    ✅ Passwords match
                  </motion.p>
                )}
              </div>
            )}

            {/* Remember Me - Signin only */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#31110F]/20 text-[#31110F] focus:ring-[#31110F]/40"
                  />
                  <span className="text-[#31110F]">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#31110F] hover:text-[#4a1f1a] transition-colors underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm shadow-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || (mode === 'signup' && (formData.password !== formData.confirmPassword || getPasswordStrength(formData.password) < 40))}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-[#31110F] to-[#4a1f1a] text-white py-3 px-4 rounded-lg hover:from-[#4a1f1a] hover:to-[#31110F] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending reset link...'}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {mode === 'signin' ? (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : mode === 'signup' ? (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </div>
              )}
            </motion.button>
          </motion.form>

          {/* Mode Toggle */}
          <div className="mt-6 text-center space-y-3">
            {mode === 'forgot' ? (
              <motion.button
                onClick={() => setMode('signin')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[#31110F] hover:text-[#4a1f1a] text-sm font-medium transition-colors underline-offset-4 hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Sign In
              </motion.button>
            ) : (
              <motion.button
                onClick={toggleMode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[#31110F] hover:text-[#4a1f1a] text-sm font-medium transition-colors underline-offset-4 hover:underline"
              >
                {mode === 'signin'
                  ? "Don't have an account? Create one"
                  : "Already have an account? Sign in"
                }
              </motion.button>
            )}
          </div>

          {/* Community Note */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-xs text-[#31110F]/60 leading-relaxed">
              Join the Turkish Jewish community in exploring Torah wisdom through AI-powered learning
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthGate;