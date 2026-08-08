import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  HelpCircle,
  PlusCircle,
  Target,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'
import { formatDeadline, formatJobType, isJobExpired } from '../../utils/jobDetails'

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
  quiz_questions: 0,
  today_applicants: 0,
  high_match_applicants: 0,
  scheduled_interviews: 0,
  upcoming_interviews: 0,
  review_rate: 0,
}

const statusMeta = {
  pending: {
    label: 'Pending',
    icon: <Clock className="w-4 h-4" />,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  screening: {
    label: 'Screening',
    icon: <ClipboardList className="w-4 h-4" />,
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: <CheckCircle2 className="w-4 h-4" />,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  interview: {
    label: 'Interview',
    icon: <Calendar className="w-4 h-4" />,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  offered: {
    label: 'Offered',
    icon: <UserCheck className="w-4 h-4" />,
    className: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  hired: {
    label: 'Hired',
    icon: <UserCheck className="w-4 h-4" />,
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="w-4 h-4" />,
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: <XCircle className="w-4 h-4" />,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
}

const jobStatusMeta = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  closed: 'bg-red-50 text-red-600 border-red-200',
}

const scoreColor = (score) => {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-500'
}

const statusBadge = (status) => {
  const meta = statusMeta[status] || statusMeta.pending

  return `inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold capitalize ${meta.className}`
}

const candidateName = (application) => application.job_seeker?.user?.name || 'Candidate'

const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value) => {
  const date = parseDate(value)
  if (!date) return 'Recently'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatDateTime = (value) => {
  const date = parseDate(value)
  if (!date) return 'Not scheduled'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const scoreValue = (application) => Math.max(0, Math.min(100, Math.round(Number(application?.final_score || 0))))

const isToday = (value) => {
  const date = parseDate(value)
  if (!date) return false

  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

const daysUntilDeadline = (job) => {
  const date = parseDate(job?.application_deadline)
  if (!date) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  return Math.ceil((date - today) / 86400000)
}

const deadlineLabel = (job) => {
  const days = daysUntilDeadline(job)

  if (isJobExpired(job)) return 'Deadline passed'
  if (days === null) return 'No deadline'
  if (days === 0) return 'Deadline today'
  if (days === 1) return '1 day left'
  if (days <= 7) return `${days} days left`

  return formatDeadline(job)
}

const deadlineTone = (job) => {
  const days = daysUntilDeadline(job)

  if (isJobExpired(job)) return 'bg-red-50 text-red-600 border-red-100'
  if (days !== null && days <= 7) return 'bg-amber-50 text-amber-700 border-amber-100'
  return 'bg-gray-50 text-gray-600 border-gray-100'
}

const reviewReason = (application) => {
  if (application.status === 'pending') return 'Needs review'
  if (scoreValue(application) >= 70) return 'High match'
  if (application.status === 'shortlisted') return 'Ready for interview'
  if (application.status === 'interview') return 'Interview stage'

  return 'Recently updated'
}

const LoadingRows = ({ count = 3, height = 'h-20' }) => (
  <div className="p-5 space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className={`${height} rounded-xl bg-gray-100 animate-pulse`} />
    ))}
  </div>
)

const EmptyState = ({ icon, title, helper, actionLabel, onAction }) => (
  <div className="p-8 text-center">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 mx-auto mb-3 flex items-center justify-center">
      {icon}
    </div>
    <p className="font-semibold text-gray-900">{title}</p>
    {helper && <p className="text-sm text-gray-500 mt-1">{helper}</p>}
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
      >
        {actionLabel}
      </button>
    )}
  </div>
)

const SectionHeader = ({ title, helper, actionLabel, onAction }) => (
  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
    <div>
      <h2 className="font-bold text-gray-900">{title}</h2>
      {helper && <p className="text-sm text-gray-500 mt-1">{helper}</p>}
    </div>
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
      >
        {actionLabel}
        <ArrowRight className="w-4 h-4" />
      </button>
    )}
  </div>
)

