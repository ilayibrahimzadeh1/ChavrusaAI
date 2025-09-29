import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquarePlus,
  BookOpen,
  X,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import SessionList from './SessionList';

const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { currentRabbi, clearChat, createSession, currentSession, sessions } = useChatStore();
  const { signOut, user } = useAuthStore();


  const handleNewChat = async () => {
    try {
      await createSession();
      onClose?.();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose?.();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{
          x: isOpen ? 0 : -300,
          width: isCollapsed ? '4rem' : isOpen ? '20rem' : '20rem'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-0 left-0 h-full backdrop-blur-[30px] bg-white/90 shadow-xl z-50 flex flex-col lg:relative lg:z-auto border-r border-white/20 ${
          isCollapsed ? 'w-16' : 'w-full sm:w-80 max-w-sm'
        }`}
      >
        {/* Header with collapse toggle */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                <h1 className="text-sm font-medium text-[#31110F]">ChavrusaAI</h1>
              </div>
            )}

            {isCollapsed && (
              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center mx-auto">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex items-center gap-1">
              {/* Collapse toggle button (desktop only) */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-1.5 rounded-lg text-[#31110F]/60 hover:text-[#31110F] hover:bg-white/20 transition-colors"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                type="button"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>

              {/* Close button (mobile only) */}
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-[#31110F]/60 hover:text-[#31110F] hover:bg-white/20 transition-colors"
                aria-label="Close navigation menu"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        {!isCollapsed && (
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full bg-[#31110F] hover:bg-[#31110F]/90 text-white font-medium py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              aria-label="Start a new conversation"
              type="button"
            >
              <MessageSquarePlus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        )}


        {/* Session Management */}
        <div className="flex-1 overflow-y-auto">
          <SessionList isCollapsed={isCollapsed} />
        </div>


        {/* Bottom Actions */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/20 space-y-1">
            <button
              className="w-full p-2 rounded-lg text-[#31110F]/60 hover:text-[#31110F] hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
              aria-label="Open settings"
              type="button"
              onClick={() => {/* Add settings functionality */}}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            <button
              className="w-full p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50/20 transition-colors flex items-center gap-2 text-sm"
              aria-label="Sign out"
              type="button"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Collapsed Bottom Actions */}
        {isCollapsed && (
          <div className="p-2 border-t border-white/20 space-y-2">
            <button
              className="w-full p-2 rounded-lg text-[#31110F]/60 hover:text-[#31110F] hover:bg-white/20 transition-colors flex items-center justify-center"
              aria-label="Open settings"
              type="button"
              onClick={() => {/* Add settings functionality */}}
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              className="w-full p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50/20 transition-colors flex items-center justify-center"
              aria-label="Sign out"
              type="button"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default React.memo(Sidebar);