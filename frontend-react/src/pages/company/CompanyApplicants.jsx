import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  Save,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'
import { formatDeadline, formatJobType, formatSalary, formatWorkMode } from '../../utils/jobDetails'

const pipelineStageOptions = [
  { key: 'pending', label: 'Pending' },
  { key: 'screening', label: 'Screening' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'offered', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
]

const statusOptions = [
  { key: 'all', label: 'All' },
  ...pipelineStageOptions,
  { key: 'withdrawn', label: 'Withdrawn' },
]

const terminalApplicationStatuses = ['rejected', 'withdrawn', 'hired']

const interviewStatusOptions = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'rescheduled', label: 'Rescheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No show' },
]

const scoreFilterOptions = [
  { key: 'all', label: 'All scores' },
  { key: 'high', label: 'High match 70%+' },
  { key: 'medium', label: 'Review 40-69%' },
  { key: 'low', label: 'Low match <40%' },
  { key: 'pending', label: 'Score pending' },
]

const readinessFilterOptions = [
  { key: 'all', label: 'All candidates' },
  { key: 'has_resume', label: 'Resume uploaded' },
  { key: 'no_resume', label: 'No resume' },
  { key: 'quiz_done', label: 'Quiz submitted' },
  { key: 'needs_quiz', label: 'Quiz pending' },
  { key: 'interview_scheduled', label: 'Interview scheduled' },
]

const sortOptions = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'score_desc', label: 'Highest match' },
  { key: 'score_asc', label: 'Lowest match' },
  { key: 'pending_first', label: 'Pending first' },
  { key: 'interviews_first', label: 'Interviews first' },
]

const applicantDetailTabs = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'resume', label: 'Resume & letter', icon: FileText },
  { key: 'quiz', label: 'Quiz & skills', icon: Sparkles },
  { key: 'pipeline', label: 'Pipeline', icon: ClipboardList },
  { key: 'timeline', label: 'Timeline', icon: ClipboardList },
]

const statusMeta = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  screening: {
    label: 'Screening',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  interview: {
    label: 'Interview',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  offered: {
    label: 'Offered',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
  hired: {
    label: 'Hired',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
}

const interviewStatusMeta = {
  scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  rescheduled: 'bg-violet-50 text-violet-700 border-violet-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
  no_show: 'bg-amber-50 text-amber-700 border-amber-100',
}

const scoreMeta = (score) => {
  if (score >= 70) {
    return {
      text: 'text-emerald-600',
      className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      bar: 'bg-emerald-500',
      label: 'Strong match',
    }
  }

  if (score >= 40) {
    return {
      text: 'text-amber-600',
      className: 'text-amber-600 bg-amber-50 border-amber-200',
      bar: 'bg-amber-500',
      label: 'Needs review',
    }
  }

  return {
    text: 'text-red-500',
    className: 'text-red-500 bg-red-50 border-red-200',
    bar: 'bg-red-500',
    label: 'Low match',
  }
}

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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const dateTimeInputValue = (value) => {
  if (!value) return ''

  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const interviewModeLabel = (mode) => ({
  online: 'Online',
  phone: 'Phone call',
  onsite: 'On-site',
}[mode] || 'Interview')

const statusLabel = (status) => statusMeta[status]?.label || 'Pending'
const interviewStatusLabel = (status) => interviewStatusOptions.find((option) => option.key === status)?.label || 'Scheduled'
const scoreNumber = (value) => Math.max(0, Math.min(100, Math.round(Number(value || 0))))
const candidateName = (application) => application?.job_seeker?.user?.name || 'Candidate'
const candidateEmail = (application) => application?.job_seeker?.user?.email || ''

const splitSkills = (skills) => String(skills || '')
  .split(',')
  .map((skill) => skill.trim())
  .filter(Boolean)

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`

const slug = (value) => String(value || 'applicants')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 60) || 'applicants'

const fileName = (path) => {
  if (!path) return 'No resume uploaded'
  return String(path).split('/').pop()
}

const resumeDownloadName = (application) => {
  const name = candidateName(application)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${name || 'candidate'}-resume.pdf`
}

const initials = (name) => String(name || 'C')
  .split(' ')
  .map((part) => part.charAt(0))
  .join('')
  .slice(0, 2)
  .toUpperCase()

const statusBadge = (status) => {
  const meta = statusMeta[status] || statusMeta.pending

  return `px-3 py-1 rounded-full border text-xs font-semibold capitalize ${meta.className}`
}

const ScoreBar = ({ label, value, weight }) => {
  const score = scoreNumber(value)
  const tone = scoreMeta(score)
  const contribution = Math.round((score * weight) / 100)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">Contributes {contribution}/{weight} points</p>
    </div>
  )
}

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
    <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value || 'Not provided'}</p>
    </div>
  </div>
)

