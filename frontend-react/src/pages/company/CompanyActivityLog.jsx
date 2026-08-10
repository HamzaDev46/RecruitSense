import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Search,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'applicant', label: 'Applicants' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'interview', label: 'Interviews' },
  { key: 'offer', label: 'Offers' },
  { key: 'hired', label: 'Hired' },
  { key: 'job', label: 'Jobs' },
]

const statusMeta = {
  pending: { icon: <Clock className="w-4 h-4" />, tone: 'bg-amber-50 text-amber-700', label: 'Pending' },
  screening: { icon: <ClipboardList className="w-4 h-4" />, tone: 'bg-sky-50 text-sky-700', label: 'Screening' },
  shortlisted: { icon: <CheckCircle2 className="w-4 h-4" />, tone: 'bg-emerald-50 text-emerald-700', label: 'Shortlisted' },
  interview: { icon: <Calendar className="w-4 h-4" />, tone: 'bg-indigo-50 text-indigo-700', label: 'Interview' },
  offered: { icon: <Award className="w-4 h-4" />, tone: 'bg-violet-50 text-violet-700', label: 'Offered' },
  hired: { icon: <UserCheck className="w-4 h-4" />, tone: 'bg-teal-50 text-teal-700', label: 'Hired' },
  rejected: { icon: <XCircle className="w-4 h-4" />, tone: 'bg-red-50 text-red-600', label: 'Rejected' },
  active: { icon: <Briefcase className="w-4 h-4" />, tone: 'bg-emerald-50 text-emerald-700', label: 'Active' },
  draft: { icon: <Briefcase className="w-4 h-4" />, tone: 'bg-slate-50 text-slate-600', label: 'Draft' },
  closed: { icon: <Briefcase className="w-4 h-4" />, tone: 'bg-red-50 text-red-600', label: 'Closed' },
}

const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateTime = (value) => {
  const date = parseDate(value)
  if (!date) return 'Recently'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const isToday = (value) => {
  const date = parseDate(value)
  if (!date) return false

  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

const activityMeta = (activity) => {
  if (activity.type === 'job') {
    return {
      icon: <Briefcase className="w-4 h-4" />,
      tone: statusMeta[activity.status]?.tone || 'bg-sky-50 text-sky-700',
      label: statusMeta[activity.status]?.label || 'Job',
    }
  }

  if (activity.type === 'interview') {
    return {
      icon: <Calendar className="w-4 h-4" />,
      tone: 'bg-indigo-50 text-indigo-700',
      label: 'Interview',
    }
  }

  if (activity.status && statusMeta[activity.status]) {
    return statusMeta[activity.status]
  }

  return {
    icon: <Users className="w-4 h-4" />,
    tone: 'bg-amber-50 text-amber-700',
    label: 'Activity',
  }
}

const matchesFilter = (activity, filter) => {
  if (filter === 'all') return true
  if (filter === 'offer') return activity.status === 'offered'
  if (filter === 'hired') return activity.status === 'hired'
  if (filter === 'pipeline') {
    return ['status'].includes(activity.type) &&
      !['offered', 'hired'].includes(activity.status)
  }

  return activity.type === filter
}

const StatCard = ({ icon, label, value, tone }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4">
    <div className="flex items-center gap-3">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
        {icon}
      </span>
      <span>
        <span className="block text-2xl font-bold text-gray-900">{value}</span>
        <span className="block text-sm font-semibold text-gray-500">{label}</span>
      </span>
    </div>
  </div>
)

const ActivityRow = ({ activity, index, onClick }) => {
  const meta = activityMeta(activity)

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="w-full p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-4">
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.tone}`}>
          {meta.icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{activity.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.tone}`}>
              {meta.label}
            </span>
            {isToday(activity.timestamp) && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                Today
              </span>
            )}
          </span>
          <span className="block text-sm text-gray-600 mt-1 leading-relaxed">{activity.description}</span>
          <span className="block text-xs text-gray-400 mt-2">{formatDateTime(activity.timestamp)}</span>
        </span>

        <ArrowRight className="w-4 h-4 text-gray-300 mt-2 flex-shrink-0" />
      </div>
    </motion.button>
  )
}

const CompanyActivityLog = () => {
  const navigate = useNavigate()
  const [activity, setActivity] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadActivity = async () => {
      setLoading(true)
      try {
        const res = await api.get('/company/activity-log?limit=80')
        setActivity(res.data.activity || [])
        setSummary(res.data.summary || {})
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load activity log')
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [])

  const filteredActivity = useMemo(() => {
    const query = search.trim().toLowerCase()

    return activity.filter((item) => {
      const searchable = [
        item.title,
        item.description,
        item.candidate_name,
        item.job_title,
        item.status,
        item.type,
      ].filter(Boolean).join(' ').toLowerCase()

      return matchesFilter(item, activeFilter) &&
        (!query || searchable.includes(query))
    })
  }, [activeFilter, activity, search])

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-1">Company activity</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity log</h1>
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                A complete timeline of applicants, pipeline decisions, interviews, offers, hires, and job updates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/company/dashboard')}
              className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
            >
              Back to dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard icon={<Clock className="w-5 h-5" />} label="Total" value={summary.total || activity.length} tone="bg-gray-50 text-gray-700" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Applicants" value={summary.applicants || 0} tone="bg-amber-50 text-amber-700" />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Interviews" value={summary.interviews || 0} tone="bg-indigo-50 text-indigo-700" />
          <StatCard icon={<Award className="w-5 h-5" />} label="Offers" value={summary.offers || 0} tone="bg-violet-50 text-violet-700" />
          <StatCard icon={<UserCheck className="w-5 h-5" />} label="Hired" value={summary.hired || 0} tone="bg-teal-50 text-teal-700" />
        </div>

        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by candidate, job, status, or activity..."
                  className="w-full h-11 rounded-xl border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`h-10 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                      activeFilter === filter.key
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500">
              {loading ? 'Loading activity...' : `${filteredActivity.length} activity item${filteredActivity.length === 1 ? '' : 's'} shown`}
            </p>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredActivity.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 mx-auto mb-3 flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <p className="font-bold text-gray-900">No activity found</p>
              <p className="text-sm text-gray-500 mt-1">Try another filter or search term.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredActivity.map((item, index) => (
                <ActivityRow
                  key={item.id}
                  activity={item}
                  index={index}
                  onClick={() => navigate(item.path || '/company/applicants')}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </CompanyLayout>
  )
}

export default CompanyActivityLog
