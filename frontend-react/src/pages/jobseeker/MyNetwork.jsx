import { useEffect, useMemo, useState } from 'react'
import { Building2, Check, Clock, MapPin, MessageCircle, Search, UserCheck, UserPlus, Users, X } from 'lucide-react'
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

const PersonAvatar = ({ user, size = 'w-14 h-14', textSize = 'text-lg' }) => {
  if (user.profile_image_url) {
    return (
      <img
        src={user.profile_image_url}
        alt={user.name}
        className={`${size} rounded-full object-cover object-top border border-gray-100`}
      />
    )
  }

  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold ${textSize}`}>
      {initials(user.name)}
    </div>
  )
}

const PersonMeta = ({ user }) => (
  <div className="min-w-0">
    <p className="font-bold text-gray-900 truncate">{user.name}</p>
    <p className="text-sm text-gray-600 truncate">{user.headline || 'RecruitSense member'}</p>
    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
      {user.company && (
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          {user.company}
        </span>
      )}
      {user.location && (
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {user.location}
        </span>
      )}
    </div>
  </div>
)

const MyNetwork = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [invitations, setInvitations] = useState([])
  const [connections, setConnections] = useState([])
  const [search, setSearch] = useState('')
  const [peopleSearch, setPeopleSearch] = useState('')
  const [peopleSearchResults, setPeopleSearchResults] = useState([])
  const [peopleSearchLoading, setPeopleSearchLoading] = useState(false)
  const [messageLoadingId, setMessageLoadingId] = useState(null)

  const loadNetwork = async () => {
    try {
      const [suggestionsRes, invitationsRes, connectionsRes] = await Promise.all([
        api.get('/network/suggestions'),
        api.get('/network/invitations'),
        api.get('/network/connections'),
      ])

      setSuggestions(suggestionsRes.data)
      setInvitations(invitationsRes.data)
      setConnections(connectionsRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load network')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    Promise.all([
      api.get('/network/suggestions'),
      api.get('/network/invitations'),
      api.get('/network/connections'),
    ])
      .then(([suggestionsRes, invitationsRes, connectionsRes]) => {
        if (!active) return

        setSuggestions(suggestionsRes.data)
        setInvitations(invitationsRes.data)
        setConnections(connectionsRes.data)
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load network')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredConnections = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return connections

    return connections.filter(({ user }) =>
      user.name?.toLowerCase().includes(query) ||
      user.headline?.toLowerCase().includes(query) ||
      user.company?.toLowerCase().includes(query)
    )
  }, [connections, search])

  const visibleSuggestions = useMemo(() => {
    return peopleSearch.trim().length >= 2 ? peopleSearchResults : suggestions
  }, [peopleSearch, peopleSearchResults, suggestions])

  const handlePeopleSearchChange = (event) => {
    const nextSearch = event.target.value

    setPeopleSearch(nextSearch)

    if (nextSearch.trim().length < 2) {
      setPeopleSearchResults([])
      setPeopleSearchLoading(false)
      return
    }

    setPeopleSearchLoading(true)
  }

  useEffect(() => {
    const query = peopleSearch.trim()

    if (query.length < 2) {
      return undefined
    }

    let active = true

    const timer = setTimeout(() => {
      api.get('/network/search', { params: { query } })
        .then((res) => {
          if (active) setPeopleSearchResults(res.data || [])
        })
        .catch((err) => {
          if (active) toast.error(err.response?.data?.message || 'Failed to search people')
        })
        .finally(() => {
          if (active) setPeopleSearchLoading(false)
        })
    }, 350)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [peopleSearch])

  const handleConnect = async (userId) => {
    try {
      await api.post(`/network/connect/${userId}`)
      setSuggestions(suggestions.filter((user) => user.id !== userId))
      setPeopleSearchResults((current) => current.filter((user) => user.id !== userId))
      window.dispatchEvent(new CustomEvent('recruitsense-network-updated'))
      toast.success('Connection request sent')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request')
    }
  }

  const handleAccept = async (invitation) => {
    try {
      await api.post(`/network/accept/${invitation.connection_id}`)
      setInvitations(invitations.filter((item) => item.connection_id !== invitation.connection_id))
      setConnections([{ connection_id: invitation.connection_id, status: 'accepted', user: invitation.user }, ...connections])
      window.dispatchEvent(new CustomEvent('recruitsense-network-updated'))
      toast.success('Connection accepted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request')
    }
  }

  const handleReject = async (invitation) => {
    try {
      await api.post(`/network/reject/${invitation.connection_id}`)
      setInvitations(invitations.filter((item) => item.connection_id !== invitation.connection_id))
      window.dispatchEvent(new CustomEvent('recruitsense-network-updated'))
      toast.success('Request ignored')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to ignore request')
    }
  }

  const handleRemove = async (connectionId) => {
    try {
      await api.delete(`/network/remove/${connectionId}`)
      setConnections(connections.filter((item) => item.connection_id !== connectionId))
      window.dispatchEvent(new CustomEvent('recruitsense-network-updated'))
      toast.success('Connection removed')
      await loadNetwork()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove connection')
    }
  }

  const handleMessage = async (userId) => {
    setMessageLoadingId(userId)
    try {
      const res = await api.post(`/messages/start/${userId}`)
      navigate(`/messages?conversation=${res.data.conversation.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start conversation')
    } finally {
      setMessageLoadingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Network</h1>
          <p className="text-gray-500 text-sm mt-1">Manage connections, invitations, and people you may know.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Connections', value: connections.length, icon: <Users className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Invitations', value: invitations.length, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Suggestions', value: suggestions.length, icon: <UserPlus className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-100 p-5">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <section className="col-span-2 space-y-5">
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">Invitations</h2>
                  <p className="text-sm text-gray-500">{invitations.length} pending requests</p>
                </div>
              </div>

              {loading ? (
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ) : invitations.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Clock className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No pending invitations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.connection_id} className="flex items-center gap-4 border border-gray-100 rounded-lg p-4">
                      <button onClick={() => navigate(`/profile/${invitation.user.id}`)}>
                        <PersonAvatar user={invitation.user} />
                      </button>
                      <button onClick={() => navigate(`/profile/${invitation.user.id}`)} className="flex-1 text-left min-w-0">
                        <PersonMeta user={invitation.user} />
                      </button>
                      <button
                        onClick={() => handleReject(invitation)}
                        className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        Ignore
                      </button>
                      <button
                        onClick={() => handleAccept(invitation)}
                        className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">Connections</h2>
                  <p className="text-sm text-gray-500">{connections.length} people in your network</p>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search connections"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((item) => <div key={item} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <UserCheck className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No connections found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredConnections.map((connection) => (
                    <div key={connection.connection_id} className="flex items-center gap-4 border border-gray-100 rounded-lg p-4">
                      <button onClick={() => navigate(`/profile/${connection.user.id}`)}>
                        <PersonAvatar user={connection.user} />
                      </button>
                      <button onClick={() => navigate(`/profile/${connection.user.id}`)} className="flex-1 text-left min-w-0">
                        <PersonMeta user={connection.user} />
                      </button>
                      <button
                        onClick={() => handleMessage(connection.user.id)}
                        disabled={messageLoadingId === connection.user.id}
                        className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {messageLoadingId === connection.user.id ? 'Opening...' : 'Message'}
                      </button>
                      <button
                        onClick={() => handleRemove(connection.connection_id)}
                        className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h2 className="font-bold text-gray-900">People you may know</h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">Connect with other RecruitSense members.</p>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={peopleSearch}
                  onChange={handlePeopleSearchChange}
                  placeholder="Search people, skills, company..."
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {peopleSearch && (
                  <button
                    onClick={() => setPeopleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear people search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {loading || peopleSearchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => <div key={item} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : visibleSuggestions.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <Users className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {peopleSearch.trim().length >= 2 ? 'No people matched your search.' : 'No suggestions right now.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleSuggestions.map((user) => (
                    <div key={user.id} className="border border-gray-100 rounded-lg p-4">
                      <button onClick={() => navigate(`/profile/${user.id}`)} className="w-full flex items-center gap-3 text-left">
                        <PersonAvatar user={user} size="w-12 h-12" textSize="text-base" />
                        <PersonMeta user={user} />
                      </button>
                      <button
                        onClick={() => handleConnect(user.id)}
                        className="w-full mt-4 px-4 py-2 rounded-full border border-sky-600 text-sky-700 text-sm font-semibold hover:bg-sky-50 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MyNetwork
