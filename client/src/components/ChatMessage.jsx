import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Book,
  User,
  ExternalLink
} from 'lucide-react';
import useChatStore from '../store/chatStore';
import TypewriterText from './TypewriterText';

const ChatMessage = ({ message, showTypewriter = true, messageIndex = 0 }) => {
  const { retryMessage } = useChatStore();
  const [showReferences, setShowReferences] = useState(false);
  const [isNewMessage, setIsNewMessage] = useState(false);

  // Check if this is a newly arrived AI message that should use typewriter
  useEffect(() => {
    if (!message.isUser && message.status === 'delivered' && showTypewriter) {
      const messageAge = Date.now() - new Date(message.timestamp).getTime();
      setIsNewMessage(messageAge < 2000); // Show typewriter for messages less than 2 seconds old
    }
  }, [message, showTypewriter]);
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleRetry = () => {
    retryMessage(message.id);
  };

  const messageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: messageIndex * 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const contentVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.1,
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex gap-3 max-w-[90%] sm:max-w-[75%] md:max-w-[70%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Enhanced Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
            message.isUser
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
              : 'bg-gradient-to-br from-gray-600 to-gray-700 text-white'
          }`}
        >
          {message.isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Book className="w-4 h-4" />
          )}
        </motion.div>

        {/* Message Content */}
        <div className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}>
          <motion.div
            variants={contentVariants}
            className={`rounded-2xl px-4 py-3 shadow-sm ${
              message.isUser
                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {/* Message Text with Typewriter Effect */}
            <div className="text-sm leading-relaxed">
              {!message.isUser && isNewMessage ? (
                <TypewriterText
                  text={message.content}
                  speed={5}
                  onComplete={() => setShowReferences(true)}
                  className="whitespace-pre-wrap"
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>

            {/* Enhanced References */}
            <AnimatePresence>
              {message.references && message.references.length > 0 && (showReferences || message.isUser || !isNewMessage) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: isNewMessage ? 0.5 : 0 }}
                  className="mt-4 pt-3 border-t border-gray-200/50"
                >
                  <div className="flex items-center gap-1 mb-2">
                    <Book className="w-3 h-3 text-gray-500" />
                    <p className="text-xs font-semibold text-gray-600">Torah Sources:</p>
                  </div>
                  <div className="space-y-2">
                    {message.references.map((ref, index) => (
                      <motion.a
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors group"
                        aria-label={`Open ${ref.reference} in new tab - external link`}
                      >
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        <span className="font-medium">{ref.reference}</span>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Enhanced Message Meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 mt-2 px-2"
          >
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
            {message.isUser && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {getStatusIcon()}
              </motion.div>
            )}
            {message.status === 'failed' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-full transition-colors accessible-button"
                aria-label="Retry sending this message"
                type="button"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;