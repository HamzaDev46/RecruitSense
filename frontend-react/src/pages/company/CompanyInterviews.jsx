import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  Search,
  Star,
  User,
  Video,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'

const dateFilterOptions = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
]

const statusFilterOptions = [
  { key: 'all', label: 'All status' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'rescheduled', label: 'Rescheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No show' },
]

const sortOptions = [
  { key: 'soonest', label: 'Soonest first' },
  { key: 'latest', label: 'Latest first' },
  { key: 'score', label: 'Best match' },
]

const modeLabels = {
  online: 'Online',
  phone: 'Phone call',
  onsite: 'On-site',
}

const statusMeta = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  screening: 'bg-sky-50 text-sky-700 border-sky-200',
  shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  interview: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  offered: 'bg-violet-50 text-violet-700 border-violet-200',
  hired: 'bg-teal-50 text-teal-700 border-teal-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  withdrawn: 'bg-gray-50 text-gray-600 border-gray-200',
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

const interviewStatusMeta = {
  scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  rescheduled: 'bg-violet-50 text-violet-700 border-violet-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
  no_show: 'bg-amber-50 text-amber-700 border-amber-100',
}

const interviewStatusLabel = (status) => ({
  scheduled: 'Scheduled',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
}[status] || 'Scheduled')

const normalizedInterviewStatus = (application) => application?.interview_status || 'scheduled'

const isExternalUrl = (value) => /^https?:\/\//i.test(String(value || '').trim())

const candidateName = (application) => application?.job_seeker?.user?.name || 'Candidate'

const initials = (name) => String(name || 'C')
  .split(' ')
  .map((part) => part.charAt(0))
  .join('')
  .slice(0, 2)
  .toUpperCase()

const scoreNumber = (value) => Math.max(0, Math.min(100, Math.round(Number(value || 0))))

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled'

  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const dateTimeInputValue = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
  return localDate.toISOString().slice(0, 16)
}

const sameDay = (left, right) => left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const scoreTone = (score) => {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-100'
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-100'
  return 'text-red-500 bg-red-50 border-red-100'
}

