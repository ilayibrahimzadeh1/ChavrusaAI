import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import useChatStore from '../store/chatStore';
import tjcommunityLogo from '../assets/tjcommunity.png';

const WelcomeScreen = () => {
  const { currentRabbi, selectedRabbiId } = useChatStore();

  const handleStartLearning = () => {
    // Rabbi is already selected via global state, just proceed
    console.log('Starting learning with:', selectedRabbiId);
  };


  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with TJ Community Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <img
              src={tjcommunityLogo}
              alt="TJ Community"
              className="w-36 h-36 rounded-2xl shadow-lg"
            />
          </div>

          <h1 className="text-3xl font-bold text-[#31110F] mb-2">
            ChavrusaAI
          </h1>
          <p className="text-[#31110F]/70 text-sm leading-relaxed">
            Your AI-powered Torah learning companion
          </p>
        </motion.div>

        {/* Start Learning Section */}
        {selectedRabbiId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <p className="text-[#31110F]/70 text-sm mb-4">
              Start learning with ChavrusaAI
            </p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartLearning}
              className="w-full bg-[#31110F] hover:bg-[#31110F]/90 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <Users className="w-4 h-4" />
              Start Learning
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* Simple Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-xs text-[#31110F]/50">
            Choose from 9 renowned Torah scholars
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeScreen;