import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'
import { formatDeadline, isJobExpired } from '../../utils/jobDetails'

const initialStats = {
  total_jobs: 0,
  active_jobs: 0,
  accepting_jobs: 0,
  draft_jobs: 0,
  closed_jobs: 0,
  expired_jobs: 0,
  closing_soon_jobs: 0,
  total_applicants: 0,
  pending: 0,
  screening: 0,
  shortlisted: 0,
  interview: 0,
  offered: 0,
  hired: 0,
  rejected: 0,
  withdrawn: 0,
  average_score: 0,
  high_match_applicants: 0,
  scheduled_interviews: 0,
  upcoming_interviews: 0,
  completed_interviews: 0,
  review_rate: 0,
}

const statusLabels = {
  pending: 'Pending',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

const statusTones = {
  pending: 'bg-amber-500',
  screening: 'bg-sky-500',
  shortlisted: 'bg-emerald-500',
  interview: 'bg-indigo-500',
  offered: 'bg-violet-500',
  hired: 'bg-teal-500',
  rejected: 'bg-red-500',
  withdrawn: 'bg-gray-400',
}

const chartColors = {
  pending: '#f59e0b',
  screening: '#0ea5e9',
  shortlisted: '#10b981',
  interview: '#6366f1',
  offered: '#8b5cf6',
  hired: '#14b8a6',
  rejected: '#ef4444',
  withdrawn: '#9ca3af',
  applied: '#4b5563',
  reviewed: '#0ea5e9',
  highMatch: '#10b981',
  reviewRange: '#f59e0b',
  lowMatch: '#ef4444',
  scorePending: '#9ca3af',
  applicants: '#4f46e5',
}

const interviewLabels = {
  scheduled: 'Scheduled',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
}

const interviewColors = {
  scheduled: '#6366f1',
  rescheduled: '#0ea5e9',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#f59e0b',
}

const rangeOptions = [
  { key: '7', label: '7D', helper: 'Last 7 days' },
  { key: '30', label: '30D', helper: 'Last 30 days' },
  { key: '90', label: '90D', helper: 'Last 90 days' },
  { key: 'all', label: 'All', helper: 'All time' },
]

const jobMetricOptions = [
  { key: 'totalApplicants', label: 'Applicants', color: '#4f46e5', suffix: '' },
  { key: 'avgScore', label: 'Avg match', color: '#10b981', suffix: '%' },
  { key: 'hired', label: 'Hired', color: '#14b8a6', suffix: '' },
]

const scoreNumber = (value) => Math.max(0, Math.min(100, Math.round(Number(value || 0))))

const percent = (value, total) => {
  if (!total) return 0
  return Math.round((Number(value || 0) / total) * 100)
}

const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const dayKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-')

const monthKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
].join('-')

