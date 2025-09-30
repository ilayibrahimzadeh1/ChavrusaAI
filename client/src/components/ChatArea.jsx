import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, MessageCircle } from 'lucide-react';
import useChatStore from '../store/chatStore';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import SkeletonLoader from './SkeletonLoader';

const ChatArea = () => {
  const { sessions, currentSessionId, isTyping, selectedRabbiId, isLoading } = useChatStore();

  // Get messages from current session - this will trigger re-renders
  const messages = sessions[currentSessionId]?.messages || [];
  const messagesEndRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAutoScrolling(isAtBottom);
    setShowScrollButton(!isAtBottom && messages.length > 0);
  };

  useEffect(() => {
    if (isAutoScrolling) {
      scrollToBottom();
    }
  }, [messages, isTyping, isAutoScrolling]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const messageContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  if (!selectedRabbiId && messages.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 scrollbar-thin relative"
      onScroll={handleScroll}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto flex flex-col"
      >
        <AnimatePresence mode="wait">
          {/* Enhanced Session Header */}
          {selectedRabbiId && messages.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 backdrop-blur-[30px] bg-white/40 text-[#31110F] rounded-2xl shadow-sm border border-white/30">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </motion.div>
                <span className="font-medium text-[#31110F]">Learning with {selectedRabbiId}</span>
                <MessageCircle className="w-4 h-4 text-[#31110F]/60" />
              </div>

              {/* Subtle hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-[#31110F]/70 mt-4 font-normal leading-[135%] tracking-[-0.02em]"
              >
                Ask a question to begin your Torah learning journey
              </motion.p>
            </motion.div>
          )}

          {/* Loading skeleton for messages */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <SkeletonLoader variant="message" />
              <SkeletonLoader variant="message" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Container */}
        <motion.div
          variants={messageContainerVariants}
          className="flex-1 space-y-4"
        >
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                messageIndex={index}
                showTypewriter={isAutoScrolling}
              />
            ))}
          </AnimatePresence>

          {/* Enhanced Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
              >
                <TypingIndicator
                  variant="thinking"
                  rabbiName={selectedRabbiId}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </motion.div>
      </motion.div>

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsAutoScrolling(true);
              scrollToBottom();
            }}
            className="fixed bottom-24 right-6 z-10 backdrop-blur-[30px] bg-white/30 border border-white/20 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Scroll to bottom"
          >
            <motion.div
              animate={{ y: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatArea;