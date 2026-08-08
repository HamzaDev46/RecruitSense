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
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'

const initialStats = {
  total_jobs: 0,
  active_jobs: 0,
  draft_jobs: 0,
  closed_jobs: 0,
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
    bar: 'bg-amber-500',
  },
  screening: {
    label: 'Screening',
    icon: <ClipboardList className="w-4 h-4" />,
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    bar: 'bg-sky-500',
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: <CheckCircle2 className="w-4 h-4" />,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-500',
  },
  interview: {
    label: 'Interview',
    icon: <Calendar className="w-4 h-4" />,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bar: 'bg-indigo-500',
  },
  offered: {
    label: 'Offered',
    icon: <UserCheck className="w-4 h-4" />,
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    bar: 'bg-violet-500',
  },
  hired: {
    label: 'Hired',
    icon: <UserCheck className="w-4 h-4" />,
    className: 'bg-teal-50 text-teal-700 border-teal-200',
    bar: 'bg-teal-500',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="w-4 h-4" />,
    className: 'bg-red-50 text-red-600 border-red-200',
    bar: 'bg-red-500',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: <XCircle className="w-4 h-4" />,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    bar: 'bg-gray-400',
  },
}

const statusBadge = (status) => {
  const meta = statusMeta[status] || statusMeta.pending

  return `px-3 py-1 rounded-full border text-xs font-semibold capitalize ${meta.className}`
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

const candidateName = (application) => application.job_seeker?.user?.name || 'Candidate'

const formatDate = (value) => {
  if (!value) return 'Recently'

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled'

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const percentage = (value, total) => {
  if (!total) return 0
  return Math.round((Number(value || 0) / total) * 100)
}

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

  const applicantTotal = Math.max(Number(stats.total_applicants || 0), 1)
  const hasApplicants = stats.total_applicants > 0

  const pipeline = useMemo(() => ([
    { key: 'pending', value: stats.pending },
    { key: 'screening', value: stats.screening },
    { key: 'shortlisted', value: stats.shortlisted },
    { key: 'interview', value: stats.interview },
    { key: 'offered', value: stats.offered },
    { key: 'hired', value: stats.hired },
    { key: 'rejected', value: stats.rejected },
    { key: 'withdrawn', value: stats.withdrawn },
  ]), [stats.hired, stats.interview, stats.offered, stats.pending, stats.rejected, stats.screening, stats.shortlisted, stats.withdrawn])

  const cards = [
    {
      label: 'Active jobs',
      value: stats.active_jobs,
      helper: `${stats.draft_jobs || 0} draft, ${stats.closed_jobs || 0} closed`,
      icon: <Briefcase className="w-5 h-5" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      path: '/company/jobs',
    },
    {
      label: 'Applicants',
      value: stats.total_applicants,
      helper: `${stats.today_applicants || 0} today`,
      icon: <Users className="w-5 h-5" />,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      path: '/company/applicants',
    },
    {
      label: 'Pending review',
      value: stats.pending,
      helper: `${stats.review_rate || 0}% reviewed`,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      path: '/company/applicants',
    },
    {
      label: 'Avg. match',
      value: `${Math.round(stats.average_score || 0)}%`,
      helper: `${stats.high_match_applicants || 0} high match`,
      icon: <Target className="w-5 h-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      path: '/company/applicants',
    },
    {
      label: 'Interviews',
      value: stats.scheduled_interviews,
      helper: `${stats.upcoming_interviews || 0} upcoming`,
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      path: '/company/applicants',
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
                Track jobs, review candidates, and move strong applicants through your hiring pipeline.
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
                className="h-11 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                Post job
              </button>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Needs attention</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '-' : stats.pending}</p>
              <p className="text-sm text-gray-500 mt-1">Applicants waiting for company review.</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">Strong candidates</p>
              <p className="text-2xl font-bold text-emerald-700 mt-2">{loading ? '-' : stats.high_match_applicants}</p>
              <p className="text-sm text-emerald-700/80 mt-1">Applicants with 70% or higher match.</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-700">Review progress</p>
              <p className="text-2xl font-bold text-indigo-700 mt-2">{loading ? '-' : `${stats.review_rate}%`}</p>
              <p className="text-sm text-indigo-700/80 mt-1">Applicants moved beyond pending review.</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-4">
              <p className="text-xs font-semibold uppercase text-violet-700">Upcoming interviews</p>
              <p className="text-2xl font-bold text-violet-700 mt-2">{loading ? '-' : stats.upcoming_interviews}</p>
              <p className="text-sm text-violet-700/80 mt-1">Scheduled interviews coming next.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {cards.map((card, index) => (
            <motion.button
              key={card.label}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all text-left"
            >
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color} mb-3`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-400 mt-2">{loading ? 'Loading...' : card.helper}</p>
            </motion.button>
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-4 sm:gap-6">
          <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-900">Recent applicants</h2>
                <p className="text-sm text-gray-500">Latest candidates across your jobs.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/company/applicants')}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : recentApplicants.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 mx-auto mb-3 flex items-center justify-center">
                  <ClipboardList className="w-7 h-7" />
                </div>
                <p className="font-semibold text-gray-900">No applicants yet</p>
                <p className="text-sm text-gray-500 mt-1">Post a job and applicants will appear here.</p>
                <button
                  type="button"
                  onClick={() => navigate('/company/jobs?compose=1')}
                  className="mt-4 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
                >
                  Post first job
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentApplicants.map((application) => {
                  const score = Math.round(application.final_score || 0)

                  return (
                    <div key={application.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center">
                          {candidateName(application).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{candidateName(application)}</p>
                          <p className="text-sm text-gray-500 truncate">{application.job_posting?.title || 'Job application'}</p>
                          <p className="text-xs text-gray-400 mt-1">Applied {formatDate(application.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className={statusBadge(application.status)}>
                          {application.status}
                        </span>
                        <div className="text-right min-w-16">
                          <p className={`text-lg font-bold ${scoreColor(score)}`}>
                            {score}%
                          </p>
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
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Hiring pipeline</h2>
                <p className="text-sm text-gray-500">Applicant status distribution.</p>
              </div>

              <div className="p-5 space-y-4">
                {pipeline.map((item) => {
                  const meta = statusMeta[item.key]
                  const valuePercent = percentage(item.value, applicantTotal)

                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${meta.className}`}>
                            {meta.icon}
                          </span>
                          {meta.label}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{loading ? '-' : item.value}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${meta.bar}`}
                          style={{ width: `${hasApplicants ? valuePercent : 0}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Upcoming interviews</h2>
                  <p className="text-sm text-gray-500">Scheduled candidate meetings.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/company/interviews')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </button>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : upcomingInterviews.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-300 mx-auto mb-3 flex items-center justify-center">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <p className="font-semibold text-gray-900">No interviews scheduled</p>
                  <p className="text-sm text-gray-500 mt-1">Shortlisted candidates can be scheduled from applicant detail.</p>
                </div>
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
                            <span className={statusBadge(application.status)}>
                              {application.status}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Jobs pipeline</h2>
                  <p className="text-sm text-gray-500">Open roles and applicants.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/company/jobs')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Manage
                </button>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 mx-auto mb-3 flex items-center justify-center">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <p className="font-semibold text-gray-900">No active jobs</p>
                  <button
                    type="button"
                    onClick={() => navigate('/company/jobs?compose=1')}
                    className="mt-3 text-sm font-semibold text-indigo-600"
                  >
                    Create first job
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-sm text-gray-500">{job.applications_count || 0} applicants</p>
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${jobStatusMeta[job.status] || jobStatusMeta.active}`}>
                              {job.status || 'active'}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <span className="rounded-lg bg-amber-50 text-amber-700 px-2 py-1">
                          {job.pending_applications_count || 0} pending
                        </span>
                        <span className="rounded-lg bg-sky-50 text-sky-700 px-2 py-1">
                          {job.screening_applications_count || 0} screening
                        </span>
                        <span className="rounded-lg bg-emerald-50 text-emerald-700 px-2 py-1">
                          {job.shortlisted_applications_count || 0} shortlisted
                        </span>
                        <span className="rounded-lg bg-indigo-50 text-indigo-700 px-2 py-1">
                          {job.interview_applications_count || 0} interview
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
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
            <p className="text-sm text-gray-500 mt-1">Create a new job with required skills for AI matching.</p>
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
            <p className="text-sm text-gray-500 mt-1">Move applicants through screening, interview, offer, and hiring stages.</p>
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

        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Hiring health</p>
              <p className="text-sm text-gray-500 mt-1">Keep pending reviews low and prioritize candidates with stronger match scores.</p>
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

export default CompanyDashboard
