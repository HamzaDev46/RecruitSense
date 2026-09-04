import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, Search, Trash2, Building2, Calendar, X,
  MapPin, DollarSign, Eye, RefreshCw, Layers
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const getSkills = (skills) => {
  if (!skills) return []
  if (Array.isArray(skills)) return skills
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return skills.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

const ManageJobs = () => {
  const [jobs, setJobs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [inspectJob, setInspectJob] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(jobs.filter(j =>
      (statusFilter === 'all' || (j.status || 'active') === statusFilter) &&
      (j.title?.toLowerCase().includes(q) ||
      j.company?.name?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q))
    ))
  }, [search, statusFilter, jobs])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/jobs')
      setJobs(res.data)
      setFiltered(res.data)
    } catch (err) {
      toast.error('Failed to load job postings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this job posting?')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/jobs/${id}`)
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Job deleted successfully')
    } catch (err) {
      toast.error('Failed to delete job')
    } finally {
      setDeleting(null)
    }
  }

  const handleStatus = async (job, nextStatus) => {
    if ((job.status || 'active') === nextStatus) return

    setStatusUpdating(job.id)
    try {
      await api.put(`/admin/jobs/${job.id}/status`, { status: nextStatus })
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: nextStatus } : j))
      toast.success(`Job marked as ${nextStatus}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status')
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Job Postings</h1>
            <p className="text-gray-500 text-sm mt-0.5">Oversee company job openings, track application volumes, and update publishing status</p>
          </div>
          <button
            onClick={fetchJobs}
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
              placeholder="Search by job title, company name, or location..."
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
            <option value="all">All Statuses ({jobs.length})</option>
            <option value="active">Active Only</option>
            <option value="draft">Draft Only</option>
            <option value="closed">Closed Only</option>
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
              <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-cyan-600" />
              </div>
              <h2 className="font-bold text-gray-900">Job Postings ({filtered.length})</h2>
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
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No job postings found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Skills</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicants</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Posted</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((job, index) => {
                    const skills = getSkills(job.required_skills)
                    return (
                      <motion.tr
                        key={job.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-semibold text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                              {job.title?.charAt(0)}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="text-sm font-bold text-gray-900 truncate">{job.title}</p>
                              <p className="text-xs text-gray-500 truncate">{job.location || 'Remote'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{job.company?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {skills.slice(0, 2).map((skill, i) => (
                              <span key={i} className="text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                {skill}
                              </span>
                            ))}
                            {skills.length > 2 && (
                              <span className="text-[11px] font-medium bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-md">
                                +{skills.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">
                            {job.applications_count || 0} apps
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                            (job.status || 'active') === 'closed'
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : (job.status || 'active') === 'draft'
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {job.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(job.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setInspectJob(job)}
                              title="Inspect Job Details"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <select
                              value={job.status || 'active'}
                              onChange={(e) => handleStatus(job, e.target.value)}
                              disabled={statusUpdating === job.id}
                              className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 bg-white"
                            >
                              <option value="active">Active</option>
                              <option value="draft">Draft</option>
                              <option value="closed">Closed</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDelete(job.id)}
                              disabled={deleting === job.id}
                              title="Delete Job"
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {deleting === job.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Inspect Job Modal */}
      <AnimatePresence>
        {inspectJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{inspectJob.title}</h2>
                  <p className="text-xs text-gray-500 font-semibold">{inspectJob.company?.name || 'Company'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectJob(null)}
                  className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {inspectJob.location || 'Remote'}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold capitalize">
                    {inspectJob.job_type || 'Full Time'}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                    {inspectJob.salary_range || 'Negotiable'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {getSkills(inspectJob.required_skills).map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Description</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl whitespace-pre-line leading-relaxed border border-gray-100">
                    {inspectJob.description || 'No description provided.'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectJob(null)}
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

export default ManageJobs
