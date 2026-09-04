import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Search, Trash2, Mail, Calendar, X, Ban,
  ShieldCheck, ExternalLink, RefreshCw, CheckCircle2, User
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const initials = (name = 'User') => name
  .split(' ')
  .map((p) => p[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const ManageUsers = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusUpdating, setStatusUpdating] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(users.filter(u =>
      (statusFilter === 'all' || (u.account_status || 'active') === statusFilter) &&
      (u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.headline?.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q))
    ))
  }, [search, statusFilter, users])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
      setFiltered(res.data)
    } catch (err) {
      toast.error('Failed to load job seekers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('User deleted successfully')
    } catch (err) {
      toast.error('Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  const handleStatus = async (user) => {
    const currentStatus = user.account_status || 'active'
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const label = nextStatus === 'suspended' ? 'suspend' : 'activate'

    if (!window.confirm(`Are you sure you want to ${label} this user account?`)) return

    setStatusUpdating(user.id)
    try {
      await api.put(`/admin/users/${user.id}/status`, { account_status: nextStatus })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, account_status: nextStatus } : u))
      toast.success(`User ${nextStatus === 'suspended' ? 'suspended' : 'activated'}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status')
    } finally {
      setStatusUpdating(null)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Job Seekers</h1>
            <p className="text-gray-500 text-sm mt-0.5">View profiles, manage account statuses, and monitor candidate engagement</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 self-start transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, headline, or location..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="all">All Statuses ({users.length})</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-bold text-gray-900">Registered Job Seekers ({filtered.length})</h2>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No job seekers found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Engagement</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profile_image_url ? (
                            <img
                              src={user.profile_image_url}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                              {initials(user.name)}
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.headline || 'Job Seeker'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 font-medium">
                          <span className="font-bold text-indigo-600">{user.job_seeker?.applications_count || 0}</span> apps
                          <span className="mx-1.5 text-gray-300">•</span>
                          <span className="font-bold text-purple-600">{user.posts_count || 0}</span> posts
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize inline-flex items-center gap-1 ${
                          (user.account_status || 'active') === 'suspended'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {(user.account_status || 'active') === 'suspended' ? (
                            <Ban className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {user.account_status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/profile/${user.id}`)}
                            title="View Full Profile"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatus(user)}
                            disabled={statusUpdating === user.id}
                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                              (user.account_status || 'active') === 'suspended'
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            }`}
                          >
                            {statusUpdating === user.id ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (user.account_status || 'active') === 'suspended' ? (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            {(user.account_status || 'active') === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(user.id)}
                            disabled={deleting === user.id}
                            title="Delete User Account"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleting === user.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  )
}

export default ManageUsers
