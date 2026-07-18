import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Award,
  Brain,
  Briefcase,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  Search,
  Send,
  TrendingUp,
  Undo2,
  X,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'withdrawn', label: 'Withdrawn' },
]

const numberValue = (value) => Number(value || 0)

const formatDate = (date) => {
  if (!date) return 'Not available'

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const statusConfig = (status) => {
  if (status === 'shortlisted') {
    return {
      icon: CheckCircle,
      label: 'Shortlisted',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      nextStep: 'Recruiter selected your application. Check notifications or email for the next step.',
    }
  }

  if (status === 'rejected') {
    return {
      icon: XCircle,
      label: 'Rejected',
      className: 'bg-red-50 text-red-600 border-red-200',
      nextStep: 'Review the missing skills and keep improving your profile before applying again.',
    }
  }

  if (status === 'withdrawn') {
    return {
      icon: Undo2,
      label: 'Withdrawn',
      className: 'bg-gray-50 text-gray-600 border-gray-200',
      nextStep: 'You withdrew this application. You can apply again from the job details page.',
    }
  }

  return {
    icon: Clock,
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    nextStep: 'Your application is waiting for company review.',
  }
}

const scoreColor = (score) => {
  const value = numberValue(score)
  if (value === 0) return 'text-gray-400'
  if (value >= 70) return 'text-emerald-600'
  if (value >= 40) return 'text-amber-500'
  return 'text-red-500'
}

const scoreBoxClass = (score) => {
  const value = numberValue(score)
  if (value >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (value >= 40) return 'bg-amber-50 text-amber-700 border-amber-100'
  if (value > 0) return 'bg-red-50 text-red-600 border-red-100'
  return 'bg-gray-50 text-gray-500 border-gray-100'
}

const ScoreBar = ({ label, value, weight }) => {
  const score = numberValue(value)

  return (
    <div>
      <div className="flex justify-between gap-3 text-xs mb-1">
        <span className="text-gray-500">{label} ({weight})</span>
        <span className={`font-semibold ${scoreColor(score)}`}>{score ? `${score}%` : 'N/A'}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

const TimelineStep = ({ active, done, label, detail, icon: Icon }) => (
  <div className="flex gap-3">
    <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
      done
        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
        : active
          ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
          : 'bg-gray-50 border-gray-200 text-gray-400'
    }`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className={`text-sm font-semibold ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
    </div>
  </div>
)

const MyApplications = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [quizModal, setQuizModal] = useState({
    open: false,
    application: null,
    questions: [],
    answers: {},
    loading: false,
    submitting: false,
  })
  const [withdrawModal, setWithdrawModal] = useState({
    open: false,
    application: null,
    loading: false,
  })

  useEffect(() => {
    let active = true

    const fetchApplications = async () => {
      try {
        const res = await api.get('/my-applications')
        if (active) setApplications(res.data || [])
      } catch {
        if (active) toast.error('Failed to load applications')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchApplications()

    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const scored = applications.filter((app) => numberValue(app.final_score) > 0)
    const average = scored.length
      ? Math.round(scored.reduce((total, app) => total + numberValue(app.final_score), 0) / scored.length)
      : 0

    return {
      total: applications.length,
      pending: applications.filter((app) => app.status === 'pending').length,
      shortlisted: applications.filter((app) => app.status === 'shortlisted').length,
      withdrawn: applications.filter((app) => app.status === 'withdrawn').length,
      average,
    }
  }, [applications])

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase()

    return applications.filter((app) => {
      const job = app.job_posting
      const company = job?.company
      const matchesFilter = activeFilter === 'all' || app.status === activeFilter
      const matchesSearch = !query ||
        job?.title?.toLowerCase().includes(query) ||
        company?.name?.toLowerCase().includes(query) ||
        app.skill_gaps?.some((gap) => gap.missing_skill?.toLowerCase().includes(query))

      return matchesFilter && matchesSearch
    })
  }, [activeFilter, applications, search])

  const updateApplication = (applicationId, patch) => {
    setApplications((current) => current.map((app) => (
      app.id === applicationId ? { ...app, ...patch } : app
    )))
  }

  const openQuiz = async (application) => {
    const companyId = application.job_posting?.company_id || application.job_posting?.company?.id

    if (!companyId) {
      toast.error('Company quiz is not available for this application')
      return
    }

    setQuizModal({
      open: true,
      application,
      questions: [],
      answers: {},
      loading: true,
      submitting: false,
    })

    try {
      const res = await api.get(`/companies/${companyId}/quiz-questions`)
      setQuizModal((current) => ({
        ...current,
        questions: res.data || [],
        loading: false,
      }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load quiz')
      setQuizModal((current) => ({
        ...current,
        open: false,
        loading: false,
      }))
    }
  }

  const closeQuiz = () => {
    if (quizModal.submitting) return

    setQuizModal({
      open: false,
      application: null,
      questions: [],
      answers: {},
      loading: false,
      submitting: false,
    })
  }

  const selectAnswer = (questionId, answer) => {
    setQuizModal((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: answer,
      },
    }))
  }

  const submitQuiz = async () => {
    const unanswered = quizModal.questions.find((question) => !quizModal.answers[question.id])

    if (unanswered) {
      toast.error('Please answer every quiz question')
      return
    }

    setQuizModal((current) => ({ ...current, submitting: true }))

    try {
      const payload = {
        answers: quizModal.questions.map((question) => ({
          question_id: question.id,
          selected_answer: quizModal.answers[question.id],
        })),
      }
      const res = await api.post(`/applications/${quizModal.application.id}/submit-quiz`, payload)

      updateApplication(quizModal.application.id, {
        soft_skill_score: res.data.soft_skill_score,
        final_score: res.data.final_score,
        quiz_responses_count: quizModal.questions.length,
      })
      toast.success(`Quiz submitted. Soft skill score: ${res.data.soft_skill_score}%`)
      closeQuiz()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz')
    } finally {
      setQuizModal((current) => (
        current.open ? { ...current, submitting: false } : current
      ))
    }
  }

  const openWithdraw = (application) => {
    setWithdrawModal({
      open: true,
      application,
      loading: false,
    })
  }

  const closeWithdraw = () => {
    if (withdrawModal.loading) return

    setWithdrawModal({
      open: false,
      application: null,
      loading: false,
    })
  }

  const confirmWithdraw = async () => {
    if (!withdrawModal.application) return

    setWithdrawModal((current) => ({ ...current, loading: true }))

    try {
      const res = await api.post(`/applications/${withdrawModal.application.id}/withdraw`)
      updateApplication(withdrawModal.application.id, res.data.application)
      toast.success('Application withdrawn')
      closeWithdraw()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application')
      setWithdrawModal((current) => ({ ...current, loading: false }))
    }
  }

  const renderTimeline = (app) => {
    const finalScore = numberValue(app.final_score)
    const quizSubmitted = numberValue(app.quiz_responses_count) > 0 ||
      (app.soft_skill_score !== null && app.soft_skill_score !== undefined)
    const reviewed = app.status === 'shortlisted' || app.status === 'rejected'
    const withdrawn = app.status === 'withdrawn'

    return (
      <div className="space-y-4">
        <TimelineStep
          done
          icon={FileText}
          label="Application submitted"
          detail={`Applied on ${formatDate(app.created_at)}`}
        />
        <TimelineStep
          done={finalScore > 0}
          active={finalScore === 0}
          icon={TrendingUp}
          label="AI resume analysis"
          detail={finalScore > 0 ? `Final match score is ${finalScore}%` : 'Analysis is pending'}
        />
        <TimelineStep
          done={quizSubmitted}
          active={!quizSubmitted}
          icon={Brain}
          label="Soft skills quiz"
          detail={quizSubmitted ? `Quiz score is ${numberValue(app.soft_skill_score)}%` : 'Complete quiz to unlock the 20% score component'}
        />
        <TimelineStep
          done={reviewed}
          active={app.status === 'pending'}
          icon={Briefcase}
          label="Company review"
          detail={withdrawn ? 'Application was withdrawn before company review' : reviewed ? 'Recruiter has reviewed this application' : 'Waiting for recruiter decision'}
        />
        <TimelineStep
          done={app.status === 'shortlisted'}
          active={app.status === 'rejected' || withdrawn}
          icon={Award}
          label="Final update"
          detail={statusConfig(app.status).nextStep}
        />
      </div>
    )
  }

  const answeredQuizCount = quizModal.questions.filter((question) => quizModal.answers[question.id]).length

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Tracker</h1>
            <p className="text-gray-500 text-sm mt-1">Track your job applications, AI scores, and recruiter updates.</p>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            <Briefcase className="w-4 h-4" />
            Browse jobs
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Total applications</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Pending review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Shortlisted</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.shortlisted}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Withdrawn</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.withdrawn}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Average match</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.average}%</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                    activeFilter === filter.key
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applications..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-14 text-center">
            <ClipboardList className="w-14 h-14 mx-auto mb-4 text-gray-200" />
            <h3 className="font-bold text-gray-800 mb-2">No applications found</h3>
            <p className="text-gray-500 text-sm">Try another filter or apply to a job from Browse Jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app, index) => {
              const job = app.job_posting
              const company = job?.company
              const status = statusConfig(app.status)
              const StatusIcon = status.icon
              const isExpanded = expanded === app.id
              const finalScore = numberValue(app.final_score)
              const skillGaps = app.skill_gaps || []
              const quizSubmitted = numberValue(app.quiz_responses_count) > 0 ||
                (app.soft_skill_score !== null && app.soft_skill_score !== undefined)

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {company?.name?.charAt(0) || job?.title?.charAt(0) || 'J'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{job?.title || 'Job Position'}</p>
                      <p className="text-sm text-gray-500 truncate">{company?.name || 'Company'}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Applied {formatDate(app.created_at)}
                      </p>
                    </div>

                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${status.className}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </div>

                    <div className={`text-center flex-shrink-0 w-24 border rounded-xl px-3 py-2 ${scoreBoxClass(finalScore)}`}>
                      <p className="text-2xl font-bold">{finalScore ? `${finalScore}%` : '--'}</p>
                      <p className="text-xs font-semibold">Match</p>
                    </div>

                    <button
                      onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                      aria-label={isExpanded ? 'Collapse application' : 'Expand application'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-5 pb-5 border-t border-gray-50"
                    >
                      <div className="pt-5 grid lg:grid-cols-[1fr_1fr] gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            Score Breakdown
                          </h4>
                          <div className="space-y-3">
                            <ScoreBar label="Resume Similarity" weight="50%" value={app.similarity_score} />
                            <ScoreBar label="Skill Match" weight="30%" value={app.skill_gap_score} />
                            <ScoreBar label="Soft Skills Quiz" weight="20%" value={app.soft_skill_score} />
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="font-bold text-gray-900">Final Score</span>
                            <span className={`font-bold text-xl ${scoreColor(finalScore)}`}>{finalScore || 0}%</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-4">Application Timeline</h4>
                          {renderTimeline(app)}
                        </div>
                      </div>

                      <div className="mt-5 pt-5 border-t border-gray-100 grid lg:grid-cols-[1fr_auto] gap-4 lg:items-end">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Skill Analysis
                          </h4>
                          {skillGaps.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {skillGaps.map((gap) => (
                                  <span key={gap.id || gap.missing_skill} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full font-semibold">
                                    {gap.missing_skill}
                                  </span>
                                ))}
                              </div>
                              <p className="text-sm text-gray-500">
                                Improve these skills to increase your match score for similar jobs.
                              </p>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                              <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                No skill gaps found for this application.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap lg:flex-col gap-2 lg:items-stretch">
                          {app.status === 'withdrawn' ? (
                            <div className="px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm font-semibold flex items-center justify-center gap-2">
                              <Undo2 className="w-4 h-4" />
                              Withdrawn
                            </div>
                          ) : quizSubmitted ? (
                            <div className="px-4 py-2.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Quiz {numberValue(app.soft_skill_score)}%
                            </div>
                          ) : app.status === 'pending' ? (
                            <button
                              onClick={() => openQuiz(app)}
                              className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                              <Brain className="w-4 h-4" />
                              Take soft skills quiz
                            </button>
                          ) : null}

                          {app.status === 'pending' && (
                            <button
                              onClick={() => openWithdraw(app)}
                              className="px-5 py-2.5 rounded-full border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Withdraw application
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/jobs/${job?.id}`)}
                            className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                          >
                            View job details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {quizModal.open && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Soft Skills Quiz</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {quizModal.application?.job_posting?.title || 'Application quiz'}
                </p>
              </div>
              <button
                onClick={closeQuiz}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                aria-label="Close quiz"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto">
              {quizModal.loading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">Loading quiz questions...</p>
                </div>
              ) : quizModal.questions.length === 0 ? (
                <div className="py-16 text-center">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900">No quiz available</h3>
                  <p className="text-sm text-gray-500 mt-1">This company has not added soft-skill questions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-indigo-900">Answer all questions to submit</p>
                      <p className="text-xs text-indigo-700 mt-1">This score contributes 20% to your final application match.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 text-sm font-bold">
                      {answeredQuizCount}/{quizModal.questions.length}
                    </span>
                  </div>

                  {quizModal.questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                            {question.category || 'Soft skill'}
                          </span>
                          <h3 className="font-bold text-gray-900 mt-1">
                            {index + 1}. {question.question_text}
                          </h3>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2">
                        {(Array.isArray(question.options) ? question.options : []).map((option) => {
                          const optionLabel = String(option)
                          const selected = quizModal.answers[question.id] === optionLabel

                          return (
                            <button
                              key={optionLabel}
                              onClick={() => selectAnswer(question.id, optionLabel)}
                              className={`text-left px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                                selected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200 hover:text-indigo-700'
                              }`}
                            >
                              {optionLabel}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {quizModal.questions.length > 0
                  ? `${quizModal.questions.length - answeredQuizCount} questions remaining`
                  : 'Quiz can be submitted once per application.'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeQuiz}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitQuiz}
                  disabled={
                    quizModal.loading ||
                    quizModal.submitting ||
                    quizModal.questions.length === 0 ||
                    answeredQuizCount !== quizModal.questions.length
                  }
                  className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {quizModal.submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {quizModal.submitting ? 'Submitting...' : 'Submit quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {withdrawModal.open && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Withdraw application?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {withdrawModal.application?.job_posting?.title || 'This application'}
                </p>
              </div>
              <button
                onClick={closeWithdraw}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                aria-label="Close withdraw confirmation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                This will remove your application from the company review queue. You can apply again later from the job details page.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-2">
              <button
                onClick={closeWithdraw}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmWithdraw}
                disabled={withdrawModal.loading}
                className="px-5 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
              >
                {withdrawModal.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Undo2 className="w-4 h-4" />
                )}
                {withdrawModal.loading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default MyApplications
