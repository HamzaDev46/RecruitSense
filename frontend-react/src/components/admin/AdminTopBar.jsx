import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, Shield, Sparkles, Activity,
  Globe, LogOut, Settings, CheckCircle2, ChevronDown
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'

const AdminTopBar = ({ onSearch }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    if (onSearch) onSearch(e.target.value)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Left: Quick System Status & Title */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational
        </div>
        <span className="hidden md:inline-block text-xs font-medium text-gray-400">|</span>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <span>RecruitSense Core v2.4</span>
        </div>
      </div>

      {/* Center/Right: Actions */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        {/* Broadcast Quick Action */}
        <button
          onClick={() => navigate('/admin/broadcast')}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-100 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Broadcast
        </button>

        {/* Live Activity Quick Link */}
        <button
          onClick={() => navigate('/admin/activity')}
          title="Activity Audit"
          className="w-9 h-9 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-600 hover:text-indigo-600 flex items-center justify-center transition-all"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[120px]">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Super Admin</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email || 'admin@recruitsense.com'}</p>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/admin/settings')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                  Platform Settings
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/admin/broadcast')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-gray-400" />
                  Send Announcement
                </button>
              </div>

              <div className="p-1 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminTopBar
