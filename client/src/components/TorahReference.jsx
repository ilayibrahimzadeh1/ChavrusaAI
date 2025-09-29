import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  Search,
  ExternalLink,
  Languages,
  Calendar,
  Scroll
} from 'lucide-react';
import {
  useSefariaText,
  useSefariaCommentaries,
  useSefariaRelated,
  useSefariaLexicon
} from '../services/sefariaService';

const TorahReference = ({
  reference,
  showCommentaries = true,
  showRelated = true,
  autoExpand = false,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [activeTab, setActiveTab] = useState('text');
  const [selectedWord, setSelectedWord] = useState(null);

  const { text, loading: textLoading, error: textError } = useSefariaText(reference);
  const { commentaries, loading: commentariesLoading } = useSefariaCommentaries(
    showCommentaries && text ? text.book : null
  );
  const { related, loading: relatedLoading } = useSefariaRelated(
    showRelated && reference ? reference : null
  );
  const { definition, lookup } = useSefariaLexicon(selectedWord);

  if (!reference) return null;

  const handleWordClick = (word) => {
    const cleanWord = word.replace(/[^\u0590-\u05FF\u0041-\u005A\u0061-\u007A]/g, '');
    if (cleanWord.length > 1) {
      setSelectedWord(cleanWord);
      lookup(cleanWord);
    }
  };

  const renderText = (textContent) => {
    if (!textContent) return null;

    const isHebrew = /[\u0590-\u05FF]/.test(textContent);

    return (
      <div
        className={`text-lg leading-relaxed ${isHebrew ? 'text-right font-hebrew' : 'text-left'}`}
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {textContent.split(' ').map((word, index) => (
          <span
            key={index}
            className="cursor-pointer hover:bg-primary-100 rounded px-1 transition-colors"
            onClick={() => handleWordClick(word)}
          >
            {word}{' '}
          </span>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{reference}</h3>
            {text?.heRef && (
              <p className="text-sm text-gray-600 font-hebrew" dir="rtl">
                {text.heRef}
              </p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'text'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Scroll className="w-4 h-4" />
                    Text
                  </div>
                </button>
                {showCommentaries && (
                  <button
                    onClick={() => setActiveTab('commentaries')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'commentaries'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Commentaries ({commentaries?.length || 0})
                    </div>
                  </button>
                )}
                {showRelated && (
                  <button
                    onClick={() => setActiveTab('related')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'related'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Related
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Text Tab */}
              {activeTab === 'text' && (
                <div>
                  {textLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : textError ? (
                    <div className="text-center py-8 text-red-600">
                      Error loading text: {textError}
                    </div>
                  ) : text ? (
                    <div className="space-y-4">
                      {/* Hebrew Text */}
                      {text.he && (
                        <div className="border-b border-gray-100 pb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Hebrew</h4>
                          {renderText(text.he)}
                        </div>
                      )}

                      {/* English Text */}
                      {text.text && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Translation</h4>
                          {renderText(text.text)}
                        </div>
                      )}

                      {/* Source Info */}
                      {text.versionTitle && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">
                            Source: {text.versionTitle}
                            {text.versionSource && (
                              <span className="ml-2">({text.versionSource})</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No text found for this reference
                    </div>
                  )}
                </div>
              )}

              {/* Commentaries Tab */}
              {activeTab === 'commentaries' && (
                <div>
                  {commentariesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : commentaries?.length > 0 ? (
                    <div className="space-y-4">
                      {commentaries.map((commentary, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {commentary.commentator || commentary.title}
                          </h4>
                          <div className="text-sm text-gray-700">
                            {commentary.text || commentary.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No commentaries available for this text
                    </div>
                  )}
                </div>
              )}

              {/* Related Tab */}
              {activeTab === 'related' && (
                <div>
                  {relatedLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : related ? (
                    <div className="space-y-4">
                      {related.links?.map((link, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {link.ref}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {link.category} • {link.type}
                          </p>
                          {link.text && (
                            <div className="text-sm text-gray-700">
                              {link.text.substring(0, 200)}...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No related content found
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word Definition Popup */}
      <AnimatePresence>
        {selectedWord && definition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{selectedWord}</h4>
              <button
                onClick={() => setSelectedWord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-700">
              {definition.definition || definition.meaning || 'Definition not found'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TorahReference;