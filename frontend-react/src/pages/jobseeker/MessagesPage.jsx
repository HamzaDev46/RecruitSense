import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  ExternalLink,
  Inbox,
  MessageCircle,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import CompanyLayout from '../../components/company/CompanyLayout'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const initials = (name = 'User') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const formatTime = (value) => {
  if (!value) return ''

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const Avatar = ({ user, size = 'w-11 h-11' }) => {
  const isCompanyUser = user?.role === 'company'

  return (
    <div className="relative shrink-0">
      {user?.profile_image_url ? (
        <img
          src={user.profile_image_url}
          alt={user.name}
          className={`${size} rounded-full object-cover object-top border border-gray-100 shadow-sm`}
        />
      ) : (
        <div
          className={`${size} rounded-full ${
            isCompanyUser
              ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          } text-white flex items-center justify-center font-bold text-sm shadow-sm`}
        >
          {initials(user?.name)}
        </div>
      )}
      <div
        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] border border-white shadow-sm ${
          isCompanyUser ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
        }`}
        title={isCompanyUser ? 'Company' : 'Person'}
      >
        {isCompanyUser ? <Building2 className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
      </div>
    </div>
  )
}

const MessagesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const messagesEndRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [conversationFilter, setConversationFilter] = useState('all') // 'all' | 'people' | 'companies' | 'unread'
  const [body, setBody] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingBody, setEditingBody] = useState('')
  const [messageActionId, setMessageActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const isCompany = user?.role === 'company'
  const Layout = isCompany ? CompanyLayout : DashboardLayout

  const messageStats = useMemo(() => {
    const unreadMessages = conversations.reduce((total, conversation) => total + Number(conversation.unread_count || 0), 0)
    const unreadThreads = conversations.filter((conversation) => Number(conversation.unread_count || 0) > 0).length
    const peopleThreads = conversations.filter((conversation) => (conversation.other_user?.role || 'jobseeker') === 'jobseeker').length
    const companyThreads = conversations.filter((conversation) => conversation.other_user?.role === 'company').length

    return {
      total: conversations.length,
      unreadMessages,
      unreadThreads,
      peopleThreads,
      companyThreads,
    }
  }, [conversations])

  const filteredConversations = useMemo(() => {
    let scopedConversations = conversations

    if (conversationFilter === 'unread') {
      scopedConversations = scopedConversations.filter((conversation) => Number(conversation.unread_count || 0) > 0)
    } else if (conversationFilter === 'people') {
      scopedConversations = scopedConversations.filter((conversation) => (conversation.other_user?.role || 'jobseeker') === 'jobseeker')
    } else if (conversationFilter === 'companies') {
      scopedConversations = scopedConversations.filter((conversation) => conversation.other_user?.role === 'company')
    }

    const query = search.trim().toLowerCase()
    if (!query) return scopedConversations

    return scopedConversations.filter((conversation) =>
      conversation.other_user?.name?.toLowerCase().includes(query) ||
      conversation.other_user?.headline?.toLowerCase().includes(query) ||
      conversation.other_user?.company?.toLowerCase().includes(query) ||
      conversation.latest_message?.body?.toLowerCase().includes(query)
    )
  }, [conversationFilter, conversations, search])

  const clearSelectedConversation = () => {
    setSelectedConversation(null)
    setMessages([])
    setSelectedMessage(null)
    setDeleteTarget(null)
    setEditingMessageId(null)
    setEditingBody('')
    setSearchParams({})
  }

  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/messages/conversations')
      setConversations(res.data || [])
      return res.data || []
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load messages')
      return []
    } finally {
      setLoading(false)
    }
  }

  const openConversation = async (conversation) => {
    if (!conversation?.id) return

    setSelectedMessage(null)
    setDeleteTarget(null)
    setEditingMessageId(null)
    setEditingBody('')
    setSelectedConversation(conversation)
    setSearchParams({ conversation: conversation.id })
    setMessagesLoading(true)

    try {
      const res = await api.get(`/messages/conversations/${conversation.id}`)
      setSelectedConversation(res.data.conversation)
      setMessages(res.data.messages || [])
      setConversations((current) => current.map((item) => (
        item.id === conversation.id ? res.data.conversation : item
      )))
      window.dispatchEvent(new CustomEvent('recruitsense-messages-updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open conversation')
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const loadInitialConversations = async () => {
      try {
        const res = await api.get('/messages/conversations')

        if (!active) return

        const items = res.data || []
        setConversations(items)

        const conversationId = Number(searchParams.get('conversation'))
        const target = items.find((item) => item.id === conversationId)

        if (target) {
          setSelectedConversation(target)
          setMessagesLoading(true)

          try {
            const messagesRes = await api.get(`/messages/conversations/${target.id}`)

            if (!active) return

            setSelectedConversation(messagesRes.data.conversation)
            setMessages(messagesRes.data.messages || [])
            setConversations((current) => current.map((item) => (
              item.id === target.id ? messagesRes.data.conversation : item
            )))
            window.dispatchEvent(new CustomEvent('recruitsense-messages-updated'))
          } catch (err) {
            if (active) toast.error(err.response?.data?.message || 'Failed to open conversation')
          } finally {
            if (active) setMessagesLoading(false)
          }
        }
      } catch (err) {
        if (active) toast.error(err.response?.data?.message || 'Failed to load messages')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialConversations()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }, [])

  const sendMessage = async () => {
    const text = body.trim()

    if (!text || !selectedConversation) return

    setSending(true)

    try {
      const res = await api.post(`/messages/conversations/${selectedConversation.id}`, { body: text })
      setMessages((current) => [...current, res.data.chat_message])
      setSelectedConversation(res.data.conversation)
      setConversations((current) => [
        res.data.conversation,
        ...current.filter((item) => item.id !== selectedConversation.id),
      ])
      setBody('')
      window.dispatchEvent(new CustomEvent('recruitsense-messages-updated'))
      window.dispatchEvent(new CustomEvent('recruitsense-notifications-updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const beginLongPress = (message) => {
    clearLongPressTimer()

    if (!message?.is_mine || editingMessageId === message.id) return

    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessage(message)
      longPressTimerRef.current = null
    }, 550)
  }

  const startEdit = (message) => {
    if (!message?.is_mine) return

    setSelectedMessage(null)
    setDeleteTarget(null)
    setEditingMessageId(message.id)
    setEditingBody(message.body)
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingBody('')
  }

  const saveEditedMessage = async (message) => {
    const text = editingBody.trim()

    if (!text) {
      toast.error('Message cannot be empty')
      return
    }

    setMessageActionId(message.id)

    try {
      const res = await api.put(`/messages/${message.id}`, { body: text })
      setMessages((current) => current.map((item) => (
        item.id === message.id ? res.data.chat_message : item
      )))
      setSelectedConversation(res.data.conversation)
      setConversations((current) => current.map((item) => (
        item.id === res.data.conversation.id ? res.data.conversation : item
      )))
      cancelEdit()
      toast.success('Message updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update message')
    } finally {
      setMessageActionId(null)
    }
  }

  const requestDeleteMessage = (message) => {
    if (!message?.is_mine) return

    setDeleteTarget(message)
  }

  const deleteMessage = async (message) => {
    if (!message?.is_mine) return

    setMessageActionId(message.id)

    try {
      const res = await api.delete(`/messages/${message.id}`)
      setMessages((current) => current.filter((item) => item.id !== message.id))
      setSelectedConversation(res.data.conversation)
      setConversations((current) => current.map((item) => (
        item.id === res.data.conversation.id ? res.data.conversation : item
      )))
      setSelectedMessage(null)
      setDeleteTarget(null)
      if (editingMessageId === message.id) cancelEdit()
      toast.success('Message deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message')
    } finally {
      setMessageActionId(null)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto min-h-[calc(100vh-7rem)] lg:h-[calc(100vh-64px)] flex flex-col">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isCompany
                ? 'Chat with candidates who applied to your jobs.'
                : 'Connect with people from your network and hiring companies.'}
            </p>
          </div>
          <button
            onClick={loadConversations}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0">
          <aside className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} lg:col-span-4 bg-white border border-gray-100 rounded-xl overflow-hidden flex-col min-h-[60vh] lg:min-h-0`}>
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, headline, or message..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categorization Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: 'all', label: 'All', count: messageStats.total, icon: null },
                  { key: 'people', label: 'People', count: messageStats.peopleThreads, icon: User },
                  { key: 'companies', label: 'Companies', count: messageStats.companyThreads, icon: Building2 },
                  { key: 'unread', label: 'Unread', count: messageStats.unreadThreads, icon: null },
                ].map((item) => {
                  const Icon = item.icon
                  const isActive = conversationFilter === item.key

                  return (
                    <button
                      key={item.key}
                      onClick={() => setConversationFilter(item.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? item.key === 'companies'
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-200'
                            : 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span>{item.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mx-auto mb-3">
                    {conversationFilter === 'companies' ? (
                      <Building2 className="w-6 h-6" />
                    ) : conversationFilter === 'people' ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      <MessageCircle className="w-6 h-6" />
                    )}
                  </div>
                  <h2 className="font-bold text-gray-900">
                    {search
                      ? 'No matching conversations'
                      : conversationFilter === 'people'
                        ? 'No people conversations'
                        : conversationFilter === 'companies'
                          ? 'No company conversations'
                          : conversationFilter === 'unread'
                            ? 'No unread messages'
                            : 'No conversations'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                    {conversationFilter === 'people'
                      ? 'Start a chat from My Network or a connected candidate profile.'
                      : conversationFilter === 'companies'
                        ? isCompany
                          ? 'Applicant conversations will appear here.'
                          : 'Chats with hiring companies and recruiters will appear here.'
                        : isCompany
                          ? 'Open an applicant profile and start a candidate chat.'
                          : 'Start a chat from My Network or when a company contacts you.'}
                  </p>
                  {!isCompany && conversationFilter === 'people' && !search && (
                    <button
                      onClick={() => navigate('/network')}
                      className="mt-4 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                    >
                      Find People in Network
                    </button>
                  )}
                  {!isCompany && conversationFilter === 'companies' && !search && (
                    <button
                      onClick={() => navigate('/jobs')}
                      className="mt-4 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
                    >
                      Browse Jobs & Companies
                    </button>
                  )}
                  {(search || conversationFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearch('')
                        setConversationFilter('all')
                      }}
                      className="mt-3 px-4 py-1.5 rounded-full border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 block mx-auto"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => {
                    const active = selectedConversation?.id === conversation.id
                    const otherUser = conversation.other_user
                    const isOtherCompany = otherUser?.role === 'company'

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => openConversation(conversation)}
                        className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                          active ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Avatar user={otherUser} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="font-bold text-gray-900 truncate text-sm">
                              {otherUser?.name}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 truncate mb-1">
                            {conversation.latest_message?.body || otherUser?.headline || 'Conversation ready'}
                          </p>

                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[11px] text-gray-400">
                              {formatTime(conversation.latest_message?.created_at || conversation.created_at)}
                            </span>

                            {isOtherCompany ? (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100/80 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                <Building2 className="w-2.5 h-2.5" /> Company
                              </span>
                            ) : (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                <User className="w-2.5 h-2.5" /> Person
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} lg:col-span-8 bg-white border border-gray-100 rounded-xl overflow-hidden flex-col min-h-[64vh] lg:min-h-0`}>
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-center p-10">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h2 className="font-bold text-gray-900">Select a conversation</h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                    {isCompany
                      ? 'Select a candidate conversation to view chat history and send updates.'
                      : 'Select a conversation with a connection or company from the list to start messaging.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={clearSelectedConversation}
                      className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center lg:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${selectedConversation.other_user?.id}`)}
                      className="flex items-center gap-3 text-left min-w-0 group"
                    >
                      <Avatar user={selectedConversation.other_user} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {selectedConversation.other_user?.name}
                          </p>
                          {selectedConversation.other_user?.role === 'company' ? (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              <Building2 className="w-3 h-3" /> Company
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              <User className="w-3 h-3" /> Person
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {selectedConversation.other_user?.headline ||
                            (selectedConversation.other_user?.role === 'company' ? 'RecruitSense Verified Company' : 'RecruitSense Member')}
                        </p>
                      </div>
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {selectedConversation.other_user?.id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${selectedConversation.other_user.id}`)}
                        title="View Profile"
                        aria-label="View Profile"
                        className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    {isCompany && (
                      <button
                        type="button"
                        onClick={() => navigate('/company/applicants')}
                        title="Open applicants"
                        aria-label="Open applicants"
                        className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      >
                        <Briefcase className="w-4 h-4" />
                      </button>
                    )}
                    {selectedMessage?.is_mine && (
                      <>
                        <button
                          onClick={() => startEdit(selectedMessage)}
                          title="Edit message"
                          aria-label="Edit message"
                          className="w-9 h-9 rounded-full border border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDeleteMessage(selectedMessage)}
                          disabled={messageActionId === selectedMessage.id}
                          title="Delete message"
                          aria-label="Delete message"
                          className="w-9 h-9 rounded-full border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedMessage(null)}
                          aria-label="Clear selected message"
                          className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/60">
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-12 bg-white border border-gray-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        {selectedConversation.other_user?.role === 'company' ? (
                          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        ) : (
                          <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        )}
                        <p className="font-bold text-gray-800">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                          {selectedConversation.other_user?.role === 'company'
                            ? `Send a message to ${selectedConversation.other_user?.name} regarding job opportunities.`
                            : `Say hello to ${selectedConversation.other_user?.name} to start the conversation.`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isEditing = editingMessageId === message.id
                      const isSelected = selectedMessage?.id === message.id

                      return (
                        <div key={message.id} className={`flex ${message.is_mine ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[86%] sm:max-w-[72%]">
                            {isEditing ? (
                              <div className="bg-white border border-indigo-100 rounded-2xl p-3 shadow-sm">
                                <textarea
                                  value={editingBody}
                                  onChange={(event) => setEditingBody(event.target.value)}
                                  rows="3"
                                  className="w-full min-w-0 sm:min-w-[18rem] resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={cancelEdit}
                                    className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveEditedMessage(message)}
                                    disabled={messageActionId === message.id}
                                    className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {messageActionId === message.id ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onMouseDown={() => beginLongPress(message)}
                                onMouseUp={clearLongPressTimer}
                                onMouseLeave={clearLongPressTimer}
                                onTouchStart={() => beginLongPress(message)}
                                onTouchEnd={clearLongPressTimer}
                                onTouchCancel={clearLongPressTimer}
                                onContextMenu={(event) => {
                                  if (!message.is_mine) return

                                  event.preventDefault()
                                  clearLongPressTimer()
                                  setSelectedMessage(message)
                                }}
                                className={`rounded-2xl px-4 py-2.5 transition ${
                                  message.is_mine
                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                                } ${isSelected ? 'ring-2 ring-indigo-300 ring-offset-2 ring-offset-gray-50' : ''}`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                                <p className={`text-[11px] mt-1 ${message.is_mine ? 'text-indigo-100' : 'text-gray-400'}`}>
                                  {formatTime(message.created_at)}
                                  {message.edited_at && <span> - edited</span>}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-end gap-2 sm:gap-3">
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows="2"
                      placeholder={
                        selectedConversation.other_user?.role === 'company'
                          ? `Write to ${selectedConversation.other_user?.name}...`
                          : 'Write a message...'
                      }
                      className="min-w-0 flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !body.trim()}
                      className="px-4 sm:px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-gray-100 shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Delete message?</h2>
              <p className="text-sm text-gray-500 mt-2">
                This message will be removed from this conversation. You cannot undo this action.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={messageActionId === deleteTarget.id}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMessage(deleteTarget)}
                  disabled={messageActionId === deleteTarget.id}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {messageActionId === deleteTarget.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MessagesPage
