import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
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


  if (!selectedRabbiId && messages.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin relative z-0"
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto flex flex-col min-h-0">
        {/* Session Header - No animations */}
        {selectedRabbiId && messages.length === 0 && !isLoading && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 backdrop-blur-[30px] bg-white/40 text-[#31110F] rounded-2xl shadow-sm border border-white/30">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-[#31110F]">Learning with {selectedRabbiId}</span>
              <MessageCircle className="w-4 h-4 text-[#31110F]/60" />
            </div>
            <p className="text-sm text-[#31110F]/70 mt-4 font-normal leading-[135%] tracking-[-0.02em]">
              Ask a question to begin your Torah learning journey
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            <SkeletonLoader variant="message" />
            <SkeletonLoader variant="message" />
          </div>
        )}

        {/* Messages Container - No animations */}
        <div className="flex-1 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              messageIndex={index}
              showTypewriter={false}
            />
          ))}

          {/* Typing Indicator - No animations */}
          {isTyping && (
            <div>
              <TypingIndicator
                variant="thinking"
                rabbiName={selectedRabbiId}
              />
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Scroll to Bottom Button - No animations */}
      {showScrollButton && (
        <button
          onClick={() => {
            setIsAutoScrolling(true);
            scrollToBottom();
          }}
          className="fixed bottom-24 right-6 z-10 backdrop-blur-[30px] bg-white/30 border border-white/20 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Scroll to bottom"
        >
          <MessageCircle className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default ChatArea;