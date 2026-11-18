import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Medal,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'

const LIMIT_OPTIONS = [
  { label: 'First 10 (Top 10)', value: 10 },
  { label: 'First 25', value: 25 },
  { label: 'First 50', value: 50 },
  { label: 'First 100', value: 100 },
  { label: 'First 500', value: 500 },
  { label: 'First 1000', value: 1000 },
  { label: 'All Candidates', value: 999999 },
]

const scoreNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? Math.round(num) : 0
}

const scoreBadgeStyle = (score) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score >= 80) return 'bg-sky-50 text-sky-700 border-sky-200'
  if (score >= 70) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

const statusBadgeStyle = (status) => {
  switch (status) {
    case 'shortlisted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'screening':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'interview':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

const CompanyRankings = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [resumeAction, setResumeAction] = useState(null)

  // Filters
  const [limit, setLimit] = useState(10)
  const [selectedJob, setSelectedJob] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/company/applicants')
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []
      setApplications(data)
    } catch {
      toast.error('Failed to load candidate rankings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  // Unique job titles for filter dropdown
  const uniqueJobs = useMemo(() => {
    const map = new Map()
    applications.forEach((app) => {
      if (app.job_posting?.id && app.job_posting?.title) {
        map.set(app.job_posting.id, app.job_posting.title)
      }
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [applications])

  // Filtered and strictly sorted (highest to lowest score)
  const rankedCandidates = useMemo(() => {
    let list = [...applications]

    // Job filter
    if (selectedJob !== 'all') {
      list = list.filter((app) => String(app.job_id) === String(selectedJob))
    }

    // Status filter
    if (selectedStatus !== 'all') {
      list = list.filter((app) => app.status === selectedStatus)
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((app) => {
        const name = (app.job_seeker?.user?.name || '').toLowerCase()
        const email = (app.job_seeker?.user?.email || '').toLowerCase()
        const skills = (app.job_seeker?.skills || '').toLowerCase()
        return name.includes(q) || email.includes(q) || skills.includes(q)
      })
    }

    // Strictly sort by final_score descending
    list.sort((a, b) => {
      const scoreA = Number(a.final_score ?? a.similarity_score ?? 0)
      const scoreB = Number(b.final_score ?? b.similarity_score ?? 0)
      return scoreB - scoreA
    })

    return list
  }, [applications, selectedJob, selectedStatus, searchQuery])

  // Sliced to requested limit (e.g. Top 10, Top 100, All)
  const displayedCandidates = useMemo(() => {
    return rankedCandidates.slice(0, limit)
  }, [rankedCandidates, limit])

  // Status update (Shortlist / Reject)
  const handleUpdateStatus = async (applicationId, newStatus) => {
    setActionLoading(`${applicationId}-${newStatus}`)
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatus })
      toast.success(`Candidate marked as ${newStatus}`)
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      )
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update status to ${newStatus}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Resume view / download with auto-recovery
  const handleOpenResume = async (application, mode = 'view') => {
    if (!application?.job_seeker?.resume) {
      toast.error('Candidate has not uploaded a resume')
      return
    }

    setResumeAction(`${mode}-${application.id}`)
    try {
      const res = await api.get(`/applications/${application.id}/resume${mode === 'download' ? '?download=1' : ''}`, {
        responseType: 'blob',
      })
      const contentType = res.headers?.['content-type'] || 'application/pdf'
      const blob = new Blob([res.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)

      if (mode === 'view') {
        const opened = window.open(url, '_blank')
        if (!opened) {
          const link = document.createElement('a')
          link.href = url
          link.download = `${application.job_seeker?.user?.name || 'candidate'}-resume.pdf`
          document.body.appendChild(link)
          link.click()
          link.remove()
          toast.info('Popup blocked: resume downloaded directly')
        }
        window.setTimeout(() => window.URL.revokeObjectURL(url), 120_000)
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = `${application.job_seeker?.user?.name || 'candidate'}-resume.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      toast.error('Unable to retrieve resume file')
    } finally {
      setResumeAction(null)
    }
  }

  // Quick stats
  const totalCount = rankedCandidates.length
  const topScore = totalCount > 0 ? scoreNumber(rankedCandidates[0]?.final_score ?? rankedCandidates[0]?.similarity_score) : 0
  const pendingCount = rankedCandidates.filter((a) => a.status === 'pending').length
  const shortlistedCount = rankedCandidates.filter((a) => a.status === 'shortlisted').length

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                AI Score Leaderboard & Human-in-the-Loop Review
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Candidate Score Rankings
              </h1>
              <p className="text-sm text-indigo-100/90 max-w-2xl leading-relaxed">
                Candidates ranked strictly from top score to bottom score. Review applicants in order of match quality, inspect resumes, and manually shortlist or reject candidates with full hiring authority.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={fetchApplications}
                disabled={loading}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-semibold flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate('/company/applicants')}
                className="h-10 px-4 rounded-xl bg-white text-indigo-900 text-sm font-semibold hover:bg-indigo-50 shadow-md transition"
              >
                Go to Pipeline Board
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Ranked Pool</p>
              <p className="text-xl font-bold text-gray-900">{totalCount} Candidates</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Highest Match</p>
              <p className="text-xl font-bold text-emerald-600">{topScore}% Score</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Pending Review</p>
              <p className="text-xl font-bold text-amber-600">{pendingCount} Waiting</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Approved / Shortlisted</p>
              <p className="text-xl font-bold text-purple-600">{shortlistedCount} Selected</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidate name, email, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-9 px-3 text-sm rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LIMIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Job:</span>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="h-9 px-3 text-sm rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Jobs ({applications.length})</option>
                  {uniqueJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 px-3 text-sm rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="screening">Screening</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Showing Count Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>
              Showing <span className="font-bold text-gray-900">{displayedCandidates.length}</span> of <span className="font-bold text-gray-900">{totalCount}</span> ranked candidates
            </span>
            <span className="text-indigo-600 font-semibold">
              Sorted strictly: Highest Score → Lowest Score
            </span>
          </div>
        </div>

        {/* Candidate Ranking List */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Calculating and sorting candidate rankings...</p>
          </div>
        ) : displayedCandidates.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-900">No candidates match your filters</p>
            <p className="text-sm text-gray-500">Try adjusting your search query, position filter, or status.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedCandidates.map((application, index) => {
              const rank = index + 1
              const finalScore = scoreNumber(application.final_score ?? application.similarity_score)
              const simScore = scoreNumber(application.similarity_score)
              const skillScore = scoreNumber(application.skill_gap_score)
              const softScore = scoreNumber(application.soft_skill_score)
              const candidate = application.job_seeker?.user || {}
              const isShortlisted = application.status === 'shortlisted'
              const isRejected = application.status === 'rejected'

              // Medal rendering for top 3
              const rankBadge =
                rank === 1 ? (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/20">
                    🥇 #1
                  </div>
                ) : rank === 2 ? (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 font-black text-sm flex items-center justify-center shadow-md shadow-slate-400/20">
                    🥈 #2
                  </div>
                ) : rank === 3 ? (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-800/20">
                    🥉 #3
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center">
                    #{rank}
                  </div>
                )

              return (
                <div
                  key={application.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Rank & Candidate Details */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {rankBadge}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {candidate.name || 'Candidate'}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold capitalize ${statusBadgeStyle(application.status)}`}>
                          {application.status}
                        </span>
                        {rank <= 3 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                            Top Recommendation
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-indigo-600 mt-0.5">
                        {application.job_posting?.title || 'Applied Position'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                        <span>{candidate.email}</span>
                        {application.job_seeker?.phone && <span>• {application.job_seeker.phone}</span>}
                        {application.job_seeker?.education && <span>• {application.job_seeker.education}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Score Breakdown (50% Resume, 30% Skills, 20% Soft) */}
                  <div className="flex items-center gap-4 py-2 lg:py-0 border-y lg:border-y-0 border-gray-100 lg:px-4">
                    <div className="text-center min-w-[70px]">
                      <div className={`px-3 py-1.5 rounded-xl border text-xl font-extrabold ${scoreBadgeStyle(finalScore)}`}>
                        {finalScore}%
                      </div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Overall Match</p>
                    </div>

                    <div className="hidden sm:grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <p className="font-bold text-gray-800">{simScore}%</p>
                        <p className="text-[10px] text-gray-400">Resume (50%)</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <p className="font-bold text-gray-800">{skillScore}%</p>
                        <p className="text-[10px] text-gray-400">Skills (30%)</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                        <p className="font-bold text-gray-800">{softScore}%</p>
                        <p className="text-[10px] text-gray-400">Quiz (20%)</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Manual HR Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Resume Button */}
                    <button
                      type="button"
                      disabled={resumeAction !== null}
                      onClick={() => handleOpenResume(application, 'view')}
                      className="h-9 px-3 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center gap-1.5 transition"
                      title="View Verified PDF Resume"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Resume
                    </button>

                    {/* Download Resume Button */}
                    <button
                      type="button"
                      disabled={resumeAction !== null}
                      onClick={() => handleOpenResume(application, 'download')}
                      className="h-9 px-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center transition"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Shortlist Button (Approve) */}
                    <button
                      type="button"
                      disabled={isShortlisted || actionLoading !== null}
                      onClick={() => handleUpdateStatus(application.id, 'shortlisted')}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isShortlisted
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </button>

                    {/* Reject Button */}
                    <button
                      type="button"
                      disabled={isRejected || actionLoading !== null}
                      onClick={() => handleUpdateStatus(application.id, 'rejected')}
                      className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isRejected
                          ? 'bg-rose-100 text-rose-800 cursor-default'
                          : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {isRejected ? 'Rejected' : 'Reject'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}

export default CompanyRankings
