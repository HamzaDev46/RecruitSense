import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Shield, Sparkles, Activity,
  Globe, LogOut, Settings, ChevronDown
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'

const AdminTopBar = ({ onSearch }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Left: Quick System Status & Title */}
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/80 text-xs font-semibold text-emerald-700 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          System Operational
        </motion.div>
        <span className="hidden md:inline-block text-xs font-medium text-gray-300">|</span>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <span>RecruitSense Core v2.4</span>
        </div>
      </div>

      {/* Center/Right: Actions */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        {/* Broadcast Quick Action */}
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/admin/broadcast')}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 text-xs font-bold border border-indigo-100 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          Broadcast
        </motion.button>

        {/* Live Activity Quick Link */}
        <motion.button
          whileHover={{ scale: 1.06, rotate: 6 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/admin/activity')}
          title="Activity Audit"
          className="w-9 h-9 rounded-xl border border-gray-200/80 hover:border-indigo-300 hover:bg-indigo-50/60 text-gray-600 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm"
        >
          <Activity className="w-4 h-4" />
        </motion.button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-gray-100/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20 ring-1 ring-white/50">
              <Shield className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[120px]">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Super Admin</p>
            </div>
            <motion.div
              animate={{ rotate: profileOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/80 py-1.5 z-50 ring-1 ring-black/5"
              >
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Admin'}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email || 'admin@recruitsense.com'}</p>
                </div>

                <div className="p-1 space-y-0.5">
                  <motion.button
                    whileHover={{ x: 3, backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/admin/settings')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 rounded-xl transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                    Platform Settings
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 3, backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/admin/broadcast')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 rounded-xl transition-colors text-left"
                  >
                    <Bell className="w-3.5 h-3.5 text-gray-400" />
                    Send Announcement
                  </motion.button>
                </div>

                <div className="p-1 border-t border-gray-100">
                  <motion.button
                    whileHover={{ x: 3, backgroundColor: 'rgba(254, 242, 242, 1)' }}
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default AdminTopBar
