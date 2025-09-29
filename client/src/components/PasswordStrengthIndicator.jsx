import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Shield,
  Lock,
  Eye,
  AlertTriangle
} from 'lucide-react';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  // Password strength criteria
  const criteria = [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8,
      weight: 2
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd),
      weight: 1
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd),
      weight: 1
    },
    {
      id: 'number',
      label: 'One number',
      test: (pwd) => /\d/.test(pwd),
      weight: 1
    },
    {
      id: 'special',
      label: 'One special character (!@#$%^&*)',
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      weight: 2
    }
  ];

  // Calculate password strength
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, level: 'none', color: 'gray' };

    const passedCriteria = criteria.filter(criterion => criterion.test(pwd));
    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    const achievedWeight = passedCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);

    const score = (achievedWeight / totalWeight) * 100;

    let level, color;
    if (score >= 85) {
      level = 'Strong';
      color = 'green';
    } else if (score >= 60) {
      level = 'Good';
      color = 'blue';
    } else if (score >= 40) {
      level = 'Fair';
      color = 'yellow';
    } else if (score > 0) {
      level = 'Weak';
      color = 'red';
    } else {
      level = 'none';
      color = 'gray';
    }

    return { score, level, color, passedCriteria };
  };

  const strength = calculateStrength(password);

  const getStrengthIcon = () => {
    switch (strength.level) {
      case 'Strong':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'Good':
        return <Lock className="w-4 h-4 text-blue-500" />;
      case 'Fair':
        return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'Weak':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Lock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      green: {
        bg: 'bg-green-500',
        text: 'text-green-600',
        bgLight: 'bg-green-50',
        border: 'border-green-200'
      },
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        bgLight: 'bg-blue-50',
        border: 'border-blue-200'
      },
      yellow: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600',
        bgLight: 'bg-yellow-50',
        border: 'border-yellow-200'
      },
      red: {
        bg: 'bg-red-500',
        text: 'text-red-600',
        bgLight: 'bg-red-50',
        border: 'border-red-200'
      },
      gray: {
        bg: 'bg-gray-300',
        text: 'text-gray-500',
        bgLight: 'bg-gray-50',
        border: 'border-gray-200'
      }
    };
    return colors[color] || colors.gray;
  };

  if (!password && !showRequirements) return null;

  const colorClasses = getColorClasses(strength.color);

  return (
    <AnimatePresence>
      {(password || showRequirements) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 space-y-3"
        >
          {/* Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStrengthIcon()}
                  <span className={`text-sm font-medium ${colorClasses.text}`}>
                    Password Strength: {strength.level}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(strength.score)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${strength.score}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full ${colorClasses.bg} rounded-full`}
                />
              </div>
            </div>
          )}

          {/* Requirements List */}
          {showRequirements && (
            <div className={`rounded-lg border p-3 ${colorClasses.bgLight} ${colorClasses.border}`}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Password Requirements:
              </h4>
              <div className="space-y-1">
                {criteria.map((criterion) => {
                  const isPassed = password ? criterion.test(password) : false;
                  const isChecking = password && password.length > 0;

                  return (
                    <motion.div
                      key={criterion.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: criteria.indexOf(criterion) * 0.1 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="flex-shrink-0">
                        {isPassed ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </motion.div>
                        ) : isChecking ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <span className={`${
                        isPassed
                          ? 'text-green-600 font-medium'
                          : isChecking
                          ? 'text-red-500'
                          : 'text-gray-600'
                      }`}>
                        {criterion.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Password Tips */}
              {password && strength.level === 'Weak' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700"
                >
                  <strong>💡 Tip:</strong> Try adding numbers, symbols, or mixing upper and lowercase letters to strengthen your password.
                </motion.div>
              )}

              {password && strength.level === 'Strong' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700"
                >
                  <strong>🎉 Excellent!</strong> Your password is strong and secure.
                </motion.div>
              )}
            </div>
          )}

          {/* Security Recommendations */}
          {password && strength.score < 60 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-gray-500 space-y-1"
            >
              <p><strong>Security Tips:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Use a unique password for ChavrusaAI</li>
                <li>Consider using a password manager</li>
                <li>Avoid common words or personal information</li>
              </ul>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordStrengthIndicator;