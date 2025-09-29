import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Book,
  Brain,
  Heart,
  CheckCircle,
  Star,
  Sparkles,
  Scroll,
  Crown,
  Mountain,
  ChevronDown
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
  'arizal': null,
  'rabbi-jonathan-sacks': null,
  'lubavitcher-rebbe': null,
  'rav-kook': null
};

// Rabbi icon and gradient mapping
const RABBI_UI_CONFIG = {
  'rashi': { icon: Book, gradient: 'from-blue-400 to-blue-600' },
  'rambam': { icon: Brain, gradient: 'from-purple-400 to-purple-600' },
  'rabbi-yosef-caro': { icon: CheckCircle, gradient: 'from-green-400 to-green-600' },
  'baal-shem-tov': { icon: Heart, gradient: 'from-amber-400 to-amber-600' },
  'rabbi-soloveitchik': { icon: Star, gradient: 'from-indigo-400 to-indigo-600' },
  'arizal': { icon: Sparkles, gradient: 'from-violet-400 to-violet-600' },
  'rabbi-jonathan-sacks': { icon: Scroll, gradient: 'from-emerald-400 to-emerald-600' },
  'lubavitcher-rebbe': { icon: Crown, gradient: 'from-rose-400 to-rose-600' },
  'rav-kook': { icon: Mountain, gradient: 'from-teal-400 to-teal-600' }
};


// Helper function to enhance rabbi data with UI properties
const enhanceRabbiData = (rabbi) => {
  const uiConfig = RABBI_UI_CONFIG[rabbi.id] || { icon: User, gradient: 'from-gray-400 to-gray-600' };
  return {
    ...rabbi,
    image: RABBI_IMAGES[rabbi.id] || null,
    icon: uiConfig.icon,
    gradient: uiConfig.gradient,
    fullName: rabbi.displayName || rabbi.name,
    longDescription: rabbi.description,
    specialty: rabbi.specialties?.[0] || 'Torah Scholar',
    expertise: rabbi.specialties || []
  };
};

const RabbiGrid = ({ selectedRabbi = null, onSelect, className = "", placeholder = "Select a rabbi..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get rabbis from chatStore
  const { rabbis: storeRabbis } = useChatStore();

  // Use backend rabbis directly (memoized to prevent render loop)
  const rabbis = useMemo(() => storeRabbis.map(enhanceRabbiData), [storeRabbis]);

  // Find selected rabbi data
  const selectedRabbiData = rabbis.find(r => r.id === selectedRabbi);

  const handleSelectRabbi = (rabbi) => {
    onSelect?.(rabbi.id);
    setIsOpen(false);
  };

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

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.03
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
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full backdrop-blur-[20px] bg-white/30 border border-white/40 hover:bg-white/40 hover:border-white/60 rounded-xl p-3 transition-all duration-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          {selectedRabbiData ? (
            <>
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                {selectedRabbiData.image ? (
                  <>
                    <img
                      src={selectedRabbiData.image}
                      alt={selectedRabbiData.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                      }}
                    />
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${selectedRabbiData.gradient}
                      flex items-center justify-center text-white fallback-icon hidden
                    `}>
                      <selectedRabbiData.icon className="w-4 h-4" />
                    </div>
                  </>
                ) : (
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${selectedRabbiData.gradient}
                    flex items-center justify-center text-white
                  `}>
                    <selectedRabbiData.icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#31110F] text-sm truncate">
                  {selectedRabbiData.name}
                </div>
                <div className="text-xs text-[#31110F]/60 truncate">
                  {selectedRabbiData.era}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-[#31110F]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#31110F]/60" />
              </div>
              <span className="text-[#31110F]/60 flex-1 truncate text-sm">{placeholder}</span>
            </>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-[#31110F]/60" />
        </motion.div>
      </motion.button>

      {/* 3x3 Grid Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-50 w-full mt-2 backdrop-blur-[30px] bg-white/90 border border-white/40 rounded-xl shadow-lg"
          >
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 min-h-[240px]">
                {rabbis.map((rabbi) => (
                  <motion.button
                    key={rabbi.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectRabbi(rabbi)}
                    className={`
                      h-20 w-full p-2 rounded-lg transition-all duration-200 relative flex flex-col items-center justify-center
                      ${selectedRabbi === rabbi.id
                        ? 'bg-[#31110F]/20 border-2 border-[#31110F]/40'
                        : 'bg-white/40 border border-white/60 hover:bg-white/60'
                      }
                    `}
                  >
                    {/* Selected indicator */}
                    {selectedRabbi === rabbi.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-2 h-2 bg-[#31110F] rounded-full"
                      />
                    )}

                    {/* Rabbi Avatar */}
                    <div className="w-8 h-8 mb-1 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
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
                            <rabbi.icon className="w-4 h-4" />
                          </div>
                        </>
                      ) : (
                        <div className={`
                          absolute inset-0 bg-gradient-to-br ${rabbi.gradient}
                          flex items-center justify-center text-white
                        `}>
                          <rabbi.icon className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Rabbi Info */}
                    <div className="text-center flex-1 flex items-center justify-center">
                      <h3 className={`text-xs font-medium leading-tight ${
                        selectedRabbi === rabbi.id ? 'text-[#31110F]' : 'text-[#31110F]/80'
                      }`}>
                        {rabbi.name.length > 12 ? rabbi.name.substring(0, 10) + '...' : rabbi.name}
                      </h3>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(RabbiGrid);