const PriorityCard = ({ item, loading, index, onClick }) => (
  <motion.button
    type="button"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={onClick}
    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all text-left"
  >
    <div className="flex items-start justify-between gap-3">
      <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center ${item.color}`}>
        {item.icon}
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 mt-1" />
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-4">{loading ? '-' : item.value}</p>
    <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.label}</p>
    <p className="text-xs text-gray-400 mt-2">{loading ? 'Loading...' : item.helper}</p>
  </motion.button>
)

const ShortcutButton = ({ icon, label, helper, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-xl border border-gray-100 px-3 py-3 text-left hover:border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center gap-3"
  >
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-gray-800 truncate">{label}</span>
      <span className="block text-xs text-gray-400 truncate">{helper}</span>
    </span>
  </button>
)

const CompanyDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(initialStats)
  const [company, setCompany] = useState(null)
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApplicants, setRecentApplicants] = useState([])
  const [upcomingInterviews, setUpcomingInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get('/dashboard/company')
        setCompany(res.data.company || null)
        setStats({ ...initialStats, ...(res.data.stats || {}) })
        setRecentJobs(res.data.recent_jobs || [])
        setRecentApplicants(res.data.recent_applicants || [])
        setUpcomingInterviews(res.data.upcoming_interviews || [])
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load company dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const interviewsToday = useMemo(
    () => upcomingInterviews.filter((application) => isToday(application.interview_scheduled_at)).length,
    [upcomingInterviews],
  )

  const reviewQueue = useMemo(() => [...recentApplicants]
    .sort((a, b) => {
      const aPriority = (a.status === 'pending' ? 50 : 0) + (scoreValue(a) >= 70 ? 30 : 0)
      const bPriority = (b.status === 'pending' ? 50 : 0) + (scoreValue(b) >= 70 ? 30 : 0)

      if (aPriority !== bPriority) return bPriority - aPriority
      return (parseDate(b.created_at)?.getTime() || 0) - (parseDate(a.created_at)?.getTime() || 0)
    })
    .slice(0, 5), [recentApplicants])

  const jobsNeedingAttention = useMemo(() => recentJobs
    .map((job) => {
      const daysLeft = daysUntilDeadline(job)
      const pendingCount = Number(job.pending_applications_count || 0)
      const expired = isJobExpired(job)
      const closingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
      const draft = job.status === 'draft'
      const priority = (expired ? 80 : 0) + (closingSoon ? 40 : 0) + (pendingCount > 0 ? 30 : 0) + (draft ? 20 : 0)

      return {
        ...job,
        daysLeft,
        pendingCount,
        expired,
        closingSoon,
        draft,
        priority,
      }
    })
    .filter((job) => job.priority > 0)
    .sort((a, b) => b.priority - a.priority || b.pendingCount - a.pendingCount)
    .slice(0, 5), [recentJobs])

  const priorityCards = [
    {
      label: 'Pending review',
      value: stats.pending,
      helper: `${stats.review_rate || 0}% reviewed overall`,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      path: '/company/applicants',
    },
    {
      label: 'Interviews next',
      value: stats.upcoming_interviews,
      helper: `${interviewsToday} scheduled today`,
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      path: '/company/interviews',
    },
    {
      label: 'Job deadlines',
      value: Number(stats.closing_soon_jobs || 0) + Number(stats.expired_jobs || 0),
      helper: `${stats.closing_soon_jobs || 0} closing soon, ${stats.expired_jobs || 0} expired`,
      icon: <Briefcase className="w-5 h-5" />,
      color: 'text-red-600',
      bg: 'bg-red-50',
      path: '/company/jobs',
    },
    {
      label: 'Strong matches',
      value: stats.high_match_applicants,
      helper: `${stats.today_applicants || 0} new applicants today`,
      icon: <Target className="w-5 h-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      path: '/company/applicants',
    },
  ]

  const checklist = [
    {
      label: `${stats.pending || 0} pending applicants`,
      helper: 'Clear the review queue',
      done: Number(stats.pending || 0) === 0,
      path: '/company/applicants',
    },
    {
      label: `${stats.upcoming_interviews || 0} upcoming interviews`,
      helper: 'Confirm candidate meetings',
      done: Number(stats.upcoming_interviews || 0) === 0,
      path: '/company/interviews',
    },
    {
      label: `${stats.expired_jobs || 0} expired jobs`,
      helper: 'Close or refresh old roles',
      done: Number(stats.expired_jobs || 0) === 0,
      path: '/company/jobs',
    },
    {
      label: `${stats.quiz_questions || 0} quiz questions`,
      helper: 'Keep screening questions ready',
      done: Number(stats.quiz_questions || 0) > 0,
      path: '/company/quiz',
    },
  ]

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-1">Company dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{company?.name || 'Dashboard'}</h1>
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                Today&apos;s hiring workspace for reviews, interviews, deadlines, and quick follow-ups.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/company/applicants')}
                className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                Review
              </button>
              <button
                type="button"
                onClick={() => navigate('/company/jobs?compose=1')}
                className="h-11 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Post job
              </button>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-700">Next action</p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {loading ? 'Loading...' : stats.pending > 0 ? 'Review pending candidates' : 'Pipeline is clear'}
              </p>
              <p className="text-sm text-amber-700/80 mt-1">{loading ? 'Checking your hiring queue.' : `${stats.pending || 0} candidates waiting.`}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">Best opportunity</p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {loading ? 'Loading...' : `${stats.high_match_applicants || 0} strong matches`}
              </p>
              <p className="text-sm text-emerald-700/80 mt-1">Prioritize candidates above 70% match.</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-4">
              <p className="text-xs font-semibold uppercase text-violet-700">Schedule</p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {loading ? 'Loading...' : `${stats.upcoming_interviews || 0} upcoming interviews`}
              </p>
              <p className="text-sm text-violet-700/80 mt-1">{interviewsToday} candidate meetings today.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {priorityCards.map((card, index) => (
            <PriorityCard
              key={card.label}
              item={card}
              loading={loading}
              index={index}
              onClick={() => navigate(card.path)}
            />
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-4 sm:gap-6">
          <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <SectionHeader
              title="Review queue"
              helper="Candidates that need the next hiring decision."
              actionLabel="View all"
              onAction={() => navigate('/company/applicants')}
            />

            {loading ? (
              <LoadingRows count={4} />
            ) : reviewQueue.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="w-7 h-7" />}
                title="No applicants yet"
                helper="Post a job and candidate reviews will appear here."
                actionLabel="Post first job"
                onAction={() => navigate('/company/jobs?compose=1')}
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {reviewQueue.map((application) => {
                  const score = scoreValue(application)
                  const meta = statusMeta[application.status] || statusMeta.pending

                  return (
                    <div key={application.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                          {candidateName(application).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">{candidateName(application)}</p>
                            <span className="rounded-full bg-gray-50 border border-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                              {reviewReason(application)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{application.job_posting?.title || 'Job application'}</p>
                          <p className="text-xs text-gray-400 mt-1">Applied {formatDate(application.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className={statusBadge(application.status)}>
                          {meta.icon}
                          {meta.label}
                        </span>
                        <div className="text-right min-w-16">
                          <p className={`text-lg font-bold ${scoreColor(score)}`}>{score}%</p>
                          <p className="text-xs text-gray-400">Match</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/company/jobs/${application.job_id}/applicants?application=${application.id}`)}
                          className="h-9 px-3 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <div className="space-y-4 sm:space-y-6">
            <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <SectionHeader
                title="Upcoming interviews"
                helper="Candidate meetings coming next."
                actionLabel="Open"
                onAction={() => navigate('/company/interviews')}
              />

              {loading ? (
                <LoadingRows count={2} height="h-16" />
              ) : upcomingInterviews.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-7 h-7" />}
                  title="No interviews scheduled"
                  helper="Move shortlisted candidates into interview when ready."
                />
              ) : (
                <div className="divide-y divide-gray-50">
                  {upcomingInterviews.map((application) => (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => navigate(`/company/jobs/${application.job_id}/applicants?application=${application.id}`)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{candidateName(application)}</p>
                          <p className="text-sm text-gray-500 truncate">{application.job_posting?.title || 'Job application'}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 text-xs font-semibold">
                              {formatDateTime(application.interview_scheduled_at)}
                            </span>
                            {isToday(application.interview_scheduled_at) && (
                              <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 text-xs font-semibold">
                                Today
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Quick actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'Review applicants', helper: `${stats.pending || 0} pending`, path: '/company/applicants', icon: <ClipboardList className="w-4 h-4" />, tone: 'bg-amber-50 text-amber-700' },
                  { label: 'Post a job', helper: `${stats.accepting_jobs || 0} accepting applications`, path: '/company/jobs?compose=1', icon: <PlusCircle className="w-4 h-4" />, tone: 'bg-indigo-50 text-indigo-700' },
                  { label: 'Compare candidates', helper: `${stats.high_match_applicants || 0} strong matches`, path: '/company/applicants', icon: <Users className="w-4 h-4" />, tone: 'bg-emerald-50 text-emerald-700' },
                  { label: 'View analytics', helper: 'Open reports and charts', path: '/company/analytics', icon: <Target className="w-4 h-4" />, tone: 'bg-sky-50 text-sky-700' },
                ].map((action) => (
                  <ShortcutButton
                    key={action.label}
                    icon={action.icon}
                    label={action.label}
                    helper={action.helper}
                    tone={action.tone}
                    onClick={() => navigate(action.path)}
                  />
                ))}
              </div>
            </section>
          </div>

          <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <SectionHeader
              title="Jobs needing attention"
              helper="Roles with pending candidates, drafts, or deadline risk."
              actionLabel="Manage"
              onAction={() => navigate('/company/jobs')}
            />

            {loading ? (
              <LoadingRows count={3} />
            ) : jobsNeedingAttention.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="w-7 h-7" />}
                title="No urgent job updates"
                helper="Your recent jobs do not need immediate changes."
                actionLabel="Open jobs"
                onAction={() => navigate('/company/jobs')}
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {jobsNeedingAttention.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                    className="w-full p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{job.title}</p>
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${jobStatusMeta[job.status] || jobStatusMeta.active}`}>
                            {job.status || 'active'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${deadlineTone(job)}`}>
                            {deadlineLabel(job)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {job.location || 'Location not set'} · {formatJobType(job.job_type)}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                        <div className="rounded-xl bg-gray-50 px-3 py-2 text-center">
                          <p className="font-bold text-gray-900">{job.applications_count || 0}</p>
                          <p className="text-[11px] text-gray-500">Applicants</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
                          <p className="font-bold text-amber-700">{job.pendingCount}</p>
                          <p className="text-[11px] text-amber-700">Pending</p>
                        </div>
                        <div className="rounded-xl bg-indigo-50 px-3 py-2 text-center">
                          <p className="font-bold text-indigo-700">{job.interview_applications_count || 0}</p>
                          <p className="text-[11px] text-indigo-700">Interview</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Today&apos;s checklist</h2>
            <div className="space-y-3">
              {checklist.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-3 text-left hover:border-indigo-200 hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}
                  >
                    {item.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{item.helper}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate('/company/jobs?compose=1')}
            className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <PlusCircle className="w-5 h-5" />
            </div>
            <p className="font-bold text-gray-900">Post next role</p>
            <p className="text-sm text-gray-500 mt-1">Create a role with complete job details.</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/company/applicants')}
            className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="font-bold text-gray-900">Review candidates</p>
            <p className="text-sm text-gray-500 mt-1">Move applicants to screening, interview, offer, or hire.</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/company/quiz')}
            className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>
            <p className="font-bold text-gray-900">Quiz readiness</p>
            <p className="text-sm text-gray-500 mt-1">{stats.quiz_questions} soft-skill questions configured.</p>
          </button>
        </div>
      </div>
    </CompanyLayout>
  )
}

export default CompanyDashboard
