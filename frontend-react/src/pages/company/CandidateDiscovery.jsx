import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  MessageCircle,
  Send,
  Sparkles,
  FileText,
  Filter,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Award,
  GraduationCap
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'
import { useAuth } from '../../context/useAuth'

const initials = (name = 'User') => name
  .split(' ')
  .map((p) => p[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const CandidateDiscovery = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [popularSkills, setPopularSkills] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCandidates, setTotalCandidates] = useState(0)

  // Outreach Modal State
  const [outreachCandidate, setOutreachCandidate] = useState(null)
  const [outreachMessage, setOutreachMessage] = useState('')
  const [sendingOutreach, setSendingOutreach] = useState(false)

  const loadCandidates = async (targetPage = 1) => {
    setLoading(true)
    try {
      const params = {
        page: targetPage,
        per_page: 12,
      }
      if (search.trim()) params.search = search.trim()
      if (selectedSkill !== 'all') params.skill = selectedSkill
      if (selectedLocation !== 'all') params.location = selectedLocation

      const res = await api.get('/company/candidates', { params })
      setCandidates(res.data.data || [])
      setTotalCandidates(res.data.meta?.total || 0)
      setTotalPages(res.data.meta?.last_page || 1)
      setPage(res.data.meta?.current_page || 1)
      if (res.data.popular_skills) {
        setPopularSkills(res.data.popular_skills)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCandidates(1)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedSkill, selectedLocation])

  const openOutreachModal = (candidate) => {
    if (candidate.has_conversation && candidate.conversation_id) {
      navigate(`/messages?conversation=${candidate.conversation_id}`)
      return
    }

    const defaultMsg = `Hi ${candidate.name}, we came across your profile on RecruitSense and were very impressed with your background. We would love to connect regarding an exciting job opportunity with our team!`
    setOutreachCandidate(candidate)
    setOutreachMessage(defaultMsg)
  }

  const handleSendOutreach = async (e) => {
    e.preventDefault()
    if (!outreachCandidate || !outreachMessage.trim()) return

    setSendingOutreach(true)
    try {
      const res = await api.post(`/messages/start/${outreachCandidate.id}`, {
        message: outreachMessage.trim(),
        body: outreachMessage.trim(),
      })

      const convId = res.data.conversation?.id
      toast.success(`Message sent to ${outreachCandidate.name}!`)
      setOutreachCandidate(null)
      window.dispatchEvent(new CustomEvent('recruitsense-messages-updated'))

      if (convId) {
        navigate(`/messages?conversation=${convId}`)
      } else {
        loadCandidates(page)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send outreach message')
    } finally {
      setSendingOutreach(false)
    }
  }

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-950/10">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Talent Pool & Candidate Discovery
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Discover & Approach Candidates
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 leading-relaxed">
              Browse all verified job seekers across RecruitSense. View detailed profiles and initiate direct conversations with prospective talent.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate name, job title, skills, education, or keyword..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => loadCandidates(1)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Quick Skill Filter Chips */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Filter by Skill
              </span>
              {(selectedSkill !== 'all' || search) && (
                <button
                  onClick={() => {
                    setSelectedSkill('all')
                    setSearch('')
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Reset all filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedSkill('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all shrink-0 ${
                  selectedSkill === 'all'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Skills
              </button>
              {popularSkills.map((skill) => {
                const active = selectedSkill.toLowerCase() === skill.toLowerCase()
                return (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(active ? 'all' : skill)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all shrink-0 ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <p>
            Showing <strong className="text-gray-900">{candidates.length}</strong> of{' '}
            <strong className="text-gray-900">{totalCandidates}</strong> registered job seekers
          </p>
        </div>

        {/* Candidate Cards Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-9 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Candidates Found</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              We couldn't find any job seekers matching your search criteria. Try clearing some filters or searching for different skills.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setSelectedSkill('all')
                setSelectedLocation('all')
              }}
              className="mt-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-100 hover:border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Candidate Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {candidate.profile_image_url ? (
                      <img
                        src={candidate.profile_image_url}
                        alt={candidate.name}
                        className="w-12 h-12 rounded-full object-cover object-top border border-gray-100 shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {initials(candidate.name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3
                          onClick={() => navigate(`/profile/${candidate.id}`)}
                          className="font-bold text-gray-900 truncate text-base hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {candidate.name}
                        </h3>
                        {candidate.has_conversation && (
                          <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                        {candidate.headline}
                      </p>
                    </div>
                  </div>

                  {/* Badges Info */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3 pt-1 border-t border-gray-50">
                    {candidate.location && candidate.location !== 'Not specified' && (
                      <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {candidate.location}
                      </span>
                    )}
                    {candidate.experiences_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        {candidate.experiences_count} exp
                      </span>
                    )}
                    {candidate.has_resume && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <FileText className="w-3 h-3 text-emerald-500" />
                        Resume
                      </span>
                    )}
                  </div>

                  {/* Skills Pills */}
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {candidate.skills.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-indigo-50/70 border border-indigo-100 text-indigo-700 text-[11px] font-medium rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 text-[11px] rounded-md font-medium">
                          +{candidate.skills.length - 4}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic mb-4">No specific skills listed</p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${candidate.id}`)}
                    className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                    View Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => openOutreachModal(candidate)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      candidate.has_conversation
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {candidate.has_conversation ? 'Open Chat' : 'Approach'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => loadCandidates(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-gray-500 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadCandidates(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Direct Outreach Modal */}
      <AnimatePresence>
        {outreachCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Approach Candidate</h2>
                    <p className="text-xs text-gray-500">Send a direct message & connect</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOutreachCandidate(null)}
                  className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendOutreach} className="p-6 space-y-4">
                {/* Candidate Summary Card */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                  {outreachCandidate.profile_image_url ? (
                    <img
                      src={outreachCandidate.profile_image_url}
                      alt={outreachCandidate.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {initials(outreachCandidate.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{outreachCandidate.name}</p>
                    <p className="text-xs text-gray-500 truncate">{outreachCandidate.headline}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Your Message / Job Inquiry
                  </label>
                  <textarea
                    rows="4"
                    value={outreachMessage}
                    onChange={(e) => setOutreachMessage(e.target.value)}
                    required
                    placeholder="Write an introduction or explain why you are reaching out..."
                    className="w-full rounded-2xl border border-gray-200 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    This message will start a direct conversation thread with the candidate in Messages.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOutreachCandidate(null)}
                    disabled={sendingOutreach}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOutreach || !outreachMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60"
                  >
                    {sendingOutreach ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sendingOutreach ? 'Sending...' : 'Send & Start Chat'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CompanyLayout>
  )
}

export default CandidateDiscovery