const CompanyInterviews = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetApplicationId = Number(searchParams.get('application') || 0)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState(targetApplicationId ? 'all' : 'upcoming')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('soonest')
  const [expandedId, setExpandedId] = useState(targetApplicationId || null)
  const [interviewModal, setInterviewModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const effectiveDateFilter = targetApplicationId ? 'all' : dateFilter

  const syncApplication = (applicationId, updatedApplication) => {
    setApplications((current) => current.map((application) => (
      Number(application.id) === Number(applicationId)
        ? { ...application, ...updatedApplication }
        : application
    )))
  }

  useEffect(() => {
    const loadInterviews = async () => {
      setLoading(true)
      try {
        const res = await api.get('/company/applicants')
        setApplications(res.data || [])
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load interviews')
      } finally {
        setLoading(false)
      }
    }

    loadInterviews()
  }, [])

  const interviews = useMemo(() => applications
    .filter((application) => Boolean(application.interview_scheduled_at))
    .sort((a, b) => new Date(a.interview_scheduled_at) - new Date(b.interview_scheduled_at)), [applications])

  const targetInterview = useMemo(
    () => interviews.find((application) => Number(application.id) === targetApplicationId) || null,
    [interviews, targetApplicationId]
  )

  const targetApplication = useMemo(
    () => applications.find((application) => Number(application.id) === targetApplicationId) || null,
    [applications, targetApplicationId]
  )

  const stats = useMemo(() => {
    const now = new Date()
    const ready = applications.filter((application) => (
      !application.interview_scheduled_at &&
      !['withdrawn', 'rejected', 'hired'].includes(application.status)
    )).length

    return {
      total: interviews.length,
      today: interviews.filter((application) => sameDay(new Date(application.interview_scheduled_at), now)).length,
      upcoming: interviews.filter((application) => new Date(application.interview_scheduled_at) >= now).length,
      past: interviews.filter((application) => new Date(application.interview_scheduled_at) < now).length,
      completed: interviews.filter((application) => normalizedInterviewStatus(application) === 'completed').length,
      ready,
    }
  }, [applications, interviews])

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase()
    const now = new Date()

    return interviews
      .filter((application) => {
        const scheduledAt = new Date(application.interview_scheduled_at)
        const matchesDate = effectiveDateFilter === 'all' ||
          (effectiveDateFilter === 'today' && sameDay(scheduledAt, now)) ||
          (effectiveDateFilter === 'upcoming' && scheduledAt >= now) ||
          (effectiveDateFilter === 'past' && scheduledAt < now)
        const matchesStatus = statusFilter === 'all' ||
          normalizedInterviewStatus(application) === statusFilter
        const matchesSearch = !query || [
          candidateName(application),
          application.job_posting?.title,
          application.interview_mode,
          application.interview_location,
          application.interview_status,
          application.interview_feedback,
          application.status,
        ].some((value) => String(value || '').toLowerCase().includes(query))

        return matchesDate && matchesStatus && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'score') return scoreNumber(b.final_score) - scoreNumber(a.final_score)

        const left = new Date(a.interview_scheduled_at)
        const right = new Date(b.interview_scheduled_at)
        return sortBy === 'latest' ? right - left : left - right
      })
  }, [effectiveDateFilter, interviews, search, sortBy, statusFilter])

  const readyCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()

    return applications
      .filter((application) => (
        !application.interview_scheduled_at &&
        !['withdrawn', 'rejected', 'hired'].includes(application.status)
      ))
      .filter((application) => !query || [
        candidateName(application),
        application.job_posting?.title,
        application.status,
      ].some((value) => String(value || '').toLowerCase().includes(query)))
      .sort((a, b) => scoreNumber(b.final_score) - scoreNumber(a.final_score))
      .slice(0, 6)
  }, [applications, search])

  useEffect(() => {
    if (loading || !targetApplicationId) return

    const timer = window.setTimeout(() => {
      document.getElementById(`interview-${targetApplicationId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [filteredInterviews.length, loading, targetApplicationId])

  const applyStatFilter = (nextDateFilter, nextStatusFilter = 'all') => {
    setDateFilter(nextDateFilter)
    setStatusFilter(nextStatusFilter)
  }

  const copyInterviewDetails = async (application) => {
    const details = [
      `${candidateName(application)} - ${application.job_posting?.title || 'Job application'}`,
      formatDateTime(application.interview_scheduled_at),
      modeLabels[application.interview_mode] || 'Interview',
      application.interview_location || '',
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(details)
      toast.success('Interview details copied')
    } catch {
      toast.error('Could not copy interview details')
    }
  }

  const openMeetingLink = (application) => {
    if (!isExternalUrl(application.interview_location)) {
      toast.error('Meeting link is not available')
      return
    }

    window.open(application.interview_location, '_blank', 'noopener,noreferrer')
  }

  const openInterview = (application) => {
    setInterviewModal({
      application,
      scheduledAt: dateTimeInputValue(application.interview_scheduled_at),
      mode: application.interview_mode || 'online',
      location: application.interview_location || '',
      notes: application.interview_notes || '',
    })
  }

  const closeInterview = () => {
    if (actionLoading === 'interview') return
    setInterviewModal(null)
  }

  const saveInterview = async (event) => {
    event.preventDefault()
    if (!interviewModal?.application) return

    if (!interviewModal.scheduledAt) {
      toast.error('Select interview date and time')
      return
    }

    setActionLoading('interview')
    try {
      const res = await api.post(`/applications/${interviewModal.application.id}/interview`, {
        interview_scheduled_at: new Date(interviewModal.scheduledAt).toISOString(),
        interview_mode: interviewModal.mode,
        interview_location: interviewModal.location,
        interview_notes: interviewModal.notes,
      })
      const updatedApplication = res.data.application || {}

      syncApplication(interviewModal.application.id, updatedApplication)
      setDateFilter('upcoming')
      setStatusFilter('all')
      setExpandedId(interviewModal.application.id)
      setInterviewModal(null)
      toast.success(res.data.message || 'Interview scheduled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule interview')
    } finally {
      setActionLoading(null)
    }
  }

  const statCards = [
    {
      label: 'Total interviews',
      value: stats.total,
      tone: 'text-gray-900',
      eyebrow: 'text-gray-400',
      onClick: () => applyStatFilter('all'),
    },
    {
      label: 'Today',
      value: stats.today,
      tone: 'text-violet-600',
      eyebrow: 'text-violet-600',
      onClick: () => applyStatFilter('today'),
    },
    {
      label: 'Upcoming',
      value: stats.upcoming,
      tone: 'text-emerald-600',
      eyebrow: 'text-emerald-600',
      onClick: () => applyStatFilter('upcoming'),
    },
    {
      label: 'Completed',
      value: stats.completed,
      tone: 'text-teal-600',
      eyebrow: 'text-teal-600',
      onClick: () => applyStatFilter('all', 'completed'),
    },
    {
      label: 'Ready to schedule',
      value: stats.ready,
      tone: 'text-amber-600',
      eyebrow: 'text-amber-600',
      onClick: () => {
        setSearch('')
        window.setTimeout(() => {
          document.getElementById('ready-to-schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
      },
    },
  ]

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
            <p className="text-sm text-gray-500 mt-1">Track scheduled candidate interviews across all jobs.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/company/applicants')}
            className="h-11 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Open applicants
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {statCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <p className={`text-xs font-semibold uppercase ${card.eyebrow}`}>{card.label}</p>
              <p className={`text-2xl font-bold mt-2 ${card.tone}`}>{loading ? '-' : card.value}</p>
              <p className="text-xs text-gray-400 mt-2">Click to filter</p>
            </button>
          ))}
        </div>

        {!loading && targetApplicationId > 0 && !targetInterview && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-bold text-amber-900">No scheduled interview found for this application</p>
                <p className="text-sm text-amber-800 mt-1">
                  {targetApplication
                    ? 'This candidate application exists, but an interview has not been scheduled yet.'
                    : 'The application may have been removed or is no longer available.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/company/applicants${targetApplicationId ? `?application=${targetApplicationId}` : ''}`)}
                className="h-10 px-4 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
              >
                Open applicant
              </button>
            </div>
          </section>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 mb-5">
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidate, job, mode, location..."
                className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {dateFilterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDateFilter(option.key)}
                  className={`h-11 px-4 rounded-xl border text-sm font-semibold ${
                    effectiveDateFilter === option.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <label className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-9 text-sm font-semibold text-gray-600 outline-none hover:border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </label>
              <label className="relative">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-11 appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-9 text-sm font-semibold text-gray-600 outline-none hover:border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {sortOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </label>
            </div>
          </div>
        </div>

        <section id="ready-to-schedule" className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-900">Ready to schedule</h2>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading candidates...' : `${readyCandidates.length} candidate${readyCandidates.length === 1 ? '' : 's'} without interviews`}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>

          {loading ? (
            <div className="p-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : readyCandidates.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">No candidates waiting for interviews</p>
              <p className="text-sm text-gray-500 mt-1">Shortlisted or active candidates without interviews will appear here.</p>
            </div>
          ) : (
            <div className="p-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {readyCandidates.map((application) => {
                const score = scoreNumber(application.final_score)

                return (
                  <article key={application.id} className="rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {initials(candidateName(application))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 truncate">{candidateName(application)}</p>
                          <span className={`rounded-xl border px-2 py-1 text-xs font-bold ${scoreTone(score)}`}>
                            {score}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">{application.job_posting?.title || 'Job application'}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusMeta[application.status] || statusMeta.pending}`}>
                            {statusLabels[application.status] || application.status || 'Pending'}
                          </span>
                          {score >= 70 && (
                            <span className="px-2.5 py-1 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-bold">
                              High match
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openInterview(application)}
                        className="h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/company/jobs/${application.job_id}/applicants?application=${application.id}`)}
                        className="h-10 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
                      >
                        Review
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-900">Interview schedule</h2>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading interviews...' : `${filteredInterviews.length} interview${filteredInterviews.length === 1 ? '' : 's'} shown`}
              </p>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-300 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
              <p className="font-bold text-gray-900">No interviews found</p>
              <p className="text-sm text-gray-500 mt-1">Schedule interviews from an applicant detail page.</p>
              <button
                type="button"
                onClick={() => navigate('/company/applicants')}
                className="mt-4 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
              >
                Go to applicants
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredInterviews.map((application) => {
                const scheduledAt = new Date(application.interview_scheduled_at)
                const isPast = scheduledAt < new Date()
                const score = scoreNumber(application.final_score)
                const isTarget = Number(application.id) === targetApplicationId
                const isExpanded = Number(expandedId) === Number(application.id)
                const hasMeetingLink = isExternalUrl(application.interview_location)

                return (
                  <article
                    key={application.id}
                    id={`interview-${application.id}`}
                    className={`p-4 sm:p-5 transition hover:bg-gray-50 ${isTarget ? 'bg-indigo-50/70 ring-2 ring-inset ring-indigo-200' : ''}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                          {initials(candidateName(application))}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-900 truncate">{candidateName(application)}</h3>
                            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusMeta[application.status] || statusMeta.pending}`}>
                              {statusLabels[application.status] || application.status || 'Pending'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${interviewStatusMeta[application.interview_status || 'scheduled'] || interviewStatusMeta.scheduled}`}>
                              {interviewStatusLabel(application.interview_status)}
                            </span>
                            {isTarget && (
                              <span className="px-2.5 py-1 rounded-full border border-indigo-200 bg-white text-indigo-700 text-xs font-bold">
                                Opened from notification
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">{application.job_posting?.title || 'Job application'}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 text-xs font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDateTime(application.interview_scheduled_at)}
                            </span>
                            <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 text-xs font-semibold flex items-center gap-1">
                              <Video className="w-3.5 h-3.5" />
                              {modeLabels[application.interview_mode] || 'Interview'}
                            </span>
                            {application.interview_location && (
                              <span className="rounded-full bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1 text-xs font-semibold flex items-center gap-1 max-w-full">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{application.interview_location}</span>
                              </span>
                            )}
                          </div>
                          {(application.interview_rating || application.interview_feedback) && (
                            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Feedback saved
                                </span>
                                {application.interview_rating && (
                                  <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5" />
                                    {application.interview_rating}/5
                                  </span>
                                )}
                              </div>
                              {application.interview_feedback && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{application.interview_feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3">
                        <div className={`min-w-20 rounded-xl border px-3 py-2 text-center ${scoreTone(score)}`}>
                          <p className="text-lg font-bold">{score}%</p>
                          <p className="text-[11px] font-semibold">Match</p>
                        </div>
                        <span className={`min-w-20 rounded-xl px-3 py-2 text-center text-xs font-bold ${
                          isPast ? 'bg-gray-50 text-gray-500 border border-gray-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {isPast ? 'Past' : 'Upcoming'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : application.id)}
                          className="h-10 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
                        >
                          Details
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/company/jobs/${application.job_id}/applicants?application=${application.id}`)}
                          className="h-10 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 flex items-center justify-center gap-2"
                        >
                          Review
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="grid md:grid-cols-3 gap-3">
                          <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                            <p className="text-xs font-bold uppercase text-gray-400">Mode</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{modeLabels[application.interview_mode] || 'Interview'}</p>
                          </div>
                          <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                            <p className="text-xs font-bold uppercase text-gray-400">Status</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{interviewStatusLabel(application.interview_status)}</p>
                          </div>
                          <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                            <p className="text-xs font-bold uppercase text-gray-400">Candidate stage</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{statusLabels[application.status] || application.status || 'Pending'}</p>
                          </div>
                        </div>

                        {application.interview_location && (
                          <div className="mt-3 rounded-xl bg-white border border-gray-100 px-3 py-3">
                            <p className="text-xs font-bold uppercase text-gray-400">Meeting detail</p>
                            <p className="text-sm text-gray-700 mt-1 break-words">{application.interview_location}</p>
                          </div>
                        )}

                        {application.interview_notes && (
                          <div className="mt-3 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-3">
                            <p className="text-xs font-bold uppercase text-indigo-700">Interview notes</p>
                            <p className="text-sm text-indigo-900 mt-1 whitespace-pre-wrap">{application.interview_notes}</p>
                          </div>
                        )}

                        {application.interview_feedback && (
                          <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3">
                            <p className="text-xs font-bold uppercase text-emerald-700">Saved feedback</p>
                            <p className="text-sm text-emerald-900 mt-1 whitespace-pre-wrap">{application.interview_feedback}</p>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {hasMeetingLink && (
                            <button
                              type="button"
                              onClick={() => openMeetingLink(application)}
                              className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open link
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyInterviewDetails(application)}
                            className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-600 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy details
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/company/jobs/${application.job_id}/applicants?application=${application.id}`)}
                            className="h-10 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 flex items-center gap-2"
                          >
                            Review candidate
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {interviewModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/45 flex items-center justify-center px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Schedule interview</h2>
                    <p className="text-sm text-gray-500 mt-1">{candidateName(interviewModal.application)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeInterview}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Close interview form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveInterview} className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-800">Date and time</span>
                    <input
                      type="datetime-local"
                      value={interviewModal.scheduledAt}
                      onChange={(event) => setInterviewModal((current) => ({ ...current, scheduledAt: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-800">Interview mode</span>
                    <select
                      value={interviewModal.mode}
                      onChange={(event) => setInterviewModal((current) => ({ ...current, mode: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="online">Online</option>
                      <option value="phone">Phone call</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-800">
                    {interviewModal.mode === 'online' ? 'Meeting link' : interviewModal.mode === 'onsite' ? 'Office address' : 'Phone number'}
                  </span>
                  <input
                    value={interviewModal.location}
                    onChange={(event) => setInterviewModal((current) => ({ ...current, location: event.target.value }))}
                    placeholder={interviewModal.mode === 'online' ? 'Paste meeting link' : interviewModal.mode === 'onsite' ? 'Office location' : 'Contact number'}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-800">Candidate notes</span>
                  <textarea
                    rows={4}
                    value={interviewModal.notes}
                    onChange={(event) => setInterviewModal((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Add instructions, documents to bring, or preparation notes."
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </label>

                <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeInterview}
                    className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'interview'}
                    className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'interview' ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                    Save interview
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}

export default CompanyInterviews
