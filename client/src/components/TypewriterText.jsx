import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TypewriterText = ({
  text = '',
  speed = 30, // milliseconds per character
  delay = 0, // initial delay before starting
  onComplete = () => {},
  onStart = () => {},
  cursor = true,
  cursorChar = '|',
  className = '',
  preserveWhitespace = true,
  enablePauses = true // pauses at punctuation
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(cursor);
  const timeoutRef = useRef(null);
  const indexRef = useRef(0);
  const hasStartedRef = useRef(false);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset when text changes
  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);
    setShowCursor(cursor);
    indexRef.current = 0;
    hasStartedRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (text) {
      startTypewriter();
    }
  }, [text, speed, delay]);

  const startTypewriter = () => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onStart();
    }

    const typeNextCharacter = () => {
      if (indexRef.current < text.length) {
        const currentChar = text[indexRef.current];
        const newDisplayText = text.substring(0, indexRef.current + 1);

        setDisplayText(newDisplayText);
        indexRef.current += 1;

        // Calculate next delay
        let nextDelay = speed;

        if (enablePauses) {
          // Add pauses for natural reading rhythm
          if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
            nextDelay = speed * 8; // Longer pause after sentences
          } else if (currentChar === ',' || currentChar === ';' || currentChar === ':') {
            nextDelay = speed * 4; // Medium pause after clauses
          } else if (currentChar === ' ') {
            nextDelay = speed * 1.2; // Slight pause after words
          }
        }

        timeoutRef.current = setTimeout(typeNextCharacter, nextDelay);
      } else {
        // Typing complete
        setIsComplete(true);
        setShowCursor(false);
        onComplete();
      }
    };

    // Start typing after initial delay
    timeoutRef.current = setTimeout(typeNextCharacter, delay);
  };

  // Cursor blinking animation
  const cursorVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 }
  };

  const formatText = (text) => {
    if (!preserveWhitespace) {
      return text;
    }

    // Preserve whitespace and line breaks
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <span className={`inline ${className}`}>
      <span className="whitespace-pre-wrap">
        {formatText(displayText)}
      </span>
      {showCursor && (
        <motion.span
          variants={cursorVariants}
          animate={showCursor ? 'visible' : 'hidden'}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
          className="inline-block ml-0.5 font-mono"
          aria-hidden="true"
        >
          {cursorChar}
        </motion.span>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="false">
        {isComplete ? text : `Rabbi is typing: ${displayText}`}
      </div>
    </span>
  );
};

// Specialized typewriter variants
export const QuoteTypewriter = ({ quote, author, className = '', ...props }) => {
  const [showAuthor, setShowAuthor] = useState(false);

  return (
    <div className={className}>
      <TypewriterText
        text={`"${quote}"`}
        onComplete={() => setShowAuthor(true)}
        className="italic text-gray-700"
        {...props}
      />
      {showAuthor && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-right text-sm text-gray-500 mt-2"
        >
          — {author}
        </motion.div>
      )}
    </div>
  );
};

export const CodeTypewriter = ({ code, language = '', className = '', ...props }) => (
  <div className={`bg-gray-100 rounded-lg p-4 font-mono text-sm ${className}`}>
    {language && (
      <div className="text-xs text-gray-500 mb-2 uppercase font-sans">
        {language}
      </div>
    )}
    <TypewriterText
      text={code}
      speed={20}
      cursor={true}
      cursorChar="_"
      className="text-gray-800"
      {...props}
    />
  </div>
);

export const HebrewTypewriter = ({ text, className = '', ...props }) => (
  <TypewriterText
    text={text}
    speed={40} // Slower for Hebrew text
    className={`font-hebrew text-right ${className}`}
    direction="rtl"
    {...props}
  />
);

// Hook for controlling typewriter programmatically
export const useTypewriter = (text, options = {}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const start = () => {
    setIsTyping(true);
    setIsComplete(false);
    setDisplayText('');
  };

  const pause = () => {
    setIsTyping(false);
  };

  const reset = () => {
    setDisplayText('');
    setIsTyping(false);
    setIsComplete(false);
  };

  const complete = () => {
    setDisplayText(text);
    setIsTyping(false);
    setIsComplete(true);
  };

  return {
    displayText,
    isTyping,
    isComplete,
    start,
    pause,
    reset,
    complete
  };
};

export default TypewriterText;