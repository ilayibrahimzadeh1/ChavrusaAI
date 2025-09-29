import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Mail,
  Calendar,
  Star,
  Edit,
  Check,
  X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    preferredRabbi: ''
  });

  const dropdownRef = useRef(null);
  const {
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    fetchProfile
  } = useAuthStore();

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.display_name || '',
        preferredRabbi: profile.preferred_rabbi || ''
      });
    }
  }, [profile]);

  // Fetch profile if we have user but no profile
  useEffect(() => {
    if (user && !profile) {
      fetchProfile();
    }
  }, [user, profile, fetchProfile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast.success('Signed out successfully');
        setIsOpen(false);
      } else {
        toast.error('Failed to sign out');
      }
    } catch (error) {
      toast.error('An error occurred while signing out');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile({
        display_name: editForm.displayName,
        preferred_rabbi: editForm.preferredRabbi
      });

      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current profile values
    setEditForm({
      displayName: profile?.display_name || '',
      preferredRabbi: profile?.preferred_rabbi || ''
    });
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Recently';
    const joinDate = new Date(date);
    return joinDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const rabbiOptions = [
    { value: 'Rashi', label: 'Rashi' },
    { value: 'Rambam', label: 'Rambam' },
    { value: 'Rabbi Yosef Caro', label: 'Rabbi Yosef Caro' },
    { value: 'Baal Shem Tov', label: 'Baal Shem Tov' },
    { value: 'Rabbi Soloveitchik', label: 'Rabbi Soloveitchik' },
    { value: 'Arizal', label: 'Arizal' }
  ];

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg px-3 py-2 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <div className="w-7 h-7 bg-white/20 rounded-md flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>

        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium leading-tight">
            {profile?.display_name || user.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-xs opacity-80 leading-tight">
            {user.email}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-[#31110F]/10 z-50 overflow-hidden"
          >
            {/* User Info Header */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-[#31110F]/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                  {(profile?.display_name || user.email)?.[0]?.toUpperCase() || 'U'}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-[#31110F]">
                    {profile?.display_name || 'Welcome!'}
                  </h3>
                  <p className="text-sm text-[#31110F]/70">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[#31110F]/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Member since {formatJoinDate(user.created_at)}
                    </span>
                    {user.email_confirmed_at && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="p-4 border-b border-[#31110F]/10">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#31110F]/70 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      placeholder="Your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#31110F]/70 mb-1">
                      Preferred Rabbi
                    </label>
                    <select
                      value={editForm.preferredRabbi}
                      onChange={(e) => setEditForm(prev => ({ ...prev, preferredRabbi: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="">Choose a rabbi...</option>
                      {rabbiOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex-1 bg-amber-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-[#31110F]">Profile Information</h4>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#31110F]/70">Display Name:</span>
                      <span className="text-[#31110F] font-medium">
                        {profile?.display_name || 'Not set'}
                      </span>
                    </div>

                    {profile?.preferred_rabbi && (
                      <div className="flex justify-between">
                        <span className="text-[#31110F]/70">Preferred Rabbi:</span>
                        <span className="text-[#31110F] font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {profile.preferred_rabbi}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  // Add settings functionality here
                  toast('Settings coming soon!', { icon: '⚙️' });
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#31110F] hover:bg-amber-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings & Preferences
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;