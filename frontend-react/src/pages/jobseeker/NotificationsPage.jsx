import { useEffect, useMemo, useState } from 'react'
import { Bell, Briefcase, Check, Eye, Heart, MessageCircle, UserPlus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'

const initials = (name = 'User') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const formatDate = (value) => {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const iconForType = (type) => {
  if (type === 'connection_request') return <UserPlus className="w-5 h-5" />
  if (type === 'connection_accepted') return <Users className="w-5 h-5" />
  if (type === 'profile_view') return <Eye className="w-5 h-5" />
  if (type === 'post_like') return <Heart className="w-5 h-5" />
  if (type === 'post_comment') return <MessageCircle className="w-5 h-5" />
  if (type?.startsWith('application_')) return <Briefcase className="w-5 h-5" />

  return <Bell className="w-5 h-5" />
}

const ActorAvatar = ({ actor }) => {
  if (actor?.profile_image_url) {
    return (
      <img
        src={actor.profile_image_url}
        alt={actor.name}
        className="w-11 h-11 rounded-full object-cover object-top border border-gray-100"
      />
    )
  }

  return (
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold">
      {initials(actor?.name || 'RS')}
    </div>
  )
}

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  )

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    api.get('/notifications')
      .then((res) => {
        if (active) setNotifications(res.data)
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load notifications')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const markRead = async (notification, shouldNavigate = false) => {
    try {
      if (!notification.read_at) {
        const res = await api.post(`/notifications/${notification.id}/read`)
        setNotifications((current) => current.map((item) => item.id === notification.id ? res.data.notification : item))
        window.dispatchEvent(new CustomEvent('recruitsense-notifications-updated'))
      }

      if (shouldNavigate && notification.data?.link) {
        navigate(notification.data.link)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notification')
    }
  }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        read_at: notification.read_at || new Date().toISOString(),
      })))
      window.dispatchEvent(new CustomEvent('recruitsense-notifications-updated'))
      toast.success('Notifications marked as read')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notifications')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">{unreadCount} unread notifications</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifications}
              className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h2 className="font-bold text-gray-900">No notifications yet</h2>
              <p className="text-sm text-gray-500 mt-1">Profile views, connection requests, post activity, and application updates will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-5 flex items-start gap-4 ${notification.read_at ? 'bg-white' : 'bg-sky-50/60'}`}
                >
                  <ActorAvatar actor={notification.actor} />

                  <button
                    onClick={() => markRead(notification, true)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`${notification.read_at ? 'text-gray-400' : 'text-sky-600'}`}>
                        {iconForType(notification.type)}
                      </span>
                      <p className="font-bold text-gray-900">{notification.title}</p>
                      {!notification.read_at && <span className="w-2 h-2 rounded-full bg-sky-600" />}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(notification.created_at)}</p>
                  </button>

                  {!notification.read_at && (
                    <button
                      onClick={() => markRead(notification)}
                      className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-white"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default NotificationsPage
