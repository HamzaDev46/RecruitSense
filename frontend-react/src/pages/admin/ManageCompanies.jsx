import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Search, Trash2, Mail, Calendar, X,
  Briefcase, Eye, Globe, MapPin, RefreshCw, CheckCircle2,
  Clock, Ban
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const initials = (name = 'Company') => name
  .split(' ')
  .map((p) => p[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [inspectCompany, setInspectCompany] = useState(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(companies.filter(c =>
      (statusFilter === 'all' || (c.verification_status || 'verified') === statusFilter) &&
      (c.name?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q))
    ))
  }, [search, statusFilter, companies])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/companies')
      setCompanies(res.data)
      setFiltered(res.data)
    } catch (err) {
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this company and all associated jobs and data?')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/companies/${id}`)
      setCompanies(prev => prev.filter(c => c.id !== id))
      toast.success('Company deleted successfully')
    } catch (err) {
      toast.error('Failed to delete company')
    } finally {
      setDeleting(null)
    }
  }

  const handleStatus = async (company, nextStatus) => {
    if ((company.verification_status || 'verified') === nextStatus) return

    setStatusUpdating(company.id)
    try {
      await api.put(`/admin/companies/${company.id}/status`, { verification_status: nextStatus })
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, verification_status: nextStatus } : c))
      toast.success(`Company marked as ${nextStatus}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company status')
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Companies</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review registered employer organizations, verification badges, and job posting privileges</p>
          </div>
          <button
            onClick={fetchCompanies}
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
              placeholder="Search by company name, industry, location, or email..."
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
            <option value="all">All Verification Statuses ({companies.length})</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Only</option>
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
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="font-bold text-gray-900">Registered Companies ({filtered.length})</h2>
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
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No companies found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Email</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Jobs</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((company, index) => (
                    <motion.tr
                      key={company.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-10 h-10 rounded-xl object-contain border border-gray-100 p-1"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                              {initials(company.name)}
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <p className="text-sm font-bold text-gray-900 truncate">{company.name}</p>
                            <p className="text-xs text-purple-600 font-medium truncate">{company.location || 'Company Account'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{company.industry || 'Not specified'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{company.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">
                          {company.job_postings_count || 0} jobs
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize inline-flex items-center gap-1 ${
                          (company.verification_status || 'verified') === 'suspended'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : (company.verification_status || 'verified') === 'pending'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {(company.verification_status || 'verified') === 'suspended' ? (
                            <Ban className="w-3 h-3" />
                          ) : (company.verification_status || 'verified') === 'pending' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {company.verification_status || 'verified'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(company.created_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectCompany(company)}
                            title="Inspect Company Details"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <select
                            value={company.verification_status || 'verified'}
                            onChange={(e) => handleStatus(company, e.target.value)}
                            disabled={statusUpdating === company.id}
                            className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="suspended">Suspended</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDelete(company.id)}
                            disabled={deleting === company.id}
                            title="Delete Company"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleting === company.id ? (
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

      {/* Inspect Company Modal */}
      <AnimatePresence>
        {inspectCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    {initials(inspectCompany.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{inspectCompany.name}</h2>
                    <p className="text-xs text-gray-500">{inspectCompany.industry || 'Industry N/A'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectCompany(null)}
                  className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-wrap gap-2 text-xs">
                  {inspectCompany.location && (
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {inspectCompany.location}
                    </span>
                  )}
                  {inspectCompany.website && (
                    <a
                      href={inspectCompany.website.startsWith('http') ? inspectCompany.website : `https://${inspectCompany.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {inspectCompany.website}
                    </a>
                  )}
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold">
                    {inspectCompany.job_postings_count || 0} active job postings
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Company Overview</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl whitespace-pre-line leading-relaxed border border-gray-100">
                    {inspectCompany.description || inspectCompany.about || 'No company description provided.'}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Registered Email</h3>
                  <p className="text-xs text-gray-700 font-medium">{inspectCompany.user?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectCompany(null)}
                  className="px-5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}

export default ManageCompanies
