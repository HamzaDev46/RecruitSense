import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, TrendingUp, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const MyApplications = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/my-applications')
        setApplications(res.data)
      } catch {
        toast.error('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    fetchApps()
  }, [])

  const getStatusConfig = (status) => {
    if (status === 'shortlisted') return {
      icon: <CheckCircle className="w-4 h-4" />,
      class: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      label: 'Shortlisted'
    }
    if (status === 'rejected') return {
      icon: <XCircle className="w-4 h-4" />,
      class: 'bg-red-100 text-red-600 border border-red-200',
      label: 'Rejected'
    }
    return {
      icon: <Clock className="w-4 h-4" />,
      class: 'bg-amber-100 text-amber-700 border border-amber-200',
      label: 'Pending'
    }
  }

  const getScoreColor = (score) => {
    if (!score || score === 0) return 'text-gray-400'
    if (score >= 70) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const ScoreBar = ({ label, value, color }) => (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className={`font-semibold ${color}`}>{value ? `${value}%` : 'N/A'}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
          style={{ width: `${value || 0}%` }}
        />
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 text-sm mt-1">{applications.length} total applications</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <ClipboardList className="w-14 h-14 mx-auto mb-4 text-gray-200" />
            <h3 className="font-bold text-gray-700 mb-2">No applications yet</h3>
            <p className="text-gray-400 text-sm">Browse jobs and apply to see your applications here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app, index) => {
              const status = getStatusConfig(app.status)
              const isExpanded = expanded === app.id

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all overflow-hidden"
                >
                  {/* Main Row */}
                  <div className="flex items-center gap-4 p-5">

                    {/* Company Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {app.job_posting?.title?.charAt(0) || 'J'}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {app.job_posting?.title || 'Job Position'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {app.job_posting?.company?.name || 'Company'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${status.class}`}>
                      {status.icon}
                      {status.label}
                    </div>

                    {/* Final Score */}
                    <div className="text-right flex-shrink-0 w-20">
                      {app.final_score > 0 ? (
                        <>
                          <p className={`text-2xl font-bold ${getScoreColor(app.final_score)}`}>
                            {app.final_score}%
                          </p>
                          <p className="text-xs text-gray-400">Match</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">No score</p>
                      )}
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-5 pb-5 border-t border-gray-50"
                    >
                      <div className="pt-4 grid grid-cols-2 gap-6">

                        {/* Score Breakdown */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            Score Breakdown
                          </h4>
                          <ScoreBar
                            label="Resume Similarity (50%)"
                            value={app.similarity_score}
                            color={getScoreColor(app.similarity_score)}
                          />
                          <ScoreBar
                            label="Skill Match (30%)"
                            value={app.skill_gap_score}
                            color={getScoreColor(app.skill_gap_score)}
                          />
                          <ScoreBar
                            label="Soft Skills Quiz (20%)"
                            value={app.soft_skill_score}
                            color={getScoreColor(app.soft_skill_score)}
                          />
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                              <span className="font-bold text-gray-900">Final Score</span>
                              <span className={`font-bold text-lg ${getScoreColor(app.final_score)}`}>
                                {app.final_score || 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Skill Gap Info */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Skill Analysis</h4>
                          {app.skill_gaps && app.skill_gaps.length > 0 ? (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Missing Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {app.skill_gaps.map((gap, i) => (
                                  <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg">
                                    {gap.missing_skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                No skill gaps - great match!
                              </p>
                            </div>
                          )}

                          <div className="mt-3">
                            <p className="text-xs text-gray-400">
                              Applied on {new Date(app.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </p>
                          </div>
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
    </DashboardLayout>
  )
}

export default MyApplications
