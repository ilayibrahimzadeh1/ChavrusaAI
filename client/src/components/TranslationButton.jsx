import React from 'react';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const TranslationButton = ({
  variant = 'default',
  size = 'md',
  showText = false,
  className = ''
}) => {
  const { currentLanguage, currentLanguageInfo, toggleLanguage, isTranslating } = useTranslation();

  // Variant styles
  const variants = {
    default: {
      base: 'bg-white/20 hover:bg-white/30 text-white',
      active: 'bg-white/30'
    },
    glass: {
      base: 'backdrop-blur-[30px] bg-white/25 hover:bg-white/35 text-white border border-white/20',
      active: 'bg-white/35'
    },
    header: {
      base: 'bg-white/10 hover:bg-white/20 text-[#31110F]/80 hover:text-[#31110F]',
      active: 'bg-white/20 text-[#31110F]'
    },
    solid: {
      base: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200',
      active: 'bg-gray-200'
    }
  };

  // Size styles
  const sizes = {
    sm: {
      button: 'p-1.5 text-xs',
      icon: 'w-3 h-3',
      flag: 'text-xs',
      text: 'text-xs'
    },
    md: {
      button: 'p-2 text-sm',
      icon: 'w-4 h-4',
      flag: 'text-sm',
      text: 'text-sm'
    },
    lg: {
      button: 'px-3 py-2 text-base',
      icon: 'w-5 h-5',
      flag: 'text-base',
      text: 'text-base'
    }
  };

  const variantClasses = variants[variant] || variants.default;
  const sizeClasses = sizes[size] || sizes.md;

  return (
    <motion.button
      onClick={toggleLanguage}
      disabled={isTranslating}
      className={`
        ${variantClasses.base}
        ${sizeClasses.button}
        ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        rounded-lg transition-all duration-200
        flex items-center gap-2
        ${className}
      `}
      whileHover={{ scale: isTranslating ? 1 : 1.02 }}
      whileTap={{ scale: isTranslating ? 1 : 0.98 }}
      title={`Switch to ${currentLanguage === 'en' ? 'Türkçe' : 'English'}`}
    >
      {/* Flag or Language Indicator */}
      <motion.span
        className={`${sizeClasses.flag} leading-none`}
        animate={{
          rotate: isTranslating ? 360 : 0
        }}
        transition={{
          duration: isTranslating ? 1 : 0.2,
          repeat: isTranslating ? Infinity : 0,
          ease: "linear"
        }}
      >
        {currentLanguageInfo.flag}
      </motion.span>

      {/* Language Code or Text */}
      {showText && (
        <span className={`${sizeClasses.text} font-medium`}>
          {currentLanguage.toUpperCase()}
        </span>
      )}

      {/* Loading indicator when translating */}
      {isTranslating && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Languages className={`${sizeClasses.icon} opacity-60`} />
        </motion.div>
      )}
    </motion.button>
  );
};

// Compact version for tight spaces
export const CompactTranslationButton = (props) => (
  <TranslationButton
    {...props}
    size="sm"
    variant="header"
    showText={false}
  />
);

// Full featured version for landing page
export const LandingTranslationButton = (props) => (
  <TranslationButton
    {...props}
    size="md"
    variant="glass"
    showText={true}
  />
);

// Text toggle version
export const TextTranslationButton = ({ className, ...props }) => {
  const { currentLanguage, toggleLanguage, isTranslating } = useTranslation();

  return (
    <motion.button
      onClick={toggleLanguage}
      disabled={isTranslating}
      className={`
        text-white/80 hover:text-white transition-colors text-sm font-medium
        ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={{ scale: isTranslating ? 1 : 1.02 }}
      whileTap={{ scale: isTranslating ? 1 : 0.98 }}
      {...props}
    >
      {currentLanguage === 'en' ? 'TR' : 'EN'}
      {isTranslating && (
        <motion.span
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="ml-1"
        >
          •
        </motion.span>
      )}
    </motion.button>
  );
};

export default TranslationButton;