import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageCircle,
  Calendar,
  Trash2,
  Edit3,
  CheckCircle,
  X,
  MoreVertical,
  Book
} from 'lucide-react';
import useChatStore from '../store/chatStore';
import SkeletonLoader from './SkeletonLoader';

const SessionList = ({ isCollapsed = false }) => {
  const {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    getSortedSessions
  } = useChatStore();

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const sortedSessions = getSortedSessions();

  const handleCreateSession = async () => {
    try {
      await createSession();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId);
    }
    setDropdownOpen(null);
  };

  const startEditingTitle = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
    setDropdownOpen(null);
  };

  const saveTitle = () => {
    if (editTitle.trim() && editingSessionId) {
      updateSessionTitle(editingSessionId, editTitle.trim());
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getSessionPreview = (session) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return 'No messages yet';

    const preview = lastMessage.content.slice(0, 50);
    return lastMessage.isUser
      ? `You: ${preview}${preview.length === 50 ? '...' : ''}`
      : preview + (preview.length === 50 ? '...' : '');
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  if (isCollapsed) {
    return (
      <div className="py-4">
        <motion.button
          onClick={handleCreateSession}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 mx-auto mb-4 bg-[#31110F] hover:bg-[#31110F]/90 text-white rounded-lg flex items-center justify-center transition-colors"
          title="New Session"
        >
          <Plus className="w-5 h-5" />
        </motion.button>

        <div className="space-y-2">
          {sortedSessions.slice(0, 5).map((session) => (
            <motion.button
              key={session.id}
              onClick={() => switchSession(session.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors relative ${
                session.id === currentSessionId
                  ? 'bg-[#31110F]/20 text-[#31110F] ring-2 ring-[#31110F]/40'
                  : 'bg-white/40 hover:bg-white/60 text-[#31110F]/60 border border-white/30'
              }`}
              title={session.title}
            >
              <MessageCircle className="w-4 h-4" />
              {session.id === currentSessionId && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#31110F] rounded-full" />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Minimal Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#31110F]/50">Sessions</p>
        <motion.button
          onClick={handleCreateSession}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-1.5 bg-[#31110F]/10 hover:bg-[#31110F]/20 text-[#31110F] rounded-lg transition-colors"
          title="New Session"
        >
          <Plus className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sortedSessions.length === 0 ? (
          <div className="text-center py-6">
            <MessageCircle className="w-8 h-8 text-[#31110F]/20 mx-auto mb-2" />
            <p className="text-[#31110F]/50 text-xs">No sessions yet</p>
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            <AnimatePresence>
              {sortedSessions.map((session) => (
                <motion.div
                  key={session.id}
                  variants={itemVariants}
                  layout
                  className={`relative group rounded-lg p-2.5 cursor-pointer transition-all duration-200 ${
                    session.id === currentSessionId
                      ? 'bg-[#31110F]/10 border border-[#31110F]/20'
                      : 'hover:bg-white/50 border border-transparent hover:border-white/30'
                  }`}
                  onClick={() => switchSession(session.id)}
                >
                  {/* Active Session Indicator */}
                  {session.id === currentSessionId && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#31110F] rounded-full"
                    />
                  )}

                  {/* Minimal Session Content */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTitle();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            onBlur={saveTitle}
                            className="flex-1 text-xs bg-white border border-[#31110F]/20 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#31110F]/30"
                            autoFocus
                          />
                          <button
                            onClick={saveTitle}
                            className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                          >
                            <CheckCircle className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <h4 className={`text-xs font-medium truncate ${
                          session.id === currentSessionId ? 'text-[#31110F]' : 'text-[#31110F]/70'
                        }`}>
                          {session.title}
                        </h4>
                      )}

                      {/* Time and message count */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-[#31110F]/40">
                          {formatTimeAgo(session.lastActivity)}
                        </span>
                        <span className="text-xs text-[#31110F]/40">
                          • {session.messages.length}
                        </span>
                      </div>
                    </div>

                    {/* Simple Actions */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === session.id ? null : session.id);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded transition-all duration-200"
                      >
                        <MoreVertical className="w-3 h-3 text-[#31110F]/60" />
                      </motion.button>

                      <AnimatePresence>
                        {dropdownOpen === session.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-6 z-20 backdrop-blur-[30px] bg-white/90 border border-white/30 rounded-lg shadow-lg py-1 min-w-[120px]"
                          >
                            <button
                              onClick={(e) => startEditingTitle(session, e)}
                              className="w-full px-2.5 py-1.5 text-left text-xs text-[#31110F] hover:bg-white/50 flex items-center gap-1.5"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              Rename
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="w-full px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-red-50/50 flex items-center gap-1.5"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setDropdownOpen(null)}
        />
      )}
    </div>
  );
};

export default SessionList;