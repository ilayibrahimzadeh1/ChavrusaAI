import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Brain, Sparkles } from 'lucide-react';
import useChatStore from '../store/chatStore';

const TypingIndicator = ({
  variant = 'default',
  rabbiName = null,
  showThinking = true
}) => {
  const { currentRabbi } = useChatStore();
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const [showDots, setShowDots] = useState(false);

  const thinkingPhrases = [
    "Contemplating the wisdom...",
    "Consulting ancient texts...",
    "Reflecting on the teachings...",
    "Preparing a thoughtful response..."
  ];

  useEffect(() => {
    // Show thinking text first, then dots
    const thinkingTimer = setTimeout(() => {
      setShowDots(true);
    }, 1500);

    // Cycle through thinking phrases
    const phraseInterval = setInterval(() => {
      setThinkingPhase(prev => (prev + 1) % thinkingPhrases.length);
    }, 2000);

    return () => {
      clearTimeout(thinkingTimer);
      clearInterval(phraseInterval);
    };
  }, []);

  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: {
      y: [-2, -6, -2],
      opacity: [0.4, 1, 0.4],
      scale: [1, 1.2, 1]
    }
  };

  const bubbleVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.8
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const renderAvatar = () => {
    const displayName = rabbiName || currentRabbi;

    return (
      <motion.div
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-sm"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div
          animate={{
            rotate: showThinking ? [0, 5, -5, 0] : 0,
            scale: showThinking ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: 2,
            repeat: showThinking ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <Book className="w-4 h-4" />
        </motion.div>
      </motion.div>
    );
  };

  const renderTypingContent = () => {
    if (variant === 'thinking' && showThinking && !showDots) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={thinkingPhase}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-3 h-3" />
            </motion.div>
            <span className="italic">{thinkingPhrases[thinkingPhase]}</span>
          </motion.div>
        </AnimatePresence>
      );
    }

    // Enhanced typing dots
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Subtle sparkle effect */}
        <motion.div
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1
          }}
          className="ml-1"
        >
          <Sparkles className="w-3 h-3 text-primary-400" />
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex justify-start mb-4"
    >
      {/* Accessibility announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentRabbi ? `${currentRabbi} is typing a response` : 'Rabbi is typing a response'}
      </div>

      <div className="flex gap-3 max-w-[85%]">
        {renderAvatar()}

        <motion.div
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl px-4 py-3 border border-gray-200/50 shadow-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {renderTypingContent()}
        </motion.div>
      </div>

      {/* Subtle pulse background effect */}
      <motion.div
        className="absolute inset-0 bg-primary-50 rounded-2xl -z-10"
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0, 0.3, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

// Specialized typing indicator variants
export const ThinkingIndicator = ({ rabbiName }) => (
  <TypingIndicator variant="thinking" rabbiName={rabbiName} showThinking={true} />
);

export const QuickTypingIndicator = ({ rabbiName }) => (
  <TypingIndicator variant="quick" rabbiName={rabbiName} showThinking={false} />
);

export default TypingIndicator;