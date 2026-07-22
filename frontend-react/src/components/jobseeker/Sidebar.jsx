import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Bell, BellRing, Bookmark, Brain, LayoutDashboard, Briefcase, FileText, ClipboardList, LogOut, MessageCircle, Newspaper, Settings, Sparkles, User, Users } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import toast from 'react-hot-toast'
import api from '../../services/api'

const navItems = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Newspaper className="w-5 h-5" />, label: 'Feed', path: '/feed' },
  { icon: <Users className="w-5 h-5" />, label: 'My Network', path: '/network', badgeKey: 'pending_invitations_count' },
  { icon: <Bell className="w-5 h-5" />, label: 'Notifications', path: '/notifications', badgeKey: 'unread_notifications_count' },
  { icon: <MessageCircle className="w-5 h-5" />, label: 'Messages', path: '/messages', badgeKey: 'unread_messages_count' },
  { icon: <Briefcase className="w-5 h-5" />, label: 'Browse Jobs', path: '/jobs' },
  { icon: <Sparkles className="w-5 h-5" />, label: 'Recommended', path: '/recommended-jobs' },
  { icon: <BellRing className="w-5 h-5" />, label: 'Job Alerts', path: '/job-alerts' },
  { icon: <Bookmark className="w-5 h-5" />, label: 'Saved Jobs', path: '/saved-jobs' },
  { icon: <ClipboardList className="w-5 h-5" />, label: 'My Applications', path: '/my-applications' },
  { icon: <FileText className="w-5 h-5" />, label: 'My Resume', path: '/resume' },
  { icon: <Sparkles className="w-5 h-5" />, label: 'Resume Coach', path: '/resume-coach' },
  { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
]

const PROFILE_PHOTO_CACHE_KEY = 'recruitsense_profile_photo'
const PROFILE_PHOTO_CACHE_TTL = 5 * 60 * 1000

const readCachedProfilePhoto = (userId) => {
  try {
    const cached = JSON.parse(localStorage.getItem(PROFILE_PHOTO_CACHE_KEY) || 'null')

    if (!cached || cached.userId !== userId) return ''
    if (Date.now() - cached.savedAt > PROFILE_PHOTO_CACHE_TTL) return ''

    return cached.url || ''
  } catch {
    return ''
  }
}

const saveCachedProfilePhoto = (userId, url) => {
  localStorage.setItem(PROFILE_PHOTO_CACHE_KEY, JSON.stringify({
    userId,
    url: url || '',
    savedAt: Date.now(),
  }))
}

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [profilePhoto, setProfilePhoto] = useState(() => readCachedProfilePhoto(user?.id))
  const [networkSummary, setNetworkSummary] = useState({ pending_invitations_count: 0 })
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  const navigateWithSpinner = (path) => {
    if (location.pathname !== path) {
      window.dispatchEvent(new CustomEvent('recruitsense-route-loading', {
        detail: { path },
      }))
    }

    navigate(path)
  }

  useEffect(() => {
    const loadProfilePhoto = (force = false) => {
      const cachedPhoto = readCachedProfilePhoto(user?.id)

      if (!force && cachedPhoto) {
        setProfilePhoto(cachedPhoto)
        return
      }

      api.get('/profile')
        .then((res) => {
          const nextPhoto = res.data.profile?.profile_image_url || ''
          setProfilePhoto(nextPhoto)
          saveCachedProfilePhoto(user?.id, nextPhoto)
        })
        .catch(() => setProfilePhoto(''))
    }

    const refreshProfilePhoto = () => loadProfilePhoto(true)

    const loadNetworkSummary = () => {
      api.get('/network/summary')
        .then((res) => setNetworkSummary(res.data))
        .catch(() => setNetworkSummary({ pending_invitations_count: 0 }))
    }

    const loadNotificationsCount = () => {
      api.get('/notifications/unread-count')
        .then((res) => setUnreadNotificationsCount(res.data.unread_count || 0))
        .catch(() => setUnreadNotificationsCount(0))
    }

    const loadMessagesCount = () => {
      api.get('/messages/unread-count')
        .then((res) => setUnreadMessagesCount(res.data.unread_count || 0))
        .catch(() => setUnreadMessagesCount(0))
    }

    loadProfilePhoto()
    loadNetworkSummary()
    loadNotificationsCount()
    loadMessagesCount()
    window.addEventListener('recruitsense-profile-updated', refreshProfilePhoto)
    window.addEventListener('recruitsense-network-updated', loadNetworkSummary)
    window.addEventListener('recruitsense-notifications-updated', loadNotificationsCount)
    window.addEventListener('recruitsense-messages-updated', loadMessagesCount)

    return () => {
      window.removeEventListener('recruitsense-profile-updated', refreshProfilePhoto)
      window.removeEventListener('recruitsense-network-updated', loadNetworkSummary)
      window.removeEventListener('recruitsense-notifications-updated', loadNotificationsCount)
      window.removeEventListener('recruitsense-messages-updated', loadMessagesCount)
    }
  }, [user?.id])

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch (err) {
      console.log(err)
    } finally {
      logout()
      toast.success('Logged out successfully')
      navigate('/')
    }
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40">

      {/* Logo */}
      <div
        className="flex items-center gap-2 px-6 py-5 border-b border-gray-100 cursor-pointer"
        onClick={() => navigateWithSpinner('/')}
      >
        <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">
          Recruit<span className="text-indigo-600">Sense</span>
        </span>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <button
          onClick={() => navigateWithSpinner('/profile')}
          className={`w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-all ${
            location.pathname === '/profile' ? 'bg-indigo-50' : 'hover:bg-gray-50'
          }`}
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={user?.name || 'Profile'}
              className="w-10 h-10 rounded-full object-cover object-top border border-gray-100"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const badgeCount = item.badgeKey === 'unread_notifications_count'
            ? unreadNotificationsCount
            : item.badgeKey === 'unread_messages_count'
              ? unreadMessagesCount
              : Number(networkSummary[item.badgeKey] || 0)

          return (
            <button
              key={item.path}
              onClick={() => navigateWithSpinner(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {badgeCount > 0 && (
                <span className={`ml-auto min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                }`}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

    </div>
  )
}

export default Sidebar
