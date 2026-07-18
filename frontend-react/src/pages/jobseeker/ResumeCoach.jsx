import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  FileText,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  Upload,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'

const scoreClass = (score) => {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-100'
  if (score >= 60) return 'text-indigo-700 bg-indigo-50 border-indigo-100'
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-100'
  return 'text-red-600 bg-red-50 border-red-100'
}

const suggestionClass = (type) => {
  if (type === 'critical') return 'bg-red-50 border-red-100 text-red-700'
  if (type === 'keywords') return 'bg-amber-50 border-amber-100 text-amber-700'
  if (type === 'skills') return 'bg-indigo-50 border-indigo-100 text-indigo-700'
  return 'bg-gray-50 border-gray-100 text-gray-700'
}

const ResumeCoach = () => {
  const navigate = useNavigate()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadInsights = async () => {
    setLoading(true)
    try {
      const res = await api.get('/resume-insights')
      setInsights(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load resume insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    api.get('/resume-insights')
      .then((res) => {
        if (active) setInsights(res.data)
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load resume insights')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const completedChecklist = useMemo(() => {
    if (!insights?.checklist) return 0
    return insights.checklist.filter((item) => item.complete).length
  }, [insights])

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Coach</h1>
            <p className="text-sm text-gray-500 mt-1">Improve your resume using job requirements and application gaps.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/resume')}
              className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload resume
            </button>
            <button
              onClick={loadInsights}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-40 bg-white border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !insights ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-bold text-gray-900">No insights available</h2>
            <p className="text-sm text-gray-500 mt-1">Upload a resume and complete your profile to generate suggestions.</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 mb-6">
              <div className={`border rounded-xl p-6 ${scoreClass(insights.score)}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold opacity-80">Resume strength</p>
                    <p className="text-5xl font-black mt-2">{insights.score}%</p>
                    <p className="text-sm font-semibold mt-2">{insights.level}</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white/70 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
                <div className="mt-5 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full bg-current rounded-full" style={{ width: `${insights.score}%` }} />
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-gray-900">Resume status</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {insights.resume.uploaded ? insights.resume.file_name : 'No resume uploaded'}
                    </p>
                  </div>
                  {insights.resume.uploaded ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-bold">
                      Uploaded
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-sm font-bold">
                      Missing
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mt-5">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs font-semibold text-gray-500">Detected skills</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{insights.candidate_skills.length}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs font-semibold text-gray-500">Missing keywords</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{insights.missing_keywords.length}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs font-semibold text-gray-500">Checklist</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{completedChecklist}/{insights.checklist.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-6">
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Improvement checklist
                </h2>
                <div className="space-y-3">
                  {insights.checklist.map((item) => (
                    <div key={item.key} className="flex gap-3 rounded-xl border border-gray-100 p-3">
                      {item.complete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Suggested fixes
                </h2>
                {insights.suggestions.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 text-emerald-700">
                    <p className="font-bold">Looks solid</p>
                    <p className="text-sm mt-1">Keep your resume updated as your projects and skills grow.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.suggestions.map((suggestion) => (
                      <div key={`${suggestion.type}-${suggestion.title}`} className={`rounded-xl border p-3 ${suggestionClass(suggestion.type)}`}>
                        <p className="text-sm font-bold">{suggestion.title}</p>
                        <p className="text-xs mt-1 opacity-90">{suggestion.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Missing target keywords
                </h2>
                {insights.missing_keywords.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-700 text-sm font-semibold">
                    Your resume/profile covers the main target keywords.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {insights.missing_keywords.map((item) => (
                      <span key={item.skill} className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-sm font-semibold">
                        {item.skill}
                      </span>
                    ))}
                  </div>
                )}

                <h3 className="font-bold text-gray-900 flex items-center gap-2 mt-6 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Your detected skills
                </h3>
                {insights.candidate_skills.length === 0 ? (
                  <p className="text-sm text-gray-500">Add skills in your profile to improve resume matching.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {insights.candidate_skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Recent application gaps
                </h2>
                {insights.application_gaps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                    <AlertTriangle className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Apply to jobs to collect score and skill-gap feedback.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.application_gaps.map((gap) => (
                      <div key={gap.application_id} className="rounded-xl border border-gray-100 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{gap.job_title || 'Job application'}</p>
                            <p className="text-xs text-gray-500">{gap.company || 'Company'}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold">
                            {Number(gap.final_score || 0)}%
                          </span>
                        </div>
                        {gap.missing_skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {gap.missing_skills.slice(0, 5).map((skill) => (
                              <span key={skill} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-semibold">
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-600 font-semibold mt-3">No recorded gaps for this application.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ResumeCoach
