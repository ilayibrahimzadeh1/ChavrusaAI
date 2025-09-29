import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

const AuthProvider = ({ children }) => {
  const { initialize, initialized, loading } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialize, initialized])

  // Show loading spinner while initializing auth
  if (!initialized && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return children
}

export default AuthProvider