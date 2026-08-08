import { useEffect, useState } from 'react'
import { Bell, Brain, Menu, MessageCircle, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'

const AppTopBar = ({ role = 'jobseeker', onOpenSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const isCompany = role === 'company'

  const navigateWithSpinner = (path, target = path) => {
    if (location.pathname !== path) {
      window.dispatchEvent(new CustomEvent('recruitsense-route-loading', {
        detail: { path },
      }))
    }

    navigate(target)
  }

  const submitSearch = (event) => {
    event.preventDefault()
    const trimmed = query.trim()

    if (isCompany) {
      navigateWithSpinner(
        '/company/applicants',
        trimmed ? `/company/applicants?search=${encodeURIComponent(trimmed)}` : '/company/applicants'
      )
      return
    }

    navigateWithSpinner('/search', trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  useEffect(() => {
    let active = true

    const loadNotificationCount = () => {
      api.get('/notifications/unread-count')
        .then((res) => {
          if (active) setUnreadNotifications(res.data.unread_count || 0)
        })
        .catch(() => {
          if (active) setUnreadNotifications(0)
        })
    }

    const loadMessageCount = () => {
      api.get('/messages/unread-count')
        .then((res) => {
          if (active) setUnreadMessages(res.data.unread_count || 0)
        })
        .catch(() => {
          if (active) setUnreadMessages(0)
        })
    }

    loadNotificationCount()
    loadMessageCount()

    window.addEventListener('recruitsense-notifications-updated', loadNotificationCount)
    window.addEventListener('recruitsense-messages-updated', loadMessageCount)

    return () => {
      active = false
      window.removeEventListener('recruitsense-notifications-updated', loadNotificationCount)
      window.removeEventListener('recruitsense-messages-updated', loadMessageCount)
    }
  }, [])

  const searchPlaceholder = isCompany ? 'Search applicants...' : 'Search jobs, people, posts...'

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-gray-100 px-4 md:left-64">
      <div className="h-full flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 flex items-center justify-center md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => navigateWithSpinner(isCompany ? '/company/dashboard' : '/dashboard')}
          className="flex items-center gap-2 md:hidden"
        >
          <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline text-lg font-bold text-gray-900">
            Recruit<span className="text-indigo-600">Sense</span>
          </span>
        </button>

        <form onSubmit={submitSearch} className="hidden sm:block flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateWithSpinner(isCompany ? '/company/applicants' : '/search')}
            aria-label="Open search"
            className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center sm:hidden"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateWithSpinner('/messages')}
            aria-label="Open messages"
            className="relative w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadMessages > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigateWithSpinner('/notifications')}
            aria-label="Open notifications"
            className="relative w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default AppTopBar
