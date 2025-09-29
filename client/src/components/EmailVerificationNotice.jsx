import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Inbox
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const EmailVerificationNotice = ({ email, onResendEmail, onBackToSignin, isVisible }) => {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, checking, verified, failed
  const [timeElapsed, setTimeElapsed] = useState(0);

  const { user, signUp } = useAuthStore();

  // Timer for resend cooldown
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Timer for elapsed time
  useEffect(() => {
    let interval;
    if (isVisible) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVisible]);

  // Check verification status periodically
  useEffect(() => {
    if (!isVisible) return;

    const checkVerification = async () => {
      // This would check with Supabase if the email is verified
      // For now, we'll simulate the check
      if (user?.email_confirmed_at) {
        setVerificationStatus('verified');
      }
    };

    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, [user, isVisible]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    try {
      setVerificationStatus('checking');

      // Resend verification email
      const result = await signUp(email, '', { resend: true });

      if (result.success) {
        toast.success('Verification email sent successfully!');
        setResendCooldown(60); // 60 second cooldown
        setVerificationStatus('pending');
      } else {
        toast.error(result.error || 'Failed to resend email');
        setVerificationStatus('failed');
      }
    } catch (error) {
      toast.error('An error occurred while resending email');
      setVerificationStatus('failed');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'checking':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'checking':
        return 'Checking verification status...';
      case 'verified':
        return 'Email verified successfully! You can now sign in.';
      case 'failed':
        return 'Verification failed. Please try again.';
      default:
        return 'Waiting for email verification...';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-[#31110F]/10 p-8 max-w-md mx-auto"
      >
        {/* Header with Icon */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <Mail className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-[#31110F] mb-2">
            Check Your Email
          </h2>
          <p className="text-[#31110F]/70">
            We've sent a verification link to
          </p>
          <p className="font-semibold text-[#31110F] break-all">
            {email}
          </p>
        </div>

        {/* Status Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon()}
            <span className="text-sm font-medium text-[#31110F]">
              {getStatusMessage()}
            </span>
          </div>

          {verificationStatus === 'pending' && (
            <div className="text-xs text-[#31110F]/60">
              Time elapsed: {formatTime(timeElapsed)}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Next Steps:
            </h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Check your email inbox for our message</li>
              <li>Look in your spam/junk folder if you don't see it</li>
              <li>Click the verification link in the email</li>
              <li>Return here to sign in</li>
            </ol>
          </div>

          {/* Email Provider Quick Links */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Gmail
            </a>
            <a
              href="https://outlook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Outlook
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Resend Email Button */}
          <motion.button
            onClick={handleResendEmail}
            disabled={resendCooldown > 0 || verificationStatus === 'checking'}
            whileHover={{ scale: resendCooldown > 0 ? 1 : 1.02 }}
            whileTap={{ scale: resendCooldown > 0 ? 1 : 0.98 }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            {verificationStatus === 'checking' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                Resend in {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Verification Email
              </>
            )}
          </motion.button>

          {/* Back to Sign In */}
          {verificationStatus === 'verified' ? (
            <motion.button
              onClick={onBackToSignin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Continue to Sign In
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <button
              onClick={onBackToSignin}
              className="w-full text-[#31110F] hover:text-[#4a1f1a] text-sm font-medium transition-colors underline-offset-4 hover:underline py-2"
            >
              Back to Sign In
            </button>
          )}
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 text-center">
          <details className="text-sm text-[#31110F]/60">
            <summary className="cursor-pointer hover:text-[#31110F] transition-colors">
              Not receiving emails? Click for help
            </summary>
            <div className="mt-3 text-left space-y-2 p-3 bg-gray-50 rounded-lg">
              <p>• Check your spam/junk folder</p>
              <p>• Make sure {email} is correct</p>
              <p>• Try adding noreply@chavrusa.ai to your contacts</p>
              <p>• Wait a few minutes and check again</p>
            </div>
          </details>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailVerificationNotice;