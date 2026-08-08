import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Star,
  User,
  Video,
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
  const effectiveDateFilter = targetApplicationId ? 'all' : dateFilter

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

    return {
      total: interviews.length,
      today: interviews.filter((application) => sameDay(new Date(application.interview_scheduled_at), now)).length,
      upcoming: interviews.filter((application) => new Date(application.interview_scheduled_at) >= now).length,
      past: interviews.filter((application) => new Date(application.interview_scheduled_at) < now).length,
      completed: interviews.filter((application) => application.interview_status === 'completed').length,
    }
  }, [interviews])

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase()
    const now = new Date()

    return interviews.filter((application) => {
      const scheduledAt = new Date(application.interview_scheduled_at)
      const matchesDate = effectiveDateFilter === 'all' ||
        (effectiveDateFilter === 'today' && sameDay(scheduledAt, now)) ||
        (effectiveDateFilter === 'upcoming' && scheduledAt >= now) ||
        (effectiveDateFilter === 'past' && scheduledAt < now)
      const matchesSearch = !query || [
        candidateName(application),
        application.job_posting?.title,
        application.interview_mode,
        application.interview_location,
        application.interview_status,
        application.interview_feedback,
        application.status,
      ].some((value) => String(value || '').toLowerCase().includes(query))

      return matchesDate && matchesSearch
    })
  }, [effectiveDateFilter, interviews, search])

  const nextInterview = filteredInterviews.find((application) => new Date(application.interview_scheduled_at) >= new Date()) ||
    filteredInterviews[0] ||
    null
  const featuredInterview = targetInterview || nextInterview

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase text-gray-400">Total interviews</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '-' : stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase text-violet-600">Today</p>
            <p className="text-2xl font-bold text-violet-600 mt-2">{loading ? '-' : stats.today}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-600">Upcoming</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{loading ? '-' : stats.upcoming}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase text-teal-600">Completed</p>
            <p className="text-2xl font-bold text-teal-600 mt-2">{loading ? '-' : stats.completed}</p>
          </div>
        </div>

        {featuredInterview && (
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 sm:p-6 text-white mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/75">
                    {targetInterview ? 'Selected interview' : 'Next interview'}
                  </p>
                  <h2 className="text-xl font-bold mt-1">{candidateName(featuredInterview)}</h2>
                  <p className="text-sm text-white/80 mt-1">{featuredInterview.job_posting?.title || 'Job application'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <p className="text-sm font-semibold">{formatDateTime(featuredInterview.interview_scheduled_at)}</p>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">
                      {interviewStatusLabel(featuredInterview.interview_status)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/company/jobs/${featuredInterview.job_id}/applicants?application=${featuredInterview.id}`)}
                className="h-11 px-4 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 flex items-center justify-center gap-2"
              >
                Review candidate
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

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
          <div className="flex flex-col lg:flex-row gap-3">
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
            </div>
          </div>
        </div>

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

                return (
                  <article
                    key={application.id}
                    id={`interview-${application.id}`}
                    className={`p-4 sm:p-5 transition ${isTarget ? 'bg-indigo-50/70 ring-2 ring-inset ring-indigo-200' : ''}`}
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

                      <div className="flex items-center justify-between lg:justify-end gap-3">
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
                          onClick={() => navigate(`/company/jobs/${application.job_id}/applicants?application=${application.id}`)}
                          className="h-10 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 flex items-center justify-center gap-2"
                        >
                          Review
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </CompanyLayout>
  )
}

export default CompanyInterviews
