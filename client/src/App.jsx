import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Loader2, BookOpen, Sparkles, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import AuthProvider from './components/AuthProvider';
import LandingPage from './components/LandingPage';
import AuthGate from './components/AuthGate';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';
import SkeletonLoader from './components/SkeletonLoader';
import useChatStore from './store/chatStore';
import useAuthStore from './store/authStore';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const { initializeApp, connectionStatus, isLoading, currentRabbi, loadUserSessions } = useChatStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Set up connection monitoring
    const handleOnline = () => useChatStore.setState({ connectionStatus: 'connected' });
    const handleOffline = () => useChatStore.setState({ connectionStatus: 'disconnected' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial connection status
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    // Initialize app immediately - persist rehydration will trigger actual initialization
    console.log('🕐 Starting app initialization...');
    initializeApp();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeApp]);

  // Load sessions when user becomes authenticated
  useEffect(() => {
    console.log('🔍 Auth effect triggered:', {
      isAuth: isAuthenticated(),
      hasUser: !!user,
      userId: user?.id
    });
    if (isAuthenticated() && user) {
      console.log('📡 Calling loadUserSessions...');
      loadUserSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Navigation handlers
  const handleStartLearning = () => {
    setShowAuthGate(true);
  };

  const handleBackToLanding = () => {
    setShowAuthGate(false);
  };

  // Enhanced Loading Screen Component
  const LoadingScreen = () => {
    const [loadingStage, setLoadingStage] = useState(0);

    const loadingStages = [
      { text: "Initializing ChavrusaAI...", icon: BookOpen },
      { text: "Connecting to Torah database...", icon: Wifi },
      { text: "Preparing rabbi wisdom...", icon: Sparkles },
      { text: "Almost ready...", icon: BookOpen }
    ];

    useEffect(() => {
      const intervals = [800, 1200, 1000, 500];
      let timeout;

      const nextStage = (stage) => {
        if (stage < loadingStages.length - 1) {
          timeout = setTimeout(() => {
            setLoadingStage(stage + 1);
            nextStage(stage + 1);
          }, intervals[stage]);
        }
      };

      nextStage(0);

      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }, []);

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 max-w-md"
        >
          {/* Animated App Logo */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
          >
            <BookOpen className="w-10 h-10 text-white" />
          </motion.div>

          {/* Progressive Loading Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="flex items-center mb-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {React.createElement(loadingStages[loadingStage].icon, {
                      className: "w-6 h-6 text-blue-600 mr-3"
                    })}
                  </motion.div>
                  <span className="text-lg font-medium text-gray-800" style={{ fontFamily: 'system-ui' }} dir="rtl">
                    {loadingStages[loadingStage].text}
                  </span>
                </div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-500 italic"
                >
                  {loadingStages[loadingStage].subtext}
                </motion.span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar with Hebrew styling */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden border border-gray-300">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full relative"
              initial={{ width: "0%" }}
              animate={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{
                  x: ["-100%", "100%"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)"
                }}
              />
            </motion.div>
          </div>

          {/* Loading Features Preview */}
          <div className="space-y-3">
            <SkeletonLoader variant="text" lines={2} className="max-w-xs mx-auto" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-gray-500 space-y-1"
            >
              <div className="flex items-center justify-center gap-2">
                <span>✓</span>
                <span>למידת תורה מונעת AI</span>
                <span className="text-gray-400">•</span>
                <span className="italic">AI-powered Torah learning</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>✓</span>
                <span>אישיויות רבים מרובות</span>
                <span className="text-gray-400">•</span>
                <span className="italic">Multiple rabbi personalities</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>✓</span>
                <span>אינטגרציה עם ספריא</span>
                <span className="text-gray-400">•</span>
                <span className="italic">Sefaria integration</span>
              </div>
            </motion.div>
          </div>

          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400"
          >
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span>
              {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
            </span>
          </motion.div>
        </motion.div>
      </div>
    );
  };

  // Toast configuration
  const toastOptions = {
    duration: 3000,
    style: {
      background: '#fff',
      color: '#363636',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '14px'
    },
    success: {
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff'
      }
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff'
      }
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* Toast Notifications */}
        <Toaster position="top-right" toastOptions={toastOptions} />

        {isLoading ? (
          <LoadingScreen />
        ) : !isAuthenticated() ? (
          // Unauthenticated users see Landing → Auth flow
          showAuthGate ? (
            <AuthGate onBack={handleBackToLanding} />
          ) : (
            <LandingPage onStartLearning={handleStartLearning} />
          )
        ) : (
          // Authenticated users see Chat Interface with Landing Page styling
          <div className="flex h-screen overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 relative">
            {/* Background overlay for glass effect */}
            <div className="absolute inset-0 bg-white/20" style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)'
            }} />

            {/* Sidebar */}
            <div className="hidden lg:block relative z-10">
              <Sidebar
                isOpen={true}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden relative z-10">
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={false}
                onToggleCollapse={() => {}}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
              <Header onMenuClick={() => setSidebarOpen(true)} />
              <ChatArea />
              <ChatInput />
            </div>
          </div>
        )}
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;