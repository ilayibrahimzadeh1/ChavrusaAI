import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Star, Edit, Save, X, Shield } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const UserProfile = ({ isCompact = false, showActions = true }) => {
  const {
    user,
    profile,
    loading,
    error,
    signOut,
    updateProfile,
    fetchProfile,
    isAuthenticated
  } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    preferredRabbi: ''
  })

  useEffect(() => {
    if (user && !profile) {
      fetchProfile()
    }
  }, [user, profile, fetchProfile])

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.display_name || '',
        preferredRabbi: profile.preferred_rabbi || ''
      })
    }
  }, [profile])

  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        toast.success('Signed out successfully')
      } else {
        toast.error('Failed to sign out')
      }
    } catch (error) {
      toast.error('An error occurred while signing out')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()

    try {
      const result = await updateProfile({
        display_name: formData.displayName,
        preferred_rabbi: formData.preferredRabbi
      })

      if (result.success) {
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('An error occurred while updating profile')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset form to current profile values
    setFormData({
      displayName: profile?.display_name || '',
      preferredRabbi: profile?.preferred_rabbi || ''
    })
  }

  const formatJoinDate = (date) => {
    if (!date) return 'Recently'
    const joinDate = new Date(date)
    return joinDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const rabbiOptions = [
    { value: 'Rashi', label: 'Rashi' },
    { value: 'Rambam', label: 'Rambam' },
    { value: 'Rabbi Yosef Caro', label: 'Rabbi Yosef Caro' },
    { value: 'Baal Shem Tov', label: 'Baal Shem Tov' },
    { value: 'Rabbi Soloveitchik', label: 'Rabbi Soloveitchik' },
    { value: 'Arizal', label: 'Arizal' }
  ]

  if (!isAuthenticated()) {
    return null
  }

  if (isCompact) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
            {(profile?.display_name || user?.email)?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-[#31110F]">
              {profile?.display_name || 'Welcome!'}
            </h3>
            <p className="text-sm text-[#31110F]/70">{user?.email}</p>
          </div>
        </div>

        {profile?.preferred_rabbi && (
          <div className="flex items-center gap-2 text-sm text-[#31110F]/80">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Preferred Rabbi: {profile.preferred_rabbi}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-[#31110F]/10 p-6 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          {(profile?.display_name || user?.email)?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#31110F]">
            {profile?.display_name || 'User Profile'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-[#31110F]/70">
            <Mail className="w-4 h-4" />
            {user?.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#31110F]/60 mt-1">
            <Calendar className="w-4 h-4" />
            Member since {formatJoinDate(user?.created_at)}
          </div>
        </div>
      </div>

      {/* Verification Badge */}
      {user?.email_confirmed_at && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Email Verified</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm mb-4"
        >
          {error}
        </motion.div>
      )}

      {/* Profile Content */}
      {isEditing ? (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSaveProfile}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[#31110F] mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              placeholder="Your preferred name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#31110F] mb-2">
              Preferred Rabbi
            </label>
            <select
              name="preferredRabbi"
              value={formData.preferredRabbi}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#31110F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            >
              <option value="">Choose a rabbi...</option>
              {rabbiOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleCancelEdit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </motion.button>
          </div>
        </motion.form>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-3">Profile Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-amber-700">Display Name:</span>
                <span className="font-medium text-amber-800">
                  {profile?.display_name || 'Not set'}
                </span>
              </div>
              {profile?.preferred_rabbi && (
                <div className="flex justify-between items-center">
                  <span className="text-amber-700">Preferred Rabbi:</span>
                  <span className="font-medium text-amber-800 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {profile.preferred_rabbi}
                  </span>
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <div className="space-y-3">
              <motion.button
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </motion.button>

              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Sign Out
              </motion.button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default UserProfile