import { useEffect, useMemo, useState } from 'react'
import { Bell, Briefcase, Check, Eye, Heart, Loader2, MessageCircle, Trash2, UserPlus, Users, X } from 'lucide-react'
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
  if (type === 'message_received') return <MessageCircle className="w-5 h-5" />
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

const notificationLink = (notification) => {
  if (notification.data?.link) return notification.data.link
  if (notification.type === 'job_alert_match' && notification.data?.job_id) return `/jobs/${notification.data.job_id}`
  if (notification.type === 'message_received' && notification.data?.conversation_id) return `/messages?conversation=${notification.data.conversation_id}`
  if (notification.type === 'connection_request') return '/network'
  if (notification.type === 'connection_accepted' && notification.actor?.id) return `/profile/${notification.actor.id}`
  if (notification.type === 'profile_view' && notification.actor?.id) return `/profile/${notification.actor.id}`
  if (notification.type === 'post_like' || notification.type === 'post_comment') return '/feed'
  if (notification.type?.startsWith('application_')) return '/my-applications'

  return null
}

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [clearingAll, setClearingAll] = useState(false)
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

      const link = notificationLink(notification)

      if (shouldNavigate && link) {
        navigate(link)
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

  const deleteNotification = async (notification) => {
    setBusyId(notification.id)

    try {
      await api.delete(`/notifications/${notification.id}`)
      setNotifications((current) => current.filter((item) => item.id !== notification.id))
      setDeleteTarget(null)
      window.dispatchEvent(new CustomEvent('recruitsense-notifications-updated'))
      toast.success('Notification deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notification')
    } finally {
      setBusyId(null)
    }
  }

  const clearAllNotifications = async () => {
    setClearingAll(true)

    try {
      await api.delete('/notifications')
      setNotifications([])
      setClearAllOpen(false)
      window.dispatchEvent(new CustomEvent('recruitsense-notifications-updated'))
      toast.success('Notifications cleared')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear notifications')
    } finally {
      setClearingAll(false)
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
            <button
              onClick={() => setClearAllOpen(true)}
              disabled={notifications.length === 0}
              className="px-4 py-2 rounded-full border border-red-100 text-red-600 bg-red-50 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
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

                  <div className="flex shrink-0 items-center gap-2">
                    {!notification.read_at && (
                      <button
                        onClick={() => markRead(notification)}
                        className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-white"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(notification)}
                      disabled={busyId === notification.id}
                      aria-label="Delete notification"
                      title="Delete notification"
                      className="w-9 h-9 rounded-full border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-60 flex items-center justify-center"
                    >
                      {busyId === notification.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete notification?</h2>
                <p className="text-sm text-gray-500 mt-1">{deleteTarget.title}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={busyId === deleteTarget.id}
                aria-label="Close delete confirmation"
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-600">
                This notification will be removed from your list. The related profile, job, message, or application will not be deleted.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={busyId === deleteTarget.id}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteNotification(deleteTarget)}
                  disabled={busyId === deleteTarget.id}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {busyId === deleteTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {busyId === deleteTarget.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {clearAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Clear all notifications?</h2>
                <p className="text-sm text-gray-500 mt-1">{notifications.length} notifications will be removed.</p>
              </div>
              <button
                onClick={() => setClearAllOpen(false)}
                disabled={clearingAll}
                aria-label="Close clear confirmation"
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-600">
                This only clears your notification list. It will not remove jobs, connections, posts, messages, or applications.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClearAllOpen(false)}
                  disabled={clearingAll}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  disabled={clearingAll}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {clearingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {clearingAll ? 'Clearing...' : 'Clear all'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default NotificationsPage
