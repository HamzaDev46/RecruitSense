import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, MessageCircle, Pencil, RefreshCw, Search, Send, Trash2, User, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
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
  if (user?.profile_image_url) {
    return (
      <img
        src={user.profile_image_url}
        alt={user.name}
        className={`${size} rounded-full object-cover object-top border border-gray-100`}
      />
    )
  }

  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold`}>
      {initials(user?.name)}
    </div>
  )
}

const MessagesPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const messagesEndRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [body, setBody] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingBody, setEditingBody] = useState('')
  const [messageActionId, setMessageActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations

    return conversations.filter((conversation) =>
      conversation.other_user?.name?.toLowerCase().includes(query) ||
      conversation.other_user?.headline?.toLowerCase().includes(query) ||
      conversation.latest_message?.body?.toLowerCase().includes(query)
    )
  }, [conversations, search])

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
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-64px)] flex flex-col">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500 mt-1">Chat with people from your accepted network.</p>
          </div>
          <button
            onClick={loadConversations}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
          <aside className="col-span-4 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations"
                  className="w-full pl-9 pr-9 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
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
                  <MessageCircle className="w-11 h-11 text-gray-300 mx-auto mb-3" />
                  <h2 className="font-bold text-gray-900">No conversations</h2>
                  <p className="text-sm text-gray-500 mt-1">Start a chat from My Network or a connected profile.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => {
                    const active = selectedConversation?.id === conversation.id

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => openConversation(conversation)}
                        className={`w-full p-4 text-left flex items-center gap-3 transition-colors ${
                          active ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Avatar user={conversation.other_user} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-gray-900 truncate">{conversation.other_user?.name}</p>
                            {conversation.unread_count > 0 && (
                              <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.latest_message?.body || conversation.other_user?.headline || 'Conversation ready'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(conversation.latest_message?.created_at || conversation.created_at)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="col-span-8 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col min-h-0">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-center p-10">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h2 className="font-bold text-gray-900">Select a conversation</h2>
                  <p className="text-sm text-gray-500 mt-1">Messages from your network will appear here.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/profile/${selectedConversation.other_user?.id}`)}
                    className="flex items-center gap-3 text-left min-w-0"
                  >
                    <Avatar user={selectedConversation.other_user} />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{selectedConversation.other_user?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{selectedConversation.other_user?.headline || 'RecruitSense member'}</p>
                    </div>
                  </button>
                  {selectedMessage?.is_mine && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => startEdit(selectedMessage)}
                        title="Edit message"
                        aria-label="Edit message"
                        className="w-9 h-9 rounded-full border border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => requestDeleteMessage(selectedMessage)}
                        disabled={messageActionId === selectedMessage.id}
                        title="Delete message"
                        aria-label="Delete message"
                        className="w-9 h-9 rounded-full border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedMessage(null)}
                        aria-label="Clear selected message"
                        className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                        <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="font-bold text-gray-800">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-1">Send the first message to start the conversation.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isEditing = editingMessageId === message.id
                      const isSelected = selectedMessage?.id === message.id

                      return (
                        <div key={message.id} className={`flex ${message.is_mine ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[72%]">
                            {isEditing ? (
                              <div className="bg-white border border-indigo-100 rounded-2xl p-3 shadow-sm">
                                <textarea
                                  value={editingBody}
                                  onChange={(event) => setEditingBody(event.target.value)}
                                  rows="3"
                                  className="w-full min-w-[18rem] resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                                } ${isSelected ? 'ring-2 ring-indigo-300 ring-offset-2 ring-offset-gray-50' : ''}`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                                <p className={`text-[11px] mt-1 ${message.is_mine ? 'text-indigo-100' : 'text-gray-400'}`}>
                                  {formatTime(message.created_at)}
                                  {message.edited_at && <span> · edited</span>}
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

                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows="2"
                      placeholder="Write a message..."
                      className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !body.trim()}
                      className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send'}
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
    </DashboardLayout>
  )
}

export default MessagesPage
