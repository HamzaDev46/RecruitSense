import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Briefcase, ClipboardList, Star, TrendingUp, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalJobs: 0, myApplications: 0, shortlisted: 0, savedJobs: 0 })
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, appsRes, savedJobsRes] = await Promise.all([
          api.get('/jobs'),
          api.get('/my-applications'),
          api.get('/saved-jobs')
        ])
        const jobs = jobsRes.data
        const apps = appsRes.data
        const savedJobs = savedJobsRes.data
        setStats({
          totalJobs: jobs.length,
          myApplications: apps.length,
          shortlisted: apps.filter(a => a.status === 'shortlisted').length,
          savedJobs: savedJobs.length
        })
        setRecentJobs(jobs.slice(0, 5))
        setRecentApps(apps.slice(0, 3))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusColor = (status) => {
    if (status === 'shortlisted') return 'bg-emerald-100 text-emerald-700'
    if (status === 'rejected') return 'bg-red-100 text-red-600'
    return 'bg-amber-100 text-amber-700'
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-full opacity-10">
            <div className="w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold mb-1">{user?.name}</h1>
            <p className="text-indigo-200 text-sm">Your AI-powered job search dashboard</p>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Available Jobs', value: stats.totalJobs, icon: <Briefcase className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/jobs' },
            { label: 'My Applications', value: stats.myApplications, icon: <ClipboardList className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50', path: '/my-applications' },
            { label: 'Saved Jobs', value: stats.savedJobs, icon: <Bookmark className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50', path: '/saved-jobs' },
            { label: 'Shortlisted', value: stats.shortlisted, icon: <Star className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/my-applications' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(stat.path)}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Content - 2 Column */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left - Job Feed (LinkedIn style) */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Latest Job Openings</h2>
                <button
                  onClick={() => navigate('/jobs')}
                  className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center gap-1"
                >
                  See all <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="p-6 space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No jobs available yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                      {/* Company Initial Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {job.company?.name?.charAt(0) || job.title?.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{job.title}</p>
                        <p className="text-sm text-gray-500 truncate">{job.company?.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {job.required_skills?.split(',').slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`) }}
                        className="flex-shrink-0 text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/resume')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 transition-all text-sm font-medium group"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  Upload Resume
                </button>
                <button
                  onClick={() => navigate('/jobs')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-all text-sm font-medium group"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  Browse All Jobs
                </button>
                <button
                  onClick={() => navigate('/saved-jobs')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 text-gray-700 hover:text-sky-600 transition-all text-sm font-medium group"
                >
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                    <Bookmark className="w-4 h-4 text-sky-600" />
                  </div>
                  Saved Jobs
                </button>
                <button
                  onClick={() => navigate('/my-applications')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 transition-all text-sm font-medium group"
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                  </div>
                  My Applications
                </button>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Recent Applications</h3>
                <button
                  onClick={() => navigate('/my-applications')}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  View all
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : recentApps.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{app.job_posting?.title || 'Job'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      {app.final_score > 0 && (
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`text-lg font-bold ${getScoreColor(app.final_score)}`}>
                            {app.final_score}%
                          </p>
                          <p className="text-xs text-gray-400">Match</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
