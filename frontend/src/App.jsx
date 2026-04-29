import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { Menu, X } from 'lucide-react'
import ChatPage from './pages/ChatPage'
import Sidebar from './components/Sidebar'
import { SessionProvider } from './hooks/useSession'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 relative">
        {/* Background effects — vert clair subtil */}
        <div className="mesh-bg" />
        <div className="grid-overlay" />

        {/* Mobile overlay backdrop */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-20 sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Sidebar — desktop: inline, mobile: fixed drawer */}
        <aside
          className={`${
            isMobile
              ? 'fixed inset-y-0 left-0 z-30 sidebar-drawer'
              : 'relative flex-shrink-0 transition-all duration-300 ease-out'
          } ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}`}
        >
          <Sidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
          />
        </aside>

        {/* Mobile hamburger button */}
        {isMobile && !sidebarOpen && (
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-20 w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-sm shadow-card border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:shadow-emerald transition-all touch-target"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={22} />
          </motion.button>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 relative z-10">
          <ChatPage sidebarOpen={sidebarOpen} isMobile={isMobile} />
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #d1fae5',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              borderRadius: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </SessionProvider>
  )
}