const formatDate = (value) => {
  const date = value instanceof Date ? value : parseDate(value)
  if (!date) return 'Recently'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatMonth = (value) => {
  const date = value instanceof Date ? value : parseDate(value)
  if (!date) return 'Unknown'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

const isWithinRange = (value, range) => {
  if (range === 'all') return true

  const date = parseDate(value)
  if (!date) return false

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - Number(range) + 1)
  cutoff.setHours(0, 0, 0, 0)

  return date >= cutoff
}

const compactTitle = (value) => {
  const title = value || 'Untitled role'
  return title.length > 18 ? `${title.slice(0, 18)}...` : title
}

const candidateName = (application) => application?.job_seeker?.user?.name || 'Candidate'

const buildTrendData = (items, range) => {
  if (range === 'all') {
    const buckets = new Map()

    items.forEach((application) => {
      const date = parseDate(application.created_at)
      if (!date) return

      const key = monthKey(date)
      const current = buckets.get(key) || {
        key,
        label: formatMonth(date),
        sortDate: new Date(date.getFullYear(), date.getMonth(), 1),
        applicants: 0,
        highMatch: 0,
        hired: 0,
      }

      current.applicants += 1
      current.highMatch += scoreNumber(application.final_score) >= 70 ? 1 : 0
      current.hired += application.status === 'hired' ? 1 : 0
      buckets.set(key, current)
    })

    return Array.from(buckets.values())
      .sort((a, b) => a.sortDate - b.sortDate)
      .map((item) => ({
        key: item.key,
        label: item.label,
        applicants: item.applicants,
        highMatch: item.highMatch,
        hired: item.hired,
      }))
  }

  const days = Number(range)
  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)

  const buckets = new Map()

  Array.from({ length: days }).forEach((_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    buckets.set(dayKey(date), {
      key: dayKey(date),
      label: formatDate(date),
      applicants: 0,
      highMatch: 0,
      hired: 0,
    })
  })

  items.forEach((application) => {
    const date = parseDate(application.created_at)
    if (!date) return

    const key = dayKey(date)
    const current = buckets.get(key)
    if (!current) return

    current.applicants += 1
    current.highMatch += scoreNumber(application.final_score) >= 70 ? 1 : 0
    current.hired += application.status === 'hired' ? 1 : 0
  })

  return Array.from(buckets.values())
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  const title = label || payload[0]?.payload?.name || payload[0]?.payload?.label

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-gray-900 mb-1">{title}</p>
      <div className="space-y-1">
        {payload
          .filter((item) => item.value !== undefined && item.value !== null)
          .map((item) => (
            <div key={`${item.name}-${item.dataKey}`} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color || item.payload?.color || item.fill }}
              />
              <span className="text-gray-500">{item.name}</span>
              <span className="font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

const SegmentedControl = ({ options, value, onChange, ariaLabel }) => (
  <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1" role="group" aria-label={ariaLabel}>
    {options.map((option) => {
      const active = option.key === value

      return (
        <button
          key={option.key}
          type="button"
          title={option.helper || option.label}
          onClick={() => onChange(option.key)}
          className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors ${
            active
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

const MetricCard = ({ label, value, helper, icon, tone }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    <p className="text-xs text-gray-400 mt-2">{helper}</p>
  </div>
)

const ChartPanel = ({ title, helper, icon, action, children, className = '' }) => (
  <section className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
    <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        {helper && <p className="text-sm text-gray-500 mt-1">{helper}</p>}
      </div>
      {action || <div className="text-indigo-500">{icon}</div>}
    </div>
    {children}
  </section>
)

const EmptyChart = ({ icon, title, helper }) => (
  <div className="h-64 flex flex-col items-center justify-center text-center px-6">
    <div className="w-11 h-11 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
      {icon}
    </div>
    <p className="font-semibold text-gray-900">{title}</p>
    {helper && <p className="text-sm text-gray-500 mt-1">{helper}</p>}
  </div>
)

const LoadingChart = () => (
  <div className="p-5">
    <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
  </div>
)

const LegendList = ({ items, total }) => (
  <div className="grid grid-cols-2 gap-2">
    {items.map((item) => (
      <div key={item.key || item.name} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-xs font-semibold text-gray-600 truncate">{item.name}</span>
        </div>
        <span className="text-xs font-bold text-gray-900">{percent(item.value, total)}%</span>
      </div>
    ))}
  </div>
)

const CompanyAnalytics = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(initialStats)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('all')
  const [jobMetric, setJobMetric] = useState('totalApplicants')

  useEffect(() => {
    let active = true

    const loadAnalytics = async () => {
      setLoading(true)
      try {
        const [dashboardRes, jobsRes, applicantsRes] = await Promise.all([
          api.get('/dashboard/company'),
          api.get('/my-jobs'),
          api.get('/company/applicants'),
        ])

        if (!active) return

        setStats({ ...initialStats, ...(dashboardRes.data?.stats || {}) })
        setJobs(jobsRes.data || [])
        setApplications(applicantsRes.data || [])
      } catch (err) {
        if (active) toast.error(err.response?.data?.message || 'Failed to load company analytics')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAnalytics()

    return () => {
      active = false
    }
  }, [])

  const rangeLabel = rangeOptions.find((option) => option.key === range)?.helper || 'All time'

  const rangedApplications = useMemo(
    () => applications.filter((application) => isWithinRange(application.created_at, range)),
    [applications, range],
  )

  const rangeActiveApplications = useMemo(
    () => rangedApplications.filter((application) => application.status !== 'withdrawn'),
    [rangedApplications],
  )

  const applicantTotal = Math.max(rangeActiveApplications.length, 1)

  const reviewedCount = useMemo(
    () => rangeActiveApplications.filter((application) => application.status !== 'pending').length,
    [rangeActiveApplications],
  )

  const hiredCount = useMemo(
    () => rangeActiveApplications.filter((application) => application.status === 'hired').length,
    [rangeActiveApplications],
  )

  const scoredApplications = useMemo(
    () => rangeActiveApplications.filter((application) => Number(application.final_score || 0) > 0),
    [rangeActiveApplications],
  )

  const averageScore = scoredApplications.length
    ? Math.round(scoredApplications.reduce((sum, application) => sum + Number(application.final_score || 0), 0) / scoredApplications.length)
    : 0

  const highMatchCount = rangeActiveApplications.filter((application) => scoreNumber(application.final_score) >= 70).length

  const interviewCount = rangeActiveApplications.filter((application) => Boolean(application.interview_scheduled_at)).length
  const completedInterviewCount = rangeActiveApplications.filter((application) => application.interview_status === 'completed').length
  const upcomingInterviewCount = rangeActiveApplications.filter((application) => {
    const interviewDate = parseDate(application.interview_scheduled_at)
    return interviewDate && interviewDate >= new Date() && !['completed', 'cancelled', 'no_show'].includes(application.interview_status)
  }).length

  const pipeline = useMemo(() => ([
    'pending',
    'screening',
    'shortlisted',
    'interview',
    'offered',
    'hired',
    'rejected',
    'withdrawn',
  ].map((status) => ({
    key: status,
    name: statusLabels[status],
    value: rangedApplications.filter((application) => application.status === status).length,
    color: chartColors[status],
    tone: statusTones[status],
  }))), [rangedApplications])

  const pipelineTotal = Math.max(rangedApplications.length, 1)
  const visiblePipeline = pipeline.filter((item) => item.value > 0)

  const funnel = useMemo(() => {
    const total = rangeActiveApplications.length
    const reviewed = rangeActiveApplications.filter((application) => application.status !== 'pending').length

    return [
      { key: 'applied', name: 'Applied', value: total, color: chartColors.applied },
      { key: 'reviewed', name: 'Reviewed', value: reviewed, color: chartColors.reviewed },
      {
        key: 'shortlisted',
        name: 'Shortlisted',
        value: rangeActiveApplications.filter((application) => ['shortlisted', 'interview', 'offered', 'hired'].includes(application.status)).length,
        color: chartColors.shortlisted,
      },
      {
        key: 'interview',
        name: 'Interview',
        value: rangeActiveApplications.filter((application) => ['interview', 'offered', 'hired'].includes(application.status)).length,
        color: chartColors.interview,
      },
      {
        key: 'offered',
        name: 'Offer',
        value: rangeActiveApplications.filter((application) => ['offered', 'hired'].includes(application.status)).length,
        color: chartColors.offered,
      },
      { key: 'hired', name: 'Hired', value: hiredCount, color: chartColors.hired },
    ]
  }, [hiredCount, rangeActiveApplications])

  const scoreBands = useMemo(() => {
    const high = rangeActiveApplications.filter((application) => scoreNumber(application.final_score) >= 70).length
    const medium = rangeActiveApplications.filter((application) => {
      const score = scoreNumber(application.final_score)
      return score >= 40 && score < 70
    }).length
    const low = rangeActiveApplications.filter((application) => {
      const score = scoreNumber(application.final_score)
      return score > 0 && score < 40
    }).length
    const pending = rangeActiveApplications.filter((application) => scoreNumber(application.final_score) <= 0).length

    return [
      { key: 'high', name: 'High match', value: high, color: chartColors.highMatch },
      { key: 'medium', name: 'Review range', value: medium, color: chartColors.reviewRange },
      { key: 'low', name: 'Low match', value: low, color: chartColors.lowMatch },
      { key: 'pending', name: 'Score pending', value: pending, color: chartColors.scorePending },
    ]
  }, [rangeActiveApplications])

  const interviewOutcomes = useMemo(() => {
    const interviews = rangeActiveApplications.filter((application) => Boolean(application.interview_scheduled_at))

    return ['scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show'].map((status) => ({
      key: status,
      name: interviewLabels[status],
      value: interviews.filter((application) => (application.interview_status || 'scheduled') === status).length,
      color: interviewColors[status],
    }))
  }, [rangeActiveApplications])

  const visibleInterviewOutcomes = interviewOutcomes.filter((item) => item.value > 0)
  const interviewTotal = Math.max(interviewOutcomes.reduce((sum, item) => sum + item.value, 0), 1)

  const trendData = useMemo(() => buildTrendData(applications, range), [applications, range])

  const jobPerformance = useMemo(() => jobs
    .map((job) => {
      const jobApplications = rangedApplications.filter((application) => Number(application.job_id) === Number(job.id))
      const scored = jobApplications.filter((application) => Number(application.final_score || 0) > 0)
      const avgScore = scored.length
        ? Math.round(scored.reduce((sum, application) => sum + Number(application.final_score || 0), 0) / scored.length)
        : 0
      const hired = jobApplications.filter((application) => application.status === 'hired').length

      return {
        ...job,
        name: compactTitle(job.title),
        totalApplicants: range === 'all'
          ? jobApplications.length || Number(job.applications_count || 0)
          : jobApplications.length,
        avgScore,
        hired,
        expired: isJobExpired(job),
      }
    })
    .sort((a, b) => b.totalApplicants - a.totalApplicants || b.avgScore - a.avgScore)
    .slice(0, 6), [jobs, range, rangedApplications])

  const selectedJobMetric = jobMetricOptions.find((option) => option.key === jobMetric) || jobMetricOptions[0]

  const recentHighMatches = useMemo(() => rangeActiveApplications
    .filter((application) => scoreNumber(application.final_score) >= 70)
    .sort((a, b) => scoreNumber(b.final_score) - scoreNumber(a.final_score))
    .slice(0, 5), [rangeActiveApplications])

  const cards = [
    {
      label: 'Hiring conversion',
      value: `${percent(hiredCount, rangeActiveApplications.length)}%`,
      helper: `${hiredCount} hired from ${rangeActiveApplications.length} applicants`,
      icon: <UserCheck className="w-5 h-5" />,
      tone: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Review rate',
      value: `${percent(reviewedCount, rangeActiveApplications.length)}%`,
      helper: `${rangeActiveApplications.length - reviewedCount} still pending`,
      icon: <ClipboardList className="w-5 h-5" />,
      tone: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Average match',
      value: `${averageScore}%`,
      helper: `${highMatchCount} high-match candidates`,
      icon: <Target className="w-5 h-5" />,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Interviews',
      value: interviewCount,
      helper: `${completedInterviewCount} completed, ${upcomingInterviewCount} upcoming`,
      icon: <Calendar className="w-5 h-5" />,
      tone: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Open roles',
      value: stats.accepting_jobs || stats.active_jobs || 0,
      helper: `${stats.closing_soon_jobs || 0} closing soon, ${stats.expired_jobs || 0} expired`,
      icon: <Briefcase className="w-5 h-5" />,
      tone: 'bg-indigo-50 text-indigo-600',
    },
  ]

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-1">Company analytics</p>
            <h1 className="text-2xl font-bold text-gray-900">Hiring Performance</h1>
            <p className="text-sm text-gray-500 mt-1">Pipeline movement, role performance, candidate quality, and interview results.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <SegmentedControl
              options={rangeOptions}
              value={range}
              onChange={setRange}
              ariaLabel="Analytics date range"
            />
            <div className="grid grid-cols-2 sm:flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/company/applicants')}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Applicants
              </button>
              <button
                type="button"
                onClick={() => navigate('/company/jobs?compose=1')}
                className="h-11 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Post job
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{rangeLabel} view</p>
              <p className="text-sm text-gray-600 mt-1">
                {rangeActiveApplications.length} active applications, {reviewedCount} reviewed, {highMatchCount} high-match candidates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/company/applicants')}
            className="h-10 px-4 rounded-xl bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-2"
          >
            Review pipeline
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
          {cards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={loading ? '-' : card.value}
              helper={loading ? 'Loading...' : card.helper}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-4 sm:gap-6">
          <ChartPanel
            title="Applications trend"
            helper={`${rangeLabel} application flow with high-match and hire signals.`}
            icon={<TrendingUp className="w-5 h-5" />}
            className="xl:col-span-2"
          >
            {loading ? (
              <LoadingChart />
            ) : trendData.length === 0 ? (
              <EmptyChart
                icon={<TrendingUp className="w-5 h-5" />}
                title="No application trend yet"
                helper="Applications will appear here after candidates apply."
              />
            ) : (
              <div className="p-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="applicants"
                        name="Applicants"
                        stroke={chartColors.applicants}
                        fill="url(#applicationsFill)"
                        strokeWidth={3}
                      />
                      <Line
                        type="monotone"
                        dataKey="highMatch"
                        name="High match"
                        stroke={chartColors.highMatch}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hired"
                        name="Hired"
                        stroke={chartColors.hired}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: 'Applicants', color: chartColors.applicants },
                    { label: 'High match', color: chartColors.highMatch },
                    { label: 'Hired', color: chartColors.hired },
                  ].map((item) => (
                    <span key={item.label} className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </ChartPanel>

          <ChartPanel
            title="Pipeline distribution"
            helper="Current applicant stages."
            icon={<BarChart3 className="w-5 h-5" />}
          >
            {loading ? (
              <LoadingChart />
            ) : visiblePipeline.length === 0 ? (
              <EmptyChart
                icon={<ClipboardList className="w-5 h-5" />}
                title="No pipeline data yet"
                helper="New applicants will be grouped by stage here."
              />
            ) : (
              <div className="p-5">
                <div className="relative h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visiblePipeline}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={86}
                        paddingAngle={2}
                      >
                        {visiblePipeline.map((item) => (
                          <Cell key={item.key} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{rangedApplications.length}</p>
                      <p className="text-xs font-semibold text-gray-400">Applicants</p>
                    </div>
                  </div>
                </div>
                <LegendList items={visiblePipeline} total={pipelineTotal} />
              </div>
            )}
          </ChartPanel>

          <ChartPanel
            title="Hiring funnel"
            helper="How candidates move from application to hire."
            icon={<TrendingUp className="w-5 h-5" />}
            className="xl:col-span-2"
          >
            {loading ? (
              <LoadingChart />
            ) : funnel.every((item) => item.value === 0) ? (
              <EmptyChart
                icon={<Users className="w-5 h-5" />}
                title="No funnel data yet"
                helper="Candidate progress will appear once applications arrive."
              />
            ) : (
              <div className="p-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 20, left: 16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 600 }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Candidates" radius={[0, 10, 10, 0]} barSize={20}>
                        {funnel.map((item) => (
                          <Cell key={item.key} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {funnel.map((item) => (
                    <div key={item.key} className="rounded-xl bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <p className="text-xs font-semibold text-gray-500">{item.name}</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
                      <p className="text-[11px] text-gray-400">{percent(item.value, funnel[0]?.value || 0)}% of applied</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartPanel>

          <ChartPanel
            title="Score quality"
            helper="Candidate match score bands."
            icon={<Target className="w-5 h-5" />}
          >
            {loading ? (
              <LoadingChart />
            ) : scoreBands.every((item) => item.value === 0) ? (
              <EmptyChart
                icon={<Target className="w-5 h-5" />}
                title="No score data yet"
                helper="AI match scores will appear after resumes are reviewed."
              />
            ) : (
              <div className="p-5">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreBands} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Candidates" radius={[10, 10, 0, 0]} barSize={34}>
                        {scoreBands.map((item) => (
                          <Cell key={item.key} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <LegendList items={scoreBands} total={applicantTotal} />
              </div>
            )}
          </ChartPanel>

          <ChartPanel
            title="Job performance"
            helper={`${selectedJobMetric.label} by open role.`}
            className="xl:col-span-2"
            action={(
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <SegmentedControl
                  options={jobMetricOptions}
                  value={jobMetric}
                  onChange={setJobMetric}
                  ariaLabel="Job performance metric"
                />
                <button
                  type="button"
                  onClick={() => navigate('/company/jobs')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-1"
                >
                  Jobs <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          >
            {loading ? (
              <LoadingChart />
            ) : jobPerformance.length === 0 ? (
              <EmptyChart
                icon={<Briefcase className="w-5 h-5" />}
                title="No jobs yet"
                helper="Post jobs to see performance analytics."
              />
            ) : (
              <div className="p-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobPerformance} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey={selectedJobMetric.key}
                        name={selectedJobMetric.label}
                        fill={selectedJobMetric.color}
                        radius={[10, 10, 0, 0]}
                        barSize={34}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="divide-y divide-gray-50 mt-3">
                  {jobPerformance.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                      className="w-full py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-gray-900 truncate">{job.title}</p>
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${
                              job.status === 'active' && !job.expired
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : job.status === 'draft'
                                  ? 'bg-gray-50 text-gray-600 border-gray-100'
                                  : 'bg-red-50 text-red-600 border-red-100'
                            }`}
                            >
                              {job.expired ? 'expired' : job.status || 'active'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{formatDeadline(job)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                          <div className="rounded-xl bg-gray-50 px-3 py-2 text-center">
                            <p className="font-bold text-gray-900">{job.totalApplicants}</p>
                            <p className="text-[11px] text-gray-500">Applicants</p>
                          </div>
                          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                            <p className="font-bold text-emerald-700">{job.avgScore}%</p>
                            <p className="text-[11px] text-emerald-700">Avg match</p>
                          </div>
                          <div className="rounded-xl bg-teal-50 px-3 py-2 text-center">
                            <p className="font-bold text-teal-700">{job.hired}</p>
                            <p className="text-[11px] text-teal-700">Hired</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ChartPanel>

          <ChartPanel
            title="Interview outcomes"
            helper="Scheduled interviews by result."
            icon={<Calendar className="w-5 h-5" />}
          >
            {loading ? (
              <LoadingChart />
            ) : visibleInterviewOutcomes.length === 0 ? (
              <EmptyChart
                icon={<Calendar className="w-5 h-5" />}
                title="No interview data yet"
                helper="Schedule interviews from applicant detail."
              />
            ) : (
              <div className="p-5">
                <div className="relative h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visibleInterviewOutcomes}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={54}
                        outerRadius={84}
                        paddingAngle={2}
                      >
                        {visibleInterviewOutcomes.map((item) => (
                          <Cell key={item.key} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{interviewTotal}</p>
                      <p className="text-xs font-semibold text-gray-400">Interviews</p>
                    </div>
                  </div>
                </div>
                <LegendList items={visibleInterviewOutcomes} total={interviewTotal} />
              </div>
            )}
          </ChartPanel>

          <ChartPanel
            title="High-match candidates"
            helper="Best candidates to review next."
            className="xl:col-span-2"
            action={(
              <button
                type="button"
                onClick={() => navigate('/company/applicants')}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Review <ArrowRight className="w-4 h-4" />
              </button>
            )}
          >
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((item) => <div key={item} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
                </div>
              ) : recentHighMatches.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">No high-match candidates yet</p>
                  <p className="text-sm text-gray-500 mt-1">Candidates above 70% will appear here.</p>
                </div>
              ) : (
                recentHighMatches.map((application) => (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => navigate(`/company/jobs/${application.job_id}/applicants?application=${application.id}`)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                        {candidateName(application).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{candidateName(application)}</p>
                        <p className="text-sm text-gray-500 truncate">{application.job_posting?.title || 'Job application'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Applied {formatDate(application.created_at)}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center">
                        <p className="font-bold text-emerald-700">{scoreNumber(application.final_score)}%</p>
                        <p className="text-[11px] text-emerald-700">Match</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ChartPanel>

          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Quick actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Review pending applicants', path: '/company/applicants', icon: <Clock className="w-4 h-4" />, tone: 'bg-amber-50 text-amber-700' },
                { label: 'Compare candidates', path: '/company/applicants', icon: <Users className="w-4 h-4" />, tone: 'bg-violet-50 text-violet-700' },
                { label: 'Open interviews', path: '/company/interviews', icon: <Calendar className="w-4 h-4" />, tone: 'bg-indigo-50 text-indigo-700' },
                { label: 'Manage jobs', path: '/company/jobs', icon: <Briefcase className="w-4 h-4" />, tone: 'bg-sky-50 text-sky-700' },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="w-full rounded-xl border border-gray-100 px-3 py-3 text-left hover:border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.tone}`}>
                    {action.icon}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Hiring health</p>
              <p className="text-sm text-gray-500 mt-1">
                Keep pending reviews low, interview high-match candidates quickly, and close expired roles.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/company/jobs')}
            className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
          >
            Open jobs
          </button>
        </div>
      </div>
    </CompanyLayout>
  )
}

export default CompanyAnalytics
