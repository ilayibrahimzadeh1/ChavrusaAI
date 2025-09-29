import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import ChatMessage from './ChatMessage';

const MessageWithTranslation = ({ message, showTypewriter, messageIndex }) => {
  const { currentLanguage, translateText, isTranslating } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [hasTranslation, setHasTranslation] = useState(false);
  const [isMessageTranslating, setIsMessageTranslating] = useState(false);

  // Auto-translate when language changes (only for non-user messages)
  useEffect(() => {
    const autoTranslate = async () => {
      // Only translate AI messages, and only if not in English
      if (message.isUser || currentLanguage === 'en' || !message.content) {
        setHasTranslation(false);
        setTranslatedContent('');
        return;
      }

      try {
        setIsMessageTranslating(true);
        const translated = await translateText(message.content, currentLanguage, 'en');

        // Only set translation if it's different from original
        if (translated && translated !== message.content) {
          setTranslatedContent(translated);
          setHasTranslation(true);
        } else {
          setHasTranslation(false);
          setTranslatedContent('');
        }
      } catch (error) {
        console.error('Message translation failed:', error);
        setHasTranslation(false);
        setTranslatedContent('');
      } finally {
        setIsMessageTranslating(false);
      }
    };

    autoTranslate();
  }, [currentLanguage, message.content, message.isUser, translateText]);

  // Toggle between original and translated
  const toggleTranslation = () => {
    setShowOriginal(!showOriginal);
  };

  // Create the display message with appropriate content
  const displayMessage = {
    ...message,
    content: hasTranslation && !showOriginal ? translatedContent : message.content
  };

  return (
    <div className="relative">
      <ChatMessage
        message={displayMessage}
        showTypewriter={showTypewriter}
        messageIndex={messageIndex}
      />

      {/* Translation Controls - Only show for AI messages with translation */}
      <AnimatePresence>
        {hasTranslation && !message.isUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start ml-11 -mt-2 mb-2"
          >
            <div className="flex items-center gap-2">
              {/* Translation Status Indicator */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Languages className="w-3 h-3" />
                <span>
                  {showOriginal ? 'Original' : 'Türkçe'}
                </span>
              </div>

              {/* Toggle Button */}
              <motion.button
                onClick={toggleTranslation}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 rounded-full transition-colors"
                title={showOriginal ? 'Show translation' : 'Show original'}
              >
                {showOriginal ? (
                  <>
                    <Languages className="w-3 h-3" />
                    <span>Show TR</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Show EN</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translation Loading Indicator */}
      <AnimatePresence>
        {isMessageTranslating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-start ml-11 -mt-2 mb-2"
          >
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Languages className="w-3 h-3" />
              </motion.div>
              <span>Translating...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageWithTranslation;