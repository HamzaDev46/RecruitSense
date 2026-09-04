import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, User, Building2, Briefcase, CheckCircle,
  XCircle, Upload, Bell, Flag, Search, RefreshCw, X, Calendar
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const typeMeta = {
  register: { icon: <User className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', label: 'Registration' },
  company: { icon: <Building2 className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 border-purple-100', label: 'Company Onboarding' },
  job: { icon: <Briefcase className="w-4 h-4" />, color: 'text-cyan-600 bg-cyan-50 border-cyan-100', label: 'Job Posting' },
  application: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Application' },
  report: { icon: <Flag className="w-4 h-4" />, color: 'text-red-500 bg-red-50 border-red-100', label: 'Report' },
  broadcast: { icon: <Bell className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Admin Broadcast' },
  resume: { icon: <Upload className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Resume Upload' },
}

const filters = [
  { value: 'all', label: 'All Activities' },
  { value: 'register', label: 'Registrations' },
  { value: 'company', label: 'Companies' },
  { value: 'job', label: 'Job Postings' },
  { value: 'application', label: 'Applications' },
  { value: 'broadcast', label: 'Broadcasts' },
  { value: 'report', label: 'Content Reports' },
]

const ActivityLog = () => {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchActivity = async () => {
      setLoading(true)
      try {
        const res = await api.get('/admin/activity-log')
        if (mounted) setLogs(res.data.activities || [])
      } catch (err) {
        if (mounted) {
          const msg = err.response?.data?.message || 'Failed to load activity log'
          toast.error(msg === 'Unauthorized' ? 'Admin access required.' : msg)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchActivity()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return logs.filter((log) => {
      const matchesFilter = filter === 'all' || log.type === filter
      const matchesSearch = !q || log.title?.toLowerCase().includes(q) || log.message?.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [filter, search, logs])

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Activity Audit Log</h1>
            <p className="text-gray-500 text-sm mt-0.5">Chronological record of registrations, jobs, applications, and system broadcasts</p>
          </div>
          <button
            onClick={fetchActivity}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 self-start transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Controls: Search + Filter Chips */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit log entries by title, description, or keyword..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                  filter === f.value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Log Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ClipboardList className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-gray-900 text-sm">{filtered.length} Audit Events Recorded</h2>
            </div>
            <span className="text-xs font-semibold text-gray-400">{logs.length} Total Loaded</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium text-sm">No activity events found matching your filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 p-2">
              {filtered.map((log, index) => {
                const meta = typeMeta[log.type] || typeMeta.register

                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50/80 rounded-2xl transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${meta.color}`}>
                      {meta.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{log.title}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400 shrink-0 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          {log.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{log.message}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

      </div>
    </AdminLayout>
  )
}

export default ActivityLog
