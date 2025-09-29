import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic, StopCircle, AlertCircle } from 'lucide-react';
import useChatStore from '../store/chatStore';
import toast from 'react-hot-toast';

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const MAX_MESSAGE_LENGTH = 2000;
  const textareaRef = useRef(null);
  const { sendMessage, selectedRabbiId, isTyping, isSelectingRabbi, abortCurrentMessage, currentAbortController } = useChatStore();

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long (${message.length}/${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }

    if (!selectedRabbiId) {
      toast.error('Please select a rabbi to start learning');
      return;
    }

    setError('');
    const messageToSend = message.trim();
    setMessage('');
    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast('Voice recording coming soon!', {
        icon: '🎤',
        duration: 2000
      });
    }
  };

  const suggestedQuestions = [
    "What is the meaning of Shabbat?",
    "Explain Genesis 1:1",
    "Tell me about the Ten Commandments",
    "What is tzedakah?"
  ];

  return (
    <div className="px-6 py-4">
      <div className="backdrop-blur-[30px] bg-white/40 rounded-2xl shadow-sm border border-white/30 p-4">
        {/* Suggested Questions */}
        {!selectedRabbiId && (
          <div className="mb-4">
            <p className="text-xs text-[#31110F]/70 mb-2 font-normal">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(question)}
                  className="text-xs px-3 py-1.5 bg-white/40 hover:bg-white/50 text-[#31110F] rounded-full transition-colors border border-white/30"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError(''); // Clear error on input
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isSelectingRabbi
                ? "Setting up your learning session..."
                : selectedRabbiId
                ? "Ask your question..."
                : "Select a rabbi to begin learning..."
            }
            disabled={isTyping || isSelectingRabbi}
            className={`w-full px-4 py-3 pr-20 bg-white/50 border rounded-xl resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[#31110F] placeholder-[#31110F]/50 ${
              error
                ? 'border-red-300 bg-red-50/50'
                : 'border-white/30 focus:border-white/50'
            }`}
            rows="1"
            maxLength={MAX_MESSAGE_LENGTH}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'message-error' : 'char-count'}
          />

          {/* Character Counter */}
          <div
            id="char-count"
            className={`absolute bottom-1 right-16 text-xs transition-colors ${
              message.length > MAX_MESSAGE_LENGTH * 0.9
                ? 'text-red-500'
                : 'text-gray-400'
            }`}
          >
            {message.length}/{MAX_MESSAGE_LENGTH}
          </div>

          {/* Attachment Button */}
          <button
            type="button"
            className="absolute right-2 bottom-3 p-1.5 text-[#31110F]/40 hover:text-[#31110F]/60 transition-colors rounded"
            onClick={() => toast('File attachments coming soon!', { icon: '📎' })}
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div id="message-error" className="error-message">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Voice Recording Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={toggleRecording}
          className={`p-3 rounded-xl transition-colors ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white/40 hover:bg-white/50 text-[#31110F] border border-white/30'
          }`}
          aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
          aria-pressed={isRecording}
        >
          {isRecording ? (
            <StopCircle className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </motion.button>

        {/* Send/Abort Button */}
        {isTyping && currentAbortController ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={abortCurrentMessage}
            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-normal text-[16px] leading-[120%] tracking-[-0.02em] transition-colors"
            aria-label="Stop message"
          >
            <StopCircle className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={!message.trim() || isTyping || isSelectingRabbi}
            className="px-4 py-3 bg-[#31110F] hover:bg-[#31110F]/90 text-white rounded-xl font-normal text-[16px] leading-[120%] tracking-[-0.02em] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        )}
      </form>
      </div>
    </div>
  );
};

export default ChatInput;