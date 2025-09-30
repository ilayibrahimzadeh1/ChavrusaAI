import React from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  BookOpen,
  User,
  Wifi,
  WifiOff,
  Settings,
  ChevronDown
} from 'lucide-react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import RabbiDropdown from './RabbiDropdown';
import ProfileDropdown from './ProfileDropdown';
import { CompactTranslationButton } from './TranslationButton';

const Header = ({ onMenuClick }) => {
  const { currentRabbi, connectionStatus, selectRabbi, selectedRabbiId } = useChatStore();
  const { user } = useAuthStore();

  return (
    <header className="px-4 md:px-6 py-4">
      <div className="flex items-center backdrop-blur-[30px] bg-white/25 rounded-2xl shadow-xl px-3 md:px-6 py-3 border border-white/20">
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-[#31110F]/80 hover:text-[#31110F] hover:bg-white/20 transition-colors shrink-0"
            aria-label="Open navigation menu"
            type="button"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Interactive Rabbi Selector */}
          <div className="flex-1 min-w-0 max-w-[200px] md:max-w-xs">
            <RabbiDropdown
              selectedRabbi={selectedRabbiId}
              onSelect={selectRabbi}
              placeholder={selectedRabbiId ? undefined : "Select a rabbi..."}
              className="w-full"
              size="compact"
            />
          </div>
        </div>

        {/* Center - ChavrusaAI Title (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center">
          <h1 className="font-medium text-[#31110F] text-lg tracking-[-0.02em]">
            ChavrusaAI
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Connection Status - Simplified */}
          <div className={`flex items-center gap-1.5 transition-all duration-300 ${
            connectionStatus === 'connected'
              ? 'text-[#31110F]/60'
              : connectionStatus === 'disconnected'
              ? 'text-red-500 animate-pulse'
              : 'text-amber-500'
          }`}>
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4" />
            ) : connectionStatus === 'disconnected' ? (
              <WifiOff className="w-4 h-4" />
            ) : (
              <Wifi className="w-4 h-4 animate-pulse" />
            )}
          </div>

          {/* Translation Button */}
          <CompactTranslationButton />

          {/* Interactive Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;