const TimelineItem = ({ done, active, title, detail }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <span className={`w-8 h-8 rounded-full border flex items-center justify-center ${
        done
          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
          : active
            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
            : 'bg-gray-50 border-gray-200 text-gray-400'
      }`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </span>
      <span className="w-px flex-1 bg-gray-100 mt-2" />
    </div>
    <div className="pb-5">
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  </div>
)

const quickFactClasses = {
  emerald: {
    card: 'border-emerald-100 bg-emerald-50',
    icon: 'bg-white text-emerald-600 border-emerald-100',
    value: 'text-emerald-700',
  },
  amber: {
    card: 'border-amber-100 bg-amber-50',
    icon: 'bg-white text-amber-600 border-amber-100',
    value: 'text-amber-700',
  },
  red: {
    card: 'border-red-100 bg-red-50',
    icon: 'bg-white text-red-500 border-red-100',
    value: 'text-red-600',
  },
  indigo: {
    card: 'border-indigo-100 bg-indigo-50',
    icon: 'bg-white text-indigo-600 border-indigo-100',
    value: 'text-indigo-700',
  },
  sky: {
    card: 'border-sky-100 bg-sky-50',
    icon: 'bg-white text-sky-600 border-sky-100',
    value: 'text-sky-700',
  },
  gray: {
    card: 'border-gray-100 bg-gray-50',
    icon: 'bg-white text-gray-500 border-gray-100',
    value: 'text-gray-700',
  },
}

const QuickFact = ({ icon, label, value, detail, tone = 'gray' }) => {
  const classes = quickFactClasses[tone] || quickFactClasses.gray

  return (
    <div className={`rounded-2xl border p-4 min-h-[118px] ${classes.card}`}>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${classes.icon}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-1 break-words ${classes.value}`}>{value}</p>
      {detail && <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">{detail}</p>}
    </div>
  )
}

const insightClasses = {
  amber: 'border-amber-100 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  red: 'border-red-100 bg-red-50 text-red-700',
  indigo: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
  teal: 'border-teal-100 bg-teal-50 text-teal-700',
  violet: 'border-violet-100 bg-violet-50 text-violet-700',
  gray: 'border-gray-100 bg-gray-50 text-gray-700',
}

const applicationInsight = (application) => {
  if (!application) return null

  if (application.status === 'withdrawn') {
    const reason = application.withdraw_reason || application.withdrawal_reason

    return {
      tone: 'gray',
      icon: <XCircle className="w-5 h-5" />,
      title: 'Application withdrawn',
      detail: reason
        ? `Candidate reason: ${reason}`
        : 'Candidate removed this application from the company review pipeline.',
    }
  }

  if (application.status === 'rejected') {
    return {
      tone: 'red',
      icon: <XCircle className="w-5 h-5" />,
      title: 'Candidate rejected',
      detail: 'This application is closed. You can still view history, resume, quiz, and notes.',
    }
  }

  if (application.status === 'hired') {
    return {
      tone: 'teal',
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: 'Candidate hired',
      detail: 'This applicant has reached the final hired stage for this role.',
    }
  }

  if (application.status === 'offered') {
    return {
      tone: 'violet',
      icon: <Star className="w-5 h-5" />,
      title: 'Offer stage',
      detail: 'The candidate is ready for offer follow-up or final hiring confirmation.',
    }
  }

  if (application.interview_scheduled_at) {
    return {
      tone: 'indigo',
      icon: <Calendar className="w-5 h-5" />,
      title: 'Interview scheduled',
      detail: `${interviewModeLabel(application.interview_mode)} interview on ${formatDateTime(application.interview_scheduled_at)}.`,
    }
  }

  if (application.status === 'screening') {
    return {
      tone: 'sky',
      icon: <ClipboardList className="w-5 h-5" />,
      title: 'Screening in progress',
      detail: 'Use private notes, rating, and resume details to decide the next stage.',
    }
  }

  if (application.status === 'shortlisted') {
    return {
      tone: 'emerald',
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: 'Candidate shortlisted',
      detail: 'Next step: schedule an interview or message the candidate from this page.',
    }
  }

  return {
    tone: 'amber',
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Needs company review',
    detail: 'Review resume score, skill gaps, quiz responses, and cover letter before making a decision.',
  }
}

const StatusInsight = ({ insight }) => {
  if (!insight) return null

  return (
    <div className={`mt-5 rounded-2xl border px-4 py-3 flex items-start gap-3 ${insightClasses[insight.tone] || insightClasses.gray}`}>
      <div className="mt-0.5 flex-shrink-0">{insight.icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-bold">{insight.title}</p>
        <p className="text-sm mt-1 leading-relaxed break-words">{insight.detail}</p>
      </div>
    </div>
  )
}

const buildReviewForm = (application = null) => ({
  applicationId: application?.id || null,
  status: application?.status || 'pending',
  company_rating: application?.company_rating ? String(application.company_rating) : '',
  company_notes: application?.company_notes || '',
  interview_status: application?.interview_status || 'scheduled',
  interview_rating: application?.interview_rating ? String(application.interview_rating) : '',
  interview_feedback: application?.interview_feedback || '',
})

const CompanyApplicants = () => {
  const { jobId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [selectedId, setSelectedId] = useState(searchParams.get('application') ? Number(searchParams.get('application')) : null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [readinessFilter, setReadinessFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [detailTab, setDetailTab] = useState('overview')
  const [decision, setDecision] = useState(null)
  const [interviewModal, setInterviewModal] = useState(null)
  const [resumeAction, setResumeAction] = useState(null)
  const [reviewForm, setReviewForm] = useState(() => buildReviewForm())
  const [compareIds, setCompareIds] = useState([])
  const [showCompare, setShowCompare] = useState(false)

  useEffect(() => {
    const loadApplicants = async () => {
      setLoading(true)
      try {
        if (jobId) {
          const [jobRes, applicantsRes] = await Promise.all([
            api.get(`/jobs/${jobId}`),
            api.get(`/jobs/${jobId}/applicants`),
          ])
          setJob(jobRes.data || null)
          setApplications(applicantsRes.data || [])
        } else {
          const res = await api.get('/company/applicants')
          setJob(null)
          setApplications(res.data || [])
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load applicants')
      } finally {
        setLoading(false)
      }
    }

    loadApplicants()
  }, [jobId])

  const updateSearch = (value) => {
    const nextParams = new URLSearchParams(searchParams)
    const nextValue = value.trimStart()

    if (nextValue) {
      nextParams.set('search', nextValue)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams, { replace: true })
  }

  const statusCounts = useMemo(() => statusOptions.reduce((counts, status) => ({
    ...counts,
    [status.key]: status.key === 'all'
      ? applications.length
      : applications.filter((application) => application.status === status.key).length,
  }), {}), [applications])

  const averageMatch = useMemo(() => {
    if (!applications.length) return 0
    const total = applications.reduce((sum, application) => sum + Number(application.final_score || 0), 0)
    return Math.round(total / applications.length)
  }, [applications])

  const highMatchCount = useMemo(
    () => applications.filter((application) => Number(application.final_score || 0) >= 70).length,
    [applications],
  )

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase()

    const matchesScoreFilter = (application) => {
      const score = scoreNumber(application.final_score)

      if (scoreFilter === 'high') return score >= 70
      if (scoreFilter === 'medium') return score >= 40 && score < 70
      if (scoreFilter === 'low') return score > 0 && score < 40
      if (scoreFilter === 'pending') return score <= 0

      return true
    }

    const matchesReadinessFilter = (application) => {
      const hasResume = Boolean(application.job_seeker?.resume)
      const quizDone = Number(application.quiz_responses_count || application.quiz_responses?.length || 0) > 0
      const hasInterview = Boolean(application.interview_scheduled_at)

      if (readinessFilter === 'has_resume') return hasResume
      if (readinessFilter === 'no_resume') return !hasResume
      if (readinessFilter === 'quiz_done') return quizDone
      if (readinessFilter === 'needs_quiz') return !quizDone
      if (readinessFilter === 'interview_scheduled') return hasInterview

      return true
    }

    const filtered = applications.filter((application) => {
      const jobSeeker = application.job_seeker || {}
      const matchesStatus = statusFilter === 'all' || application.status === statusFilter
      const matchesSearch = !query || [
        candidateName(application),
        candidateEmail(application),
        application.job_posting?.title,
        jobSeeker.headline,
        jobSeeker.location,
        jobSeeker.company,
        jobSeeker.education,
        jobSeeker.skills,
      ].some((value) => String(value || '').toLowerCase().includes(query))

      return matchesStatus && matchesSearch && matchesScoreFilter(application) && matchesReadinessFilter(application)
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      }

      if (sortBy === 'score_desc') {
        return scoreNumber(b.final_score) - scoreNumber(a.final_score)
      }

      if (sortBy === 'score_asc') {
        return scoreNumber(a.final_score) - scoreNumber(b.final_score)
      }

      if (sortBy === 'pending_first') {
        const pendingScore = (item) => (item.status === 'pending' ? 1 : 0)
        return pendingScore(b) - pendingScore(a) || new Date(b.created_at || 0) - new Date(a.created_at || 0)
      }

      if (sortBy === 'interviews_first') {
        const interviewScore = (item) => (item.interview_scheduled_at ? 1 : 0)
        return interviewScore(b) - interviewScore(a) ||
          new Date(a.interview_scheduled_at || a.created_at || 0) - new Date(b.interview_scheduled_at || b.created_at || 0)
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  }, [applications, readinessFilter, scoreFilter, search, sortBy, statusFilter])

  const selectedApplication = filteredApplications.find((application) => application.id === selectedId) ||
    filteredApplications[0] ||
    null

  const selectedJobSeeker = selectedApplication?.job_seeker || null
  const selectedResume = selectedJobSeeker?.resume || null
  const missingSkills = selectedApplication?.skill_gaps || []
  const quizResponses = selectedApplication?.quiz_responses || []
  const quizCorrect = quizResponses.filter((response) => response.is_correct).length
  const quizTotal = quizResponses.length || Number(selectedApplication?.quiz_responses_count || 0)
  const quizScore = quizTotal > 0
    ? scoreNumber(selectedApplication?.soft_skill_score ?? ((quizCorrect / quizTotal) * 100))
    : 0
  const requiredSkills = splitSkills(selectedApplication?.job_posting?.required_skills || job?.required_skills)
  const candidateSkills = splitSkills(selectedJobSeeker?.skills)
  const finalScore = scoreNumber(selectedApplication?.final_score)
  const finalTone = scoreMeta(finalScore)
  const applicantProfileId = selectedApplication?.job_seeker?.user?.id
  const profileQuery = new URLSearchParams({
    from: 'company-applicants',
    application: String(selectedApplication?.id || ''),
    ...(jobId ? { job: String(jobId) } : {}),
  }).toString()
  const selectedInsight = applicationInsight(selectedApplication)
  const selectedHasResume = Boolean(selectedResume)
  const selectedHasQuiz = quizTotal > 0
  const selectedHasInterview = Boolean(selectedApplication?.interview_scheduled_at)
  const compareApplications = useMemo(
    () => compareIds
      .map((id) => applications.find((application) => application.id === id))
      .filter(Boolean),
    [applications, compareIds],
  )
  const compareApplicationIds = useMemo(() => new Set(compareIds), [compareIds])
  const matchTone = finalScore >= 70 ? 'emerald' : finalScore >= 40 ? 'amber' : finalScore > 0 ? 'red' : 'gray'
  const activeFilterCount = [
    search.trim(),
    statusFilter !== 'all',
    scoreFilter !== 'all',
    readinessFilter !== 'all',
    sortBy !== 'newest',
  ].filter(Boolean).length
  const reportStats = useMemo(() => {
    const total = filteredApplications.length
    const scored = filteredApplications.filter((application) => Number(application.final_score || 0) > 0)
    const average = scored.length
      ? Math.round(scored.reduce((sum, application) => sum + Number(application.final_score || 0), 0) / scored.length)
      : 0

    return {
      total,
      average,
      highMatch: filteredApplications.filter((application) => Number(application.final_score || 0) >= 70).length,
      pending: filteredApplications.filter((application) => application.status === 'pending').length,
      interviews: filteredApplications.filter((application) => Boolean(application.interview_scheduled_at)).length,
      quizDone: filteredApplications.filter((application) => Number(application.quiz_responses_count || application.quiz_responses?.length || 0) > 0).length,
    }
  }, [filteredApplications])
  const activeReviewForm = reviewForm.applicationId === selectedApplication?.id
    ? reviewForm
    : buildReviewForm(selectedApplication)

  const resetFilters = () => {
    updateSearch('')
    setStatusFilter('all')
    setScoreFilter('all')
    setReadinessFilter('all')
    setSortBy('newest')
  }

  const syncApplication = (applicationId, updates) => {
    setApplications((current) => current.map((application) => (
      application.id === applicationId ? { ...application, ...updates } : application
    )))
  }

  const openApplicantDetail = (application) => {
    setSelectedId(application.id)
    setReviewForm(buildReviewForm(application))
    setDetailTab('overview')
  }

  const toggleCompare = (application) => {
    setCompareIds((current) => {
      if (current.includes(application.id)) {
        return current.filter((id) => id !== application.id)
      }

      if (current.length >= 4) {
        toast.error('Compare up to 4 candidates at a time')
        return current
      }

      return [...current, application.id]
    })
  }

  const openCompareDetail = (application) => {
    openApplicantDetail(application)
    setShowCompare(false)
  }

  const removeCompare = (applicationId) => {
    setCompareIds((current) => current.filter((id) => id !== applicationId))
  }

  const clearCompare = () => {
    setCompareIds([])
    setShowCompare(false)
  }

  const exportApplicantsCsv = () => {
    if (loading || filteredApplications.length === 0) {
      toast.error('No applicants available to export')
      return
    }

    const headers = [
      'Candidate name',
      'Email',
      'Phone',
      'Headline',
      'Candidate location',
      'Current company',
      'Job title',
      'Job location',
      'Job type',
      'Work mode',
      'Salary',
      'Deadline',
      'Application status',
      'Final score',
      'Resume similarity',
      'Skill match',
      'Soft skills',
      'Quiz responses',
      'Resume uploaded',
      'Missing skills',
      'Applied at',
      'Interview at',
      'Interview mode',
      'Interview status',
      'Recruiter rating',
      'Recruiter notes',
      'Interview rating',
      'Interview feedback',
      'Cover letter',
    ]

    const rows = filteredApplications.map((application) => {
      const applicant = application.job_seeker || {}
      const appliedJob = application.job_posting || job || {}
      const missing = (application.skill_gaps || [])
        .map((gap) => gap.missing_skill)
        .filter(Boolean)
        .join(', ')

      return [
        candidateName(application),
        candidateEmail(application),
        applicant.phone,
        applicant.headline,
        applicant.location,
        applicant.company,
        appliedJob.title,
        appliedJob.location,
        formatJobType(appliedJob.job_type),
        formatWorkMode(appliedJob.work_mode),
        formatSalary(appliedJob),
        formatDeadline(appliedJob),
        statusLabel(application.status),
        scoreNumber(application.final_score),
        scoreNumber(application.similarity_score),
        scoreNumber(application.skill_gap_score),
        scoreNumber(application.soft_skill_score),
        Number(application.quiz_responses_count || application.quiz_responses?.length || 0),
        applicant.resume ? 'Yes' : 'No',
        missing,
        formatDateTime(application.created_at),
        application.interview_scheduled_at ? formatDateTime(application.interview_scheduled_at) : '',
        application.interview_mode ? interviewModeLabel(application.interview_mode) : '',
        application.interview_status ? interviewStatusLabel(application.interview_status) : '',
        application.company_rating || '',
        application.company_notes || '',
        application.interview_rating || '',
        application.interview_feedback || '',
        application.cover_letter || '',
      ]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `recruitsense-${slug(job?.title || 'applicants')}-${date}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredApplications.length} applicant${filteredApplications.length === 1 ? '' : 's'}`)
  }

  const saveApplicationStatus = async () => {
    if (!selectedApplication) return

    if (selectedApplication.status === 'withdrawn') {
      toast.error('Withdrawn applications cannot be moved back into the pipeline')
      return
    }

    setActionLoading(`status-${selectedApplication.id}`)
    try {
      const res = await api.put(`/applications/${selectedApplication.id}/status`, {
        status: activeReviewForm.status,
      })
      const updatedApplication = res.data.application || {}

      syncApplication(selectedApplication.id, updatedApplication)
      setReviewForm(buildReviewForm(updatedApplication))
      setSelectedId(selectedApplication.id)
      toast.success(res.data.message || 'Candidate stage updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update candidate stage')
    } finally {
      setActionLoading(null)
    }
  }

  const saveCompanyReview = async (event) => {
    event.preventDefault()
    if (!selectedApplication) return

    setActionLoading(`review-${selectedApplication.id}`)
    try {
      const res = await api.put(`/applications/${selectedApplication.id}/review`, {
        company_rating: activeReviewForm.company_rating ? Number(activeReviewForm.company_rating) : null,
        company_notes: activeReviewForm.company_notes,
      })
      const updatedApplication = res.data.application || {}

      syncApplication(selectedApplication.id, updatedApplication)
      setReviewForm(buildReviewForm(updatedApplication))
      setSelectedId(selectedApplication.id)
      toast.success(res.data.message || 'Recruiter review saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save recruiter review')
    } finally {
      setActionLoading(null)
    }
  }

  const saveInterviewFeedback = async (event) => {
    event.preventDefault()
    if (!selectedApplication) return

    if (!selectedApplication.interview_scheduled_at) {
      toast.error('Schedule an interview before saving feedback')
      return
    }

    setActionLoading(`feedback-${selectedApplication.id}`)
    try {
      const res = await api.put(`/applications/${selectedApplication.id}/interview-feedback`, {
        interview_status: activeReviewForm.interview_status,
        interview_rating: activeReviewForm.interview_rating ? Number(activeReviewForm.interview_rating) : null,
        interview_feedback: activeReviewForm.interview_feedback,
      })
      const updatedApplication = res.data.application || {}

      syncApplication(selectedApplication.id, updatedApplication)
      setReviewForm(buildReviewForm(updatedApplication))
      setSelectedId(selectedApplication.id)
      toast.success(res.data.message || 'Interview feedback saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save interview feedback')
    } finally {
      setActionLoading(null)
    }
  }

  const openDecision = (application, action) => {
    setDecision({ application, action })
  }

  const closeDecision = () => {
    if (actionLoading) return
    setDecision(null)
  }

  const confirmDecision = async () => {
    if (!decision?.application) return

    const { application, action } = decision
    const nextStatus = action === 'shortlist' ? 'shortlisted' : 'rejected'
    setActionLoading(`${action}-${application.id}`)

    try {
      const res = await api.post(`/applications/${application.id}/${action}`)
      const updatedApplication = {
        ...application,
        ...(res.data.application || {}),
        status: nextStatus,
      }
      syncApplication(application.id, updatedApplication)
      setReviewForm(buildReviewForm(updatedApplication))
      setSelectedId(application.id)
      setDecision(null)
      toast.success(nextStatus === 'shortlisted' ? 'Candidate shortlisted' : 'Candidate rejected')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update applicant')
    } finally {
      setActionLoading(null)
    }
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
      setReviewForm(buildReviewForm(updatedApplication))
      setSelectedId(interviewModal.application.id)
      setInterviewModal(null)
      toast.success(res.data.message || 'Interview scheduled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule interview')
    } finally {
      setActionLoading(null)
    }
  }

  const startApplicantMessage = async (application) => {
    const candidateUserId = application?.job_seeker?.user?.id

    if (!candidateUserId) {
      toast.error('Candidate account is not available')
      return
    }

    setActionLoading(`message-${application.id}`)
    try {
      const res = await api.post(`/messages/start/${candidateUserId}`)
      const conversationId = res.data?.conversation?.id

      if (!conversationId) {
        toast.error('Conversation could not be opened')
        return
      }

      navigate(`/messages?conversation=${conversationId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start conversation')
    } finally {
      setActionLoading(null)
    }
  }

  const openResume = async (application, mode) => {
    if (!application?.job_seeker?.resume) {
      toast.error('Candidate has not uploaded a resume')
      return
    }

    const previewWindow = mode === 'view'
      ? window.open('', '_blank', 'noopener,noreferrer')
      : null

    if (previewWindow) {
      previewWindow.document.write('<p style="font-family:Arial,sans-serif;padding:24px;color:#334155">Loading resume...</p>')
    }

    setResumeAction(`${mode}-${application.id}`)
    try {
      const res = await api.get(`/applications/${application.id}/resume${mode === 'download' ? '?download=1' : ''}`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: res.headers?.['content-type'] || 'application/pdf' })
      const url = window.URL.createObjectURL(blob)

      if (mode === 'view') {
        if (previewWindow) {
          previewWindow.location.href = url
        } else {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
        window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = resumeDownloadName(application)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close()
      }
      toast.error(err.response?.data?.message || 'Failed to open resume')
    } finally {
      setResumeAction(null)
    }
  }

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            {jobId && (
              <button
                type="button"
                onClick={() => navigate('/company/jobs')}
                className="mb-3 text-sm font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to jobs
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{job ? job.title : 'Applicants'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {job ? 'Review candidates for this job.' : 'Review candidates across all company jobs.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-2">
            <button
              type="button"
              onClick={exportApplicantsCsv}
              disabled={loading || filteredApplications.length === 0}
              className="h-11 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowCompare(true)}
              disabled={compareApplications.length < 2}
              className="h-11 px-4 rounded-xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Compare {compareApplications.length > 0 ? `(${compareApplications.length})` : ''}
            </button>
            <button
              type="button"
              onClick={() => navigate('/company/jobs')}
              className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Jobs
            </button>
            <button
              type="button"
              onClick={() => navigate('/company/dashboard')}
              className="h-11 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-gray-400">Total applicants</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '-' : applications.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-amber-600">Pending review</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{loading ? '-' : statusCounts.pending}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-emerald-600">High match</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{loading ? '-' : highMatchCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-indigo-600">Average match</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{loading ? '-' : `${averageMatch}%`}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-900">Pipeline report</h2>
              <p className="text-sm text-gray-500 mt-1">
                Export uses the current search, stage, score, readiness, and sort filters.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                { label: 'Shown', value: reportStats.total, tone: 'text-gray-900 bg-gray-50 border-gray-100' },
                { label: 'Avg match', value: `${reportStats.average}%`, tone: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
                { label: 'High match', value: reportStats.highMatch, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                { label: 'Pending', value: reportStats.pending, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
                { label: 'Interviews', value: reportStats.interviews, tone: 'text-violet-700 bg-violet-50 border-violet-100' },
                { label: 'Quiz done', value: reportStats.quizDone, tone: 'text-sky-700 bg-sky-50 border-sky-100' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border px-3 py-2 min-w-0 ${item.tone}`}>
                  <p className="text-lg font-bold leading-tight">{loading ? '-' : item.value}</p>
                  <p className="text-[11px] font-semibold mt-1 truncate">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {compareApplications.length > 0 && (
          <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4 mb-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-violet-900">Compare candidates</p>
                <p className="text-sm text-violet-700 mt-1">Select 2 to 4 candidates from the list, then compare them side by side.</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  {compareApplications.map((application) => (
                    <span key={application.id} className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800">
                      {candidateName(application)}
                      <button
                        type="button"
                        onClick={() => removeCompare(application.id)}
                        className="text-violet-400 hover:text-violet-700"
                        aria-label={`Remove ${candidateName(application)} from comparison`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompare(true)}
                  disabled={compareApplications.length < 2}
                  className="h-9 px-3 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Open comparison
                </button>
                <button
                  type="button"
                  onClick={clearCompare}
                  className="h-9 px-3 rounded-xl border border-violet-200 bg-white text-xs font-bold text-violet-700 hover:bg-violet-100"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search applicants, jobs, skills..."
                className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.key}
                  type="button"
                  onClick={() => setStatusFilter(status.key)}
                  className={`h-11 px-4 rounded-xl border text-sm font-semibold ${
                    statusFilter === status.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  {status.label}
                  <span className={statusFilter === status.key ? 'ml-2 text-white/80' : 'ml-2 text-gray-400'}>
                    {statusCounts[status.key] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid sm:grid-cols-3 gap-2">
              <label className="relative">
                <span className="sr-only">Filter by match score</span>
                <select
                  value={scoreFilter}
                  onChange={(event) => setScoreFilter(event.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {scoreFilterOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="relative">
                <span className="sr-only">Filter by candidate readiness</span>
                <select
                  value={readinessFilter}
                  onChange={(event) => setReadinessFilter(event.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {readinessFilterOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="relative">
                <span className="sr-only">Sort applicants</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {sortOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between lg:justify-end gap-2">
              <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Showing {loading ? '-' : filteredApplications.length} of {loading ? '-' : applications.length}
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
                >
                  Reset filters ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-300 mx-auto mb-4 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <p className="font-bold text-gray-900">No applicants found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {activeFilterCount > 0 ? 'No candidates match the current filters.' : 'Applicants will appear here after job seekers apply.'}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[calc(100vh-310px)] overflow-y-auto">
                {filteredApplications.map((application) => {
                  const score = scoreNumber(application.final_score)
                  const tone = scoreMeta(score)
                  const isSelected = selectedApplication?.id === application.id
                  const hasResume = Boolean(application.job_seeker?.resume)
                  const hasCoverLetter = Boolean(application.cover_letter)
                  const hasQuiz = Number(application.quiz_responses_count || application.quiz_responses?.length || 0) > 0
                  const hasInterview = Boolean(application.interview_scheduled_at)
                  const isComparing = compareApplicationIds.has(application.id)

                  return (
                    <div
                      key={application.id}
                      onClick={() => {
                        openApplicantDetail(application)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openApplicantDetail(application)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                          {initials(candidateName(application))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                                {candidateName(application)}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{application.job_posting?.title || job?.title || 'Job application'}</p>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg border text-sm font-bold ${tone.className}`}>
                              {score}%
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={statusBadge(application.status)}>
                              {statusMeta[application.status]?.label || application.status}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${hasResume ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                              {hasResume ? 'Resume' : 'No resume'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${hasCoverLetter ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                              {hasCoverLetter ? 'Cover letter' : 'No letter'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${hasQuiz ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                              {hasQuiz ? 'Quiz done' : 'Quiz pending'}
                            </span>
                            {hasInterview && (
                              <span className="px-2.5 py-1 rounded-full border text-xs font-semibold bg-violet-50 text-violet-700 border-violet-100">
                                Interview
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-3">Applied {formatDate(application.created_at)}</p>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleCompare(application)
                            }}
                            className={`mt-3 h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-2 ${
                              isComparing
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            {isComparing ? 'Selected to compare' : 'Add to compare'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 min-h-[620px] overflow-hidden">
            {!selectedApplication ? (
              <div className="h-full min-h-[620px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
                  <User className="w-8 h-8" />
                </div>
                <p className="font-bold text-gray-900">Select an applicant</p>
                <p className="text-sm text-gray-500 mt-1">Candidate details and actions will appear here.</p>
              </div>
            ) : (
              <div>
                <div className="p-5 border-b border-gray-100">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xl flex items-center justify-center flex-shrink-0">
                        {initials(candidateName(selectedApplication))}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-bold text-gray-900">{candidateName(selectedApplication)}</h2>
                          <span className={statusBadge(selectedApplication.status)}>
                            {statusMeta[selectedApplication.status]?.label || selectedApplication.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{selectedJobSeeker?.headline || 'Job seeker'}</p>
                        {candidateEmail(selectedApplication) && (
                          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {candidateEmail(selectedApplication)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`rounded-2xl border px-5 py-4 text-center ${finalTone.className}`}>
                      <p className="text-3xl font-bold">{finalScore}%</p>
                      <p className="text-xs font-semibold mt-1">{finalTone.label}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    {applicantProfileId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${applicantProfileId}?${profileQuery}`)}
                        className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View profile
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!applicantProfileId || selectedApplication.status === 'withdrawn' || actionLoading !== null}
                      onClick={() => startApplicantMessage(selectedApplication)}
                      className="h-10 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {actionLoading === `message-${selectedApplication.id}` ? (
                        <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-700 rounded-full animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      Message
                    </button>
                    <button
                      type="button"
                      disabled={!selectedResume || resumeAction !== null}
                      onClick={() => openResume(selectedApplication, 'view')}
                      className="h-10 px-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {resumeAction === `view-${selectedApplication.id}` ? (
                        <span className="w-4 h-4 border-2 border-sky-200 border-t-sky-700 rounded-full animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      View resume
                    </button>
                    <button
                      type="button"
                      disabled={!selectedResume || resumeAction !== null}
                      onClick={() => openResume(selectedApplication, 'download')}
                      className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {resumeAction === `download-${selectedApplication.id}` ? (
                        <span className="w-4 h-4 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </button>
                    <button
                      type="button"
                      disabled={terminalApplicationStatuses.includes(selectedApplication.status) || actionLoading !== null}
                      onClick={() => openInterview(selectedApplication)}
                      className="h-10 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      {selectedApplication.interview_scheduled_at ? 'Update interview' : 'Schedule interview'}
                    </button>
                    <button
                      type="button"
                      disabled={!['pending', 'screening'].includes(selectedApplication.status) || actionLoading !== null}
                      onClick={() => openDecision(selectedApplication, 'shortlist')}
                      className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Shortlist
                    </button>
                    <button
                      type="button"
                      disabled={terminalApplicationStatuses.includes(selectedApplication.status) || actionLoading !== null}
                      onClick={() => openDecision(selectedApplication, 'reject')}
                      className="h-10 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>

                  <StatusInsight insight={selectedInsight} />

                  <div className="mt-4 grid sm:grid-cols-2 2xl:grid-cols-4 gap-3">
                    <QuickFact
                      icon={<FileText className="w-5 h-5" />}
                      label="Resume"
                      value={selectedHasResume ? 'Uploaded' : 'Missing'}
                      detail={selectedHasResume ? fileName(selectedResume?.file_path) : 'Candidate has not uploaded a resume yet.'}
                      tone={selectedHasResume ? 'sky' : 'amber'}
                    />
                    <QuickFact
                      icon={<Sparkles className="w-5 h-5" />}
                      label="Soft skills quiz"
                      value={selectedHasQuiz ? `${quizScore}% score` : 'Pending'}
                      detail={selectedHasQuiz ? `${quizCorrect}/${quizTotal} correct answers submitted.` : 'Quiz responses will appear after submission.'}
                      tone={selectedHasQuiz ? (quizScore >= 70 ? 'emerald' : quizScore >= 40 ? 'amber' : 'red') : 'gray'}
                    />
                    <QuickFact
                      icon={<Calendar className="w-5 h-5" />}
                      label="Interview"
                      value={selectedHasInterview ? 'Scheduled' : 'Not scheduled'}
                      detail={selectedHasInterview ? formatDateTime(selectedApplication.interview_scheduled_at) : 'Schedule after shortlisting the candidate.'}
                      tone={selectedHasInterview ? 'indigo' : 'gray'}
                    />
                    <QuickFact
                      icon={<Target className="w-5 h-5" />}
                      label="Final match"
                      value={`${finalScore}%`}
                      detail={finalTone.label}
                      tone={matchTone}
                    />
                  </div>
                </div>

                <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50/60">
                  <div className="flex gap-2 overflow-x-auto">
                    {applicantDetailTabs.map((tab) => {
                      const Icon = tab.icon
                      const active = detailTab === tab.key

                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDetailTab(tab.key)}
                          className={`h-10 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-colors ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-5 grid xl:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {['overview', 'resume'].includes(detailTab) && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Candidate snapshot</h3>
                      <div className="rounded-2xl border border-gray-100 px-4">
                        <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Applied job" value={selectedApplication.job_posting?.title || job?.title || 'Job'} />
                        <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={selectedJobSeeker?.location} />
                        <DetailRow icon={<Building2 className="w-4 h-4" />} label="Current company" value={selectedJobSeeker?.company} />
                        <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Education" value={selectedJobSeeker?.education} />
                        <DetailRow icon={<FileText className="w-4 h-4" />} label="Resume" value={fileName(selectedResume?.file_path)} />
                        <DetailRow icon={<Calendar className="w-4 h-4" />} label="Applied on" value={formatDate(selectedApplication.created_at)} />
                      </div>
                      </section>
                    )}

                    {detailTab === 'resume' && (
                      <section>
                        <h3 className="font-bold text-gray-900 mb-3">Resume file</h3>
                        <div className="rounded-2xl border border-gray-100 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900">
                                {selectedHasResume ? fileName(selectedResume?.file_path) : 'No resume uploaded'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {selectedHasResume ? 'Open or download the candidate resume.' : 'Candidate resume will appear here after upload.'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              disabled={!selectedResume || resumeAction !== null}
                              onClick={() => openResume(selectedApplication, 'view')}
                              className="h-10 px-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View resume
                            </button>
                            <button
                              type="button"
                              disabled={!selectedResume || resumeAction !== null}
                              onClick={() => openResume(selectedApplication, 'download')}
                              className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {['overview', 'quiz'].includes(detailTab) && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Score breakdown</h3>
                      <div className="rounded-2xl border border-gray-100 p-4 space-y-5">
                        <ScoreBar label="Resume similarity" weight={50} value={selectedApplication.similarity_score} />
                        <ScoreBar label="Skill match" weight={30} value={selectedApplication.skill_gap_score} />
                        <ScoreBar label="Soft skills quiz" weight={20} value={selectedApplication.soft_skill_score} />
                      </div>
                      </section>
                    )}

                    {detailTab === 'pipeline' && (
                      <section>
                        <h3 className="font-bold text-gray-900 mb-3">Pipeline stage</h3>
                        <div className="rounded-2xl border border-gray-100 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                              <ClipboardList className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900">Current stage</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Move this applicant through screening, interview, offer, and hiring stages.
                              </p>
                            </div>
                            <span className={statusBadge(selectedApplication.status)}>
                              {statusLabel(selectedApplication.status)}
                            </span>
                          </div>

                          <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3">
                            <label className="block">
                              <span className="text-sm font-semibold text-gray-800">Candidate stage</span>
                              <select
                                value={activeReviewForm.status}
                                disabled={selectedApplication.status === 'withdrawn' || actionLoading !== null}
                                onChange={(event) => setReviewForm({ ...activeReviewForm, status: event.target.value })}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-50"
                              >
                                {pipelineStageOptions.map((stage) => (
                                  <option key={stage.key} value={stage.key}>{stage.label}</option>
                                ))}
                              </select>
                            </label>
                            <button
                              type="button"
                              disabled={
                                selectedApplication.status === 'withdrawn' ||
                                selectedApplication.status === activeReviewForm.status ||
                                actionLoading !== null
                              }
                              onClick={saveApplicationStatus}
                              className="self-end h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                              {actionLoading === `status-${selectedApplication.id}` ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Update stage
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {detailTab === 'pipeline' && (
                      <section>
                        <h3 className="font-bold text-gray-900 mb-3">Private recruiter review</h3>
                        <form onSubmit={saveCompanyReview} className="rounded-2xl border border-gray-100 p-4 space-y-4">
                          <label className="block">
                            <span className="text-sm font-semibold text-gray-800">Recruiter rating</span>
                            <select
                              value={activeReviewForm.company_rating}
                              onChange={(event) => setReviewForm({ ...activeReviewForm, company_rating: event.target.value })}
                              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                              <option value="">No rating</option>
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-sm font-semibold text-gray-800">Recruiter notes</span>
                            <textarea
                              rows={6}
                              value={activeReviewForm.company_notes}
                              onChange={(event) => setReviewForm({ ...activeReviewForm, company_notes: event.target.value })}
                              placeholder="Add private notes about strengths, concerns, screening outcome, or follow-up tasks."
                              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                          </label>

                          <button
                            type="submit"
                            disabled={actionLoading !== null}
                            className="h-10 px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {actionLoading === `review-${selectedApplication.id}` ? (
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                            Save review
                          </button>
                        </form>
                      </section>
                    )}

                    {detailTab === 'timeline' && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Application timeline</h3>
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <TimelineItem
                          done
                          title="Application submitted"
                          detail={`Candidate applied on ${formatDate(selectedApplication.created_at)}.`}
                        />
                        <TimelineItem
                          done={Number(selectedApplication.final_score || 0) > 0}
                          active={Number(selectedApplication.final_score || 0) <= 0}
                          title="AI resume analysis"
                          detail={Number(selectedApplication.final_score || 0) > 0 ? `Final match score is ${finalScore}%.` : 'AI score is still pending.'}
                        />
                        <TimelineItem
                          done={Number(selectedApplication.quiz_responses_count || 0) > 0}
                          active={Number(selectedApplication.quiz_responses_count || 0) === 0}
                          title="Soft skills quiz"
                          detail={Number(selectedApplication.quiz_responses_count || 0) > 0 ? `${selectedApplication.quiz_responses_count} responses submitted.` : 'Candidate has not submitted quiz responses yet.'}
                        />
                        <TimelineItem
                          done={selectedApplication.status !== 'pending'}
                          active={selectedApplication.status === 'pending'}
                          title="Company screening"
                          detail={selectedApplication.status === 'pending'
                            ? 'Waiting for first company review.'
                            : `Moved to ${statusLabel(selectedApplication.status)} on ${formatDate(selectedApplication.updated_at)}.`}
                        />
                        <TimelineItem
                          done={Boolean(selectedApplication.interview_scheduled_at)}
                          active={['shortlisted', 'interview'].includes(selectedApplication.status) && !selectedApplication.interview_scheduled_at}
                          title="Interview"
                          detail={selectedApplication.interview_scheduled_at
                            ? `${interviewModeLabel(selectedApplication.interview_mode)} interview on ${formatDateTime(selectedApplication.interview_scheduled_at)}. ${interviewStatusLabel(selectedApplication.interview_status)}.`
                            : 'No interview scheduled yet.'}
                        />
                        <TimelineItem
                          done={['offered', 'hired', 'rejected'].includes(selectedApplication.status)}
                          active={selectedApplication.status === 'offered'}
                          title="Final decision"
                          detail={['offered', 'hired', 'rejected'].includes(selectedApplication.status)
                            ? `Current decision stage: ${statusLabel(selectedApplication.status)}.`
                            : 'Offer, hired, or rejection decision has not been made yet.'}
                        />
                      </div>
                      </section>
                    )}
                  </div>

                  <div className="space-y-6">
                    {detailTab === 'pipeline' && (
                      <section>
                        <h3 className="font-bold text-gray-900 mb-3">Interview outcome</h3>
                        {selectedApplication.interview_scheduled_at ? (
                          <form onSubmit={saveInterviewFeedback} className="rounded-2xl border border-gray-100 p-4 space-y-4">
                            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
                              <p className="text-sm font-bold text-indigo-900">{formatDateTime(selectedApplication.interview_scheduled_at)}</p>
                              <p className="text-xs text-indigo-700 mt-1">
                                {interviewModeLabel(selectedApplication.interview_mode)}
                              </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <label className="block">
                                <span className="text-sm font-semibold text-gray-800">Outcome status</span>
                                <select
                                  value={activeReviewForm.interview_status}
                                  onChange={(event) => setReviewForm({ ...activeReviewForm, interview_status: event.target.value })}
                                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                  {interviewStatusOptions.map((status) => (
                                    <option key={status.key} value={status.key}>{status.label}</option>
                                  ))}
                                </select>
                              </label>

                              <label className="block">
                                <span className="text-sm font-semibold text-gray-800">Interview rating</span>
                                <select
                                  value={activeReviewForm.interview_rating}
                                  onChange={(event) => setReviewForm({ ...activeReviewForm, interview_rating: event.target.value })}
                                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                  <option value="">No rating</option>
                                  {[5, 4, 3, 2, 1].map((rating) => (
                                    <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <label className="block">
                              <span className="text-sm font-semibold text-gray-800">Interview feedback</span>
                              <textarea
                                rows={7}
                                value={activeReviewForm.interview_feedback}
                                onChange={(event) => setReviewForm({ ...activeReviewForm, interview_feedback: event.target.value })}
                                placeholder="Summarize performance, communication, strengths, risks, or next-step recommendation."
                                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              />
                            </label>

                            <button
                              type="submit"
                              disabled={actionLoading !== null}
                              className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                              {actionLoading === `feedback-${selectedApplication.id}` ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Save feedback
                            </button>
                          </form>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                            <p className="text-sm font-semibold text-gray-900">No interview scheduled.</p>
                            <p className="text-sm text-gray-500 mt-1">Schedule an interview before recording feedback or outcome.</p>
                            <button
                              type="button"
                              disabled={terminalApplicationStatuses.includes(selectedApplication.status) || actionLoading !== null}
                              onClick={() => openInterview(selectedApplication)}
                              className="mt-4 h-10 px-4 rounded-xl border border-indigo-200 bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Schedule interview
                            </button>
                          </div>
                        )}
                      </section>
                    )}

                    {['overview', 'timeline'].includes(detailTab) && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Interview</h3>
                      {selectedApplication.interview_scheduled_at ? (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-indigo-950">
                                {formatDateTime(selectedApplication.interview_scheduled_at)}
                              </p>
                              <p className="text-xs text-indigo-700 mt-1">
                                {interviewModeLabel(selectedApplication.interview_mode)}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${interviewStatusMeta[selectedApplication.interview_status || 'scheduled'] || interviewStatusMeta.scheduled}`}>
                              {interviewStatusLabel(selectedApplication.interview_status)}
                            </span>
                          </div>
                          {selectedApplication.interview_location && (
                            <p className="text-sm text-indigo-800 mt-3 break-words">{selectedApplication.interview_location}</p>
                          )}
                          {selectedApplication.interview_notes && (
                            <p className="text-sm text-indigo-800/80 mt-3 leading-relaxed whitespace-pre-wrap">{selectedApplication.interview_notes}</p>
                          )}
                          {(selectedApplication.interview_rating || selectedApplication.interview_feedback) && (
                            <div className="mt-4 rounded-xl bg-white/80 border border-indigo-100 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold uppercase text-indigo-500">Interview feedback</p>
                                {selectedApplication.interview_rating && (
                                  <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 text-xs font-bold">
                                    {selectedApplication.interview_rating}/5 rating
                                  </span>
                                )}
                              </div>
                              {selectedApplication.interview_feedback && (
                                <p className="text-sm text-indigo-900 mt-2 leading-relaxed whitespace-pre-wrap">{selectedApplication.interview_feedback}</p>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={actionLoading !== null}
                            onClick={() => openInterview(selectedApplication)}
                            className="mt-4 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Calendar className="w-4 h-4" />
                            Update interview
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm font-semibold text-gray-900">No interview scheduled yet.</p>
                          <p className="text-sm text-gray-500 mt-1">Add date, mode, and joining details for the candidate.</p>
                          <button
                            type="button"
                            disabled={terminalApplicationStatuses.includes(selectedApplication.status) || actionLoading !== null}
                            onClick={() => openInterview(selectedApplication)}
                            className="mt-4 h-10 px-4 rounded-xl border border-indigo-200 bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Calendar className="w-4 h-4" />
                            Schedule interview
                          </button>
                        </div>
                      )}
                      </section>
                    )}

                    {['overview', 'resume'].includes(detailTab) && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Cover letter</h3>
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 min-h-36">
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {selectedApplication.cover_letter || 'Candidate did not add a cover letter.'}
                        </p>
                      </div>
                      </section>
                    )}

                    {detailTab === 'overview' && (
                      <section>
                        <h3 className="font-bold text-gray-900 mb-3">Recruiter review</h3>
                        <div className="rounded-2xl border border-gray-100 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-gray-900">Private company notes</p>
                              <p className="text-xs text-gray-500 mt-1">Only visible in the company panel.</p>
                            </div>
                            {selectedApplication.company_rating ? (
                              <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 text-xs font-bold">
                                {selectedApplication.company_rating}/5 rating
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1 text-xs font-bold">
                                No rating
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mt-4">
                            {selectedApplication.company_notes || 'No recruiter notes saved yet.'}
                          </p>
                        </div>
                      </section>
                    )}

                    {['overview', 'quiz'].includes(detailTab) && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Skill gaps</h3>
                      {missingSkills.length === 0 ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5" />
                          No major skill gaps found for this application.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {missingSkills.map((gap) => (
                            <div key={gap.id || gap.missing_skill} className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                              <p className="text-sm font-bold text-amber-800">{gap.missing_skill}</p>
                              <p className="text-xs text-amber-700 mt-1">{gap.recommendation || 'Review this skill before shortlisting.'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      </section>
                    )}

                    {detailTab === 'quiz' && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Skills comparison</h3>
                      <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Required skills</p>
                          <div className="flex flex-wrap gap-2">
                            {requiredSkills.length > 0 ? requiredSkills.map((skill) => (
                              <span key={skill} className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 text-xs font-semibold">
                                {skill}
                              </span>
                            )) : (
                              <span className="text-sm text-gray-500">No required skills listed.</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Profile skills</p>
                          <div className="flex flex-wrap gap-2">
                            {candidateSkills.length > 0 ? candidateSkills.map((skill) => (
                              <span key={skill} className="rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 text-xs font-semibold">
                                {skill}
                              </span>
                            )) : (
                              <span className="text-sm text-gray-500">No profile skills added.</span>
                            )}
                          </div>
                        </div>
                      </div>
                      </section>
                    )}

                    {detailTab === 'quiz' && (
                      <section>
                      <h3 className="font-bold text-gray-900 mb-3">Quiz review</h3>
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">
                              {quizTotal > 0 ? `${quizScore}% quiz score` : 'Quiz not submitted'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {quizTotal > 0 ? `${quizCorrect}/${quizTotal} correct answers` : 'Quiz details will appear after candidate submits responses.'}
                            </p>
                          </div>
                          {quizTotal > 0 && (
                            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${scoreMeta(quizScore).className}`}>
                              {quizScore}%
                            </span>
                          )}
                        </div>

                        {quizResponses.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {quizResponses.map((response, index) => (
                              <div
                                key={response.id || `${response.question_id}-${index}`}
                                className={`rounded-xl border p-3 ${
                                  response.is_correct
                                    ? 'bg-emerald-50 border-emerald-100'
                                    : 'bg-red-50 border-red-100'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {index + 1}. {response.question?.question_text || 'Quiz question'}
                                  </p>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    response.is_correct
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-600'
                                  }`}
                                  >
                                    {response.is_correct ? 'Correct' : 'Wrong'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">Selected: {response.selected_answer}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showCompare && (
        <div className="fixed inset-0 z-50 bg-gray-900/45 flex items-center justify-center px-4">
          <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Candidate comparison</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Compare score, skills, interview status, and recruiter notes for selected candidates.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCompare}
                  className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:border-violet-200 hover:text-violet-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompare(false)}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Close candidate comparison"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto">
              {compareApplications.length < 2 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-300 mx-auto mb-3 flex items-center justify-center">
                    <Users className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-gray-900">Select at least two candidates</p>
                  <p className="text-sm text-gray-500 mt-1">Use Add to compare from the applicant list.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-4 min-w-max"
                    style={{ gridTemplateColumns: `repeat(${compareApplications.length}, minmax(250px, 1fr))` }}
                  >
                    {compareApplications.map((application) => {
                      const applicant = application.job_seeker || {}
                      const appliedJob = application.job_posting || job || {}
                      const score = scoreNumber(application.final_score)
                      const tone = scoreMeta(score)
                      const required = splitSkills(appliedJob.required_skills).slice(0, 5)
                      const profileSkills = splitSkills(applicant.skills).slice(0, 5)
                      const missing = (application.skill_gaps || [])
                        .map((gap) => gap.missing_skill)
                        .filter(Boolean)
                        .slice(0, 5)
                      const quizCount = Number(application.quiz_responses_count || application.quiz_responses?.length || 0)

                      return (
                        <article key={application.id} className="rounded-2xl border border-gray-100 bg-white p-4 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center mb-3">
                                {initials(candidateName(application))}
                              </div>
                              <h3 className="font-bold text-gray-900 truncate">{candidateName(application)}</h3>
                              <p className="text-sm text-gray-500 truncate">{applicant.headline || 'Job seeker'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCompare(application.id)}
                              className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
                              aria-label={`Remove ${candidateName(application)} from comparison`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className={`mt-4 rounded-2xl border p-4 text-center ${tone.className}`}>
                            <p className="text-3xl font-bold">{score}%</p>
                            <p className="text-xs font-semibold mt-1">{tone.label}</p>
                          </div>

                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Status</span>
                              <span className={statusBadge(application.status)}>{statusLabel(application.status)}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Job</span>
                              <span className="font-semibold text-gray-900 text-right">{appliedJob.title || 'Job'}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Applied</span>
                              <span className="font-semibold text-gray-900 text-right">{formatDate(application.created_at)}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Resume</span>
                              <span className={`font-semibold ${applicant.resume ? 'text-sky-700' : 'text-gray-400'}`}>{applicant.resume ? 'Uploaded' : 'Missing'}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Quiz</span>
                              <span className={`font-semibold ${quizCount > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {quizCount > 0 ? `${quizCount} responses` : 'Pending'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Interview</span>
                              <span className={`font-semibold text-right ${application.interview_scheduled_at ? 'text-violet-700' : 'text-gray-400'}`}>
                                {application.interview_scheduled_at ? formatDateTime(application.interview_scheduled_at) : 'Not scheduled'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-2">
                              <div className="rounded-xl bg-gray-50 p-2 text-center">
                                <p className="font-bold text-gray-900">{scoreNumber(application.similarity_score)}%</p>
                                <p className="text-[11px] text-gray-500">Resume</p>
                              </div>
                              <div className="rounded-xl bg-gray-50 p-2 text-center">
                                <p className="font-bold text-gray-900">{scoreNumber(application.skill_gap_score)}%</p>
                                <p className="text-[11px] text-gray-500">Skills</p>
                              </div>
                              <div className="rounded-xl bg-gray-50 p-2 text-center">
                                <p className="font-bold text-gray-900">{scoreNumber(application.soft_skill_score)}%</p>
                                <p className="text-[11px] text-gray-500">Soft</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Required skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {required.length > 0 ? required.map((skill) => (
                                <span key={skill} className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold">
                                  {skill}
                                </span>
                              )) : <span className="text-xs text-gray-400">No skills listed</span>}
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Profile skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {profileSkills.length > 0 ? profileSkills.map((skill) => (
                                <span key={skill} className="rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 text-[11px] font-semibold">
                                  {skill}
                                </span>
                              )) : <span className="text-xs text-gray-400">No skills added</span>}
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Missing skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {missing.length > 0 ? missing.map((skill) => (
                                <span key={skill} className="rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[11px] font-semibold">
                                  {skill}
                                </span>
                              )) : <span className="text-xs text-emerald-600 font-semibold">No major gaps</span>}
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <p className="text-xs font-bold uppercase text-gray-400">Recruiter note</p>
                              <span className="text-xs font-bold text-amber-700">
                                {application.company_rating ? `${application.company_rating}/5` : 'No rating'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                              {application.company_notes || 'No private notes saved.'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => openCompareDetail(application)}
                            className="mt-4 w-full h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                          >
                            Open detail
                          </button>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {interviewModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/45 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {interviewModal.application?.interview_scheduled_at ? 'Update interview' : 'Schedule interview'}
                  </h2>
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

      {decision && (
        <div className="fixed inset-0 z-50 bg-gray-900/45 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  decision.action === 'shortlist'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
                >
                  {decision.action === 'shortlist' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {decision.action === 'shortlist' ? 'Shortlist candidate?' : 'Reject candidate?'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{candidateName(decision.application)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDecision}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Close decision confirmation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                {decision.action === 'shortlist'
                  ? 'This candidate will move into your shortlisted pipeline and receive an application update.'
                  : 'This candidate will be marked as rejected and receive an application update.'}
              </p>
              <div className="mt-5 flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDecision}
                  className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={confirmDecision}
                  className={`h-10 px-4 rounded-xl text-white text-sm font-semibold disabled:opacity-70 flex items-center justify-center gap-2 ${
                    decision.action === 'shortlist' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : decision.action === 'shortlist' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {decision.action === 'shortlist' ? 'Shortlist' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  )
}

export default CompanyApplicants
