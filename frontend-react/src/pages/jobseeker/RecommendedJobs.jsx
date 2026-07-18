import { useEffect, useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck, Briefcase, CheckCircle2, Search, Sparkles, X, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'

const scoreColor = (score) => {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-100'
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-100'
  return 'text-red-600 bg-red-50 border-red-100'
}

const RecommendedJobs = () => {
  const navigate = useNavigate()
  const [candidateSkills, setCandidateSkills] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [applyingId, setApplyingId] = useState(null)

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/recommended-jobs')
      setCandidateSkills(res.data.candidate_skills || [])
      setRecommendations(res.data.recommendations || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    api.get('/recommended-jobs')
      .then((res) => {
        if (!active) return
        setCandidateSkills(res.data.candidate_skills || [])
        setRecommendations(res.data.recommendations || [])
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load recommendations')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return recommendations

    return recommendations.filter(({ job, matched_skills, missing_skills }) =>
      job?.title?.toLowerCase().includes(query) ||
      job?.company?.name?.toLowerCase().includes(query) ||
      matched_skills?.some((skill) => skill.includes(query)) ||
      missing_skills?.some((skill) => skill.includes(query))
    )
  }, [recommendations, search])

  const updateRecommendation = (jobId, patch) => {
    setRecommendations((current) => current.map((item) => (
      item.job.id === jobId ? { ...item, ...patch } : item
    )))
  }

  const toggleSave = async (jobId, isSaved) => {
    setSavingId(jobId)
    try {
      if (isSaved) {
        await api.delete(`/saved-jobs/${jobId}`)
        updateRecommendation(jobId, { is_saved: false })
        toast.success('Removed from saved jobs')
      } else {
        await api.post(`/saved-jobs/${jobId}`)
        updateRecommendation(jobId, { is_saved: true })
        toast.success('Job saved')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update saved job')
    } finally {
      setSavingId(null)
    }
  }

  const applyToJob = async (jobId) => {
    setApplyingId(jobId)
    try {
      await api.post(`/jobs/${jobId}/apply`)
      updateRecommendation(jobId, { has_applied: true })
      toast.success('Application submitted! AI is analyzing your resume...')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recommended Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">Jobs ranked by your profile and resume skills.</p>
          </div>
          <button
            onClick={loadRecommendations}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-900">Your detected skills</h2>
          </div>
          {candidateSkills.length === 0 ? (
            <p className="text-sm text-gray-500">Add skills in your profile or upload a resume to improve recommendations.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidateSkills.slice(0, 20).map((skill) => (
                <span key={skill} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recommendations, companies, matched skills..."
            className="w-full pl-12 pr-11 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-48 bg-white border border-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-bold text-gray-900">No recommendations found</h2>
            <p className="text-sm text-gray-500 mt-1">Try updating your profile skills or resume.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(({ job, match_score, matched_skills, missing_skills, is_saved, has_applied }) => (
              <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {job.company?.name?.charAt(0) || 'J'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-left">
                          <h2 className="text-lg font-bold text-gray-900 hover:text-indigo-600">{job.title}</h2>
                        </button>
                        <p className="text-sm text-gray-600 mt-0.5">{job.company?.name}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl border text-center ${scoreColor(match_score)}`}>
                        <p className="text-2xl font-bold">{match_score}%</p>
                        <p className="text-xs font-semibold">Match</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Matched skills
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {matched_skills.length === 0 ? (
                            <span className="text-sm text-gray-400">No direct matches yet</span>
                          ) : matched_skills.map((skill) => (
                            <span key={skill} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-amber-600" />
                          Missing skills
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {missing_skills.length === 0 ? (
                            <span className="text-sm text-emerald-600">No major gaps</span>
                          ) : missing_skills.slice(0, 6).map((skill) => (
                            <span key={skill} className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                      <button
                        onClick={() => applyToJob(job.id)}
                        disabled={applyingId === job.id || has_applied}
                        className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                      >
                        <Briefcase className="w-4 h-4" />
                        {has_applied ? 'Applied' : applyingId === job.id ? 'Applying...' : 'Apply'}
                      </button>

                      <button
                        onClick={() => toggleSave(job.id, is_saved)}
                        disabled={savingId === job.id}
                        className={`px-5 py-2.5 rounded-full border text-sm font-semibold flex items-center gap-2 ${
                          is_saved
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                        } disabled:opacity-60`}
                      >
                        {is_saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {is_saved ? 'Saved' : 'Save'}
                      </button>

                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default RecommendedJobs
