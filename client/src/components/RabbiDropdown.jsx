import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Search,
  User,
  Book,
  Calendar,
  Sparkles,
  Heart,
  Brain,
  CheckCircle,
  Star
} from 'lucide-react';
import useChatStore from '../store/chatStore';

// Import rabbi images
import rashiImage from '../assets/images/rashi.png';
import rambamImage from '../assets/images/rambam.png';
import caroImage from '../assets/images/caro.png';
import beshtImage from '../assets/images/besht.png';

// Rabbi image mapping
const RABBI_IMAGES = {
  'rashi': rashiImage,
  'rambam': rambamImage,
  'rabbi-yosef-caro': caroImage,
  'baal-shem-tov': beshtImage,
  'rabbi-soloveitchik': null,
  'arizal': null
};

// Rabbi icon and gradient mapping
const RABBI_UI_CONFIG = {
  'rashi': { icon: Book, gradient: 'from-blue-400 to-blue-600' },
  'rambam': { icon: Brain, gradient: 'from-purple-400 to-purple-600' },
  'rabbi-yosef-caro': { icon: CheckCircle, gradient: 'from-green-400 to-green-600' },
  'baal-shem-tov': { icon: Heart, gradient: 'from-amber-400 to-amber-600' },
  'rabbi-soloveitchik': { icon: Star, gradient: 'from-indigo-400 to-indigo-600' },
  'arizal': { icon: Sparkles, gradient: 'from-violet-400 to-violet-600' }
};

// Helper function to enhance rabbi data with UI properties
const enhanceRabbiData = (rabbi) => {
  const uiConfig = RABBI_UI_CONFIG[rabbi.id] || { icon: User, gradient: 'from-gray-400 to-gray-600' };
  return {
    ...rabbi,
    image: RABBI_IMAGES[rabbi.id] || null,
    icon: uiConfig.icon,
    gradient: uiConfig.gradient,
    // Map backend fields to frontend expected fields
    fullName: rabbi.displayName || rabbi.name,
    longDescription: rabbi.description,
    specialty: rabbi.specialties?.[0] || 'Torah Scholar',
    expertise: rabbi.specialties || []
  };
};

const RabbiDropdown = ({
  selectedRabbi = null,
  onSelect,
  placeholder = "Choose a rabbi to learn with...",
  className = "",
  disabled = false,
  showSearch = true,
  showDetails = true,
  size = "default" // "compact", "default", "large"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Get rabbis from chatStore
  const { rabbis: storeRabbis } = useChatStore();

  // Enhance rabbi data with UI properties (memoized to prevent render loop)
  const rabbis = useMemo(() => storeRabbis.map(enhanceRabbiData), [storeRabbis]);

  // Filter rabbis based on search query
  const [filteredRabbis, setFilteredRabbis] = useState(rabbis);

  // Update filtered rabbis when rabbis or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRabbis(rabbis);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = rabbis.filter(rabbi =>
      rabbi.name?.toLowerCase().includes(query) ||
      rabbi.fullName?.toLowerCase().includes(query) ||
      rabbi.specialty?.toLowerCase().includes(query) ||
      rabbi.era?.toLowerCase().includes(query) ||
      rabbi.expertise?.some(exp => exp.toLowerCase().includes(query))
    );
    setFilteredRabbis(filtered);
    setHighlightedIndex(-1);
  }, [searchQuery, rabbis]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredRabbis.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredRabbis.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredRabbis[highlightedIndex]) {
            handleSelectRabbi(filteredRabbis[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredRabbis]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, showSearch]);

  const handleSelectRabbi = (rabbi) => {
    onSelect?.(rabbi.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedRabbiData = rabbis.find(r => r.id === selectedRabbi);


  const getSizeClasses = () => {
    switch (size) {
      case 'compact':
        return {
          button: 'py-2 px-3 text-sm',
          dropdown: 'mt-1',
          item: 'px-3 py-2 text-sm'
        };
      case 'large':
        return {
          button: 'py-4 px-4 text-lg',
          dropdown: 'mt-2',
          item: 'px-4 py-4 text-base'
        };
      default:
        return {
          button: 'py-3 px-4 text-base',
          dropdown: 'mt-2',
          item: 'px-4 py-3 text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.02
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className={`
          w-full bg-white border border-gray-300 rounded-xl shadow-sm
          ${sizeClasses.button}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'}
          ${isOpen ? 'border-primary-400 ring-2 ring-primary-500' : ''}
          transition-all duration-200 flex items-center justify-between
        `}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          {selectedRabbiData ? (
            <>
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {selectedRabbiData.image ? (
                  <>
                    <img
                      src={selectedRabbiData.image}
                      alt={selectedRabbiData.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className={`
                      w-full h-full bg-gradient-to-br ${selectedRabbiData.gradient}
                      flex items-center justify-center text-white hidden
                    `}>
                      <selectedRabbiData.icon className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  <div className={`
                    w-full h-full bg-gradient-to-br ${selectedRabbiData.gradient}
                    flex items-center justify-center text-white
                  `}>
                    <selectedRabbiData.icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {selectedRabbiData.name}
                </div>
                {showDetails && size !== 'compact' && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedRabbiData.specialty}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-gray-500 flex-1 truncate">{placeholder}</span>
            </>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg
              ${sizeClasses.dropdown} max-h-96 overflow-hidden top-full mt-2
            `}
          >
            {/* Search Input */}
            {showSearch && (
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rabbis..."
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Rabbis List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {filteredRabbis.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No rabbis found</p>
                </div>
              ) : (
                <motion.div className="py-2">
                  {filteredRabbis.map((rabbi, index) => (
                    <motion.button
                      key={rabbi.id}
                      variants={itemVariants}
                      onClick={() => handleSelectRabbi(rabbi)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`
                        w-full text-left transition-colors duration-150
                        ${sizeClasses.item}
                        ${index === highlightedIndex || selectedRabbi === rabbi.id
                          ? 'bg-primary-50 text-primary-900'
                          : 'hover:bg-gray-50'
                        }
                        ${selectedRabbi === rabbi.id ? 'bg-primary-100' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Rabbi Avatar */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                          {rabbi.image ? (
                            <>
                              <img
                                src={rabbi.image}
                                alt={rabbi.fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                }}
                              />
                              <div className={`
                                absolute inset-0 bg-gradient-to-br ${rabbi.gradient}
                                flex items-center justify-center text-white fallback-icon hidden
                              `}>
                                <rabbi.icon className="w-5 h-5" />
                              </div>
                            </>
                          ) : (
                            <div className={`
                              absolute inset-0 bg-gradient-to-br ${rabbi.gradient}
                              flex items-center justify-center text-white
                            `}>
                              <rabbi.icon className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Rabbi Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {rabbi.name}
                            </h4>
                            {selectedRabbi === rabbi.id && (
                              <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            )}
                          </div>

                          {showDetails && (
                            <>
                              <p className="text-xs text-gray-600 mb-1">
                                {rabbi.era} • {rabbi.specialty}
                              </p>
                              {size !== 'compact' && (
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {rabbi.description}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Hook for rabbi data access
export const useRabbis = () => {
  const { rabbis: storeRabbis } = useChatStore();
  const enhancedRabbis = useMemo(() => storeRabbis.map(enhanceRabbiData), [storeRabbis]);

  return {
    rabbis: enhancedRabbis,
    getRabbiById: (id) => enhancedRabbis.find(r => r.id === id),
    getRabbiByName: (name) => enhancedRabbis.find(r => r.name === name || r.fullName === name || r.displayName === name)
  };
};

export default React.memo(RabbiDropdown);