import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const GlobalNetworkLoader = () => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let hideTimer = null

    const handleLoading = (event) => {
      const loading = Boolean(event.detail?.loading)
      if (loading) {
        if (hideTimer) clearTimeout(hideTimer)
        setIsLoading(true)
      } else {
        // Small debounce to avoid flashing on rapid queries
        hideTimer = setTimeout(() => {
          setIsLoading(false)
        }, 150)
      }
    }

    window.addEventListener('recruitsense-api-loading', handleLoading)
    return () => {
      window.removeEventListener('recruitsense-api-loading', handleLoading)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [])

  return (
    <>
      {/* Top Animated Gradient Progress Bar */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 h-1 z-[9999] origin-left bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm shadow-indigo-500/50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Network Activity Badge */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-[9998] flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-indigo-100/80 shadow-lg shadow-indigo-500/10 text-xs font-semibold text-indigo-700 pointer-events-none"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Loading...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default GlobalNetworkLoader
