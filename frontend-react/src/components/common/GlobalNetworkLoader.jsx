import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const GlobalNetworkLoader = () => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let showTimer = null
    let hideTimer = null

    const handleLoading = (event) => {
      const loading = Boolean(event.detail?.loading)
      if (loading) {
        if (hideTimer) clearTimeout(hideTimer)
        // Debounce before showing to avoid micro-flashing on ultra-fast sub-200ms requests
        if (!showTimer && !isLoading) {
          showTimer = setTimeout(() => {
            setIsLoading(true)
            showTimer = null
          }, 200)
        }
      } else {
        if (showTimer) {
          clearTimeout(showTimer)
          showTimer = null
        }
        // Graceful exit debounce
        hideTimer = setTimeout(() => {
          setIsLoading(false)
        }, 180)
      }
    }

    window.addEventListener('recruitsense-api-loading', handleLoading)
    return () => {
      window.removeEventListener('recruitsense-api-loading', handleLoading)
      if (showTimer) clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [isLoading])

  return (
    <>
      {/* Sleek Top Micro Progress Bar (like GitHub / YouTube / Vercel) - Zero Obtrusive Popups */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] origin-left bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm shadow-indigo-500/40 pointer-events-none"
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default GlobalNetworkLoader
