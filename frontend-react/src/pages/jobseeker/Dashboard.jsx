import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const initialStats = {
  totalJobs: 0,
  myApplications: 0,
  savedJobs: 0,
  shortlisted: 0,
  pending: 0,
  rejected: 0,
  profileViews: 0,
  postImpressions: 0,
  searchAppearances: 0,
  connections: 0,
  pendingInvitations: 0,
  unreadNotifications: 0,
  averageScore: 0,
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(initialStats)
  const [profileStrength, setProfileStrength] = useState(0)
  const [profileTasks, setProfileTasks] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/jobseeker')
        const summary = res.data || {}
        const strength = summary.profile_strength || {}

        setStats({ ...initialStats, ...(summary.stats || {}) })
        setProfileStrength(strength.completion || 0)
        setProfileTasks(strength.missing_tasks || [])
        setRecentJobs(summary.recent_jobs || [])
        setRecentApps(summary.recent_applications || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const pipelineTotal = Math.max(stats.myApplications, 1)
  const pipeline = useMemo(() => ([
    { label: 'Pending', value: stats.pending, color: 'bg-amber-500' },
    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-emerald-500' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-500' },
  ]), [stats.pending, stats.rejected, stats.shortlisted])

  const getStatusColor = (status) => {
    if (status === 'shortlisted') return 'bg-emerald-100 text-emerald-700'
    if (status === 'rejected') return 'bg-red-100 text-red-600'
    if (status === 'withdrawn') return 'bg-gray-100 text-gray-600'
    return 'bg-amber-100 text-amber-700'
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-72 h-full opacity-10">
            <div className="w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Welcome back</p>
              <h1 className="text-2xl font-bold mb-1">{user?.name}</h1>
              <p className="text-indigo-100 text-sm">Track your job search, profile reach, and network activity.</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-full bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50"
            >
              Improve profile
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Available Jobs', value: stats.totalJobs, icon: <Briefcase className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/jobs' },
            { label: 'Applications', value: stats.myApplications, icon: <ClipboardList className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50', path: '/my-applications' },
            { label: 'Saved Jobs', value: stats.savedJobs, icon: <Bookmark className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50', path: '/saved-jobs' },
            { label: 'Shortlisted', value: stats.shortlisted, icon: <Star className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/my-applications' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
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

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Profile Views', value: stats.profileViews, icon: <Eye className="w-5 h-5" />, path: '/profile' },
            { label: 'Post Impressions', value: stats.postImpressions, icon: <BarChart3 className="w-5 h-5" />, path: '/feed' },
            { label: 'Connections', value: stats.connections, icon: <Users className="w-5 h-5" />, path: '/network' },
            { label: 'Notifications', value: stats.unreadNotifications, icon: <Bell className="w-5 h-5" />, path: '/notifications' },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="bg-white rounded-2xl p-4 border border-gray-100 text-left hover:border-sky-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-gray-500">{stat.icon}</div>
                <span className="text-2xl font-bold text-gray-900">{loading ? '-' : stat.value}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Application Pipeline</h2>
                  <span className="text-sm text-gray-500">{stats.myApplications} total</span>
                </div>
                <div className="space-y-4">
                  {pipeline.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <span className="text-gray-500">{loading ? '-' : item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full ${item.color}`}
                          style={{ width: `${Math.round((item.value / pipelineTotal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Profile Strength</h2>
                  <span className="text-2xl font-bold text-gray-900">{loading ? '-' : `${profileStrength}%`}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-600"
                    style={{ width: `${profileStrength}%` }}
                  />
                </div>
                <div className="mt-4">
                  {profileTasks.length === 0 ? (
                    <p className="text-sm text-emerald-600 font-semibold">Your profile is complete.</p>
                  ) : (
                    <div className="space-y-2">
                      {profileTasks.slice(0, 3).map((task) => (
                        <button
                          key={task}
                          onClick={() => navigate(task === 'Upload resume' ? '/resume' : '/profile')}
                          className="w-full text-left text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-2"
                        >
                          <ChevronRight className="w-4 h-4" />
                          {task}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                  {[1, 2, 3].map((item) => <div key={item} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
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
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {job.company?.name?.charAt(0) || job.title?.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{job.title}</p>
                        <p className="text-sm text-gray-500 truncate">{job.company?.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {job.required_skills?.split(',').slice(0, 3).map((skill, index) => (
                            <span key={index} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(event) => { event.stopPropagation(); navigate(`/jobs/${job.id}`) }}
                        className="flex-shrink-0 text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Upload Resume', path: '/resume', icon: <FileText className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-100', hover: 'hover:bg-indigo-50 hover:text-indigo-600' },
                  { label: 'Recommended Jobs', path: '/recommended-jobs', icon: <Sparkles className="w-4 h-4 text-fuchsia-600" />, bg: 'bg-fuchsia-100', hover: 'hover:bg-fuchsia-50 hover:text-fuchsia-600' },
                  { label: 'Browse All Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-100', hover: 'hover:bg-purple-50 hover:text-purple-600' },
                  { label: 'Saved Jobs', path: '/saved-jobs', icon: <Bookmark className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-100', hover: 'hover:bg-sky-50 hover:text-sky-600' },
                  { label: 'My Applications', path: '/my-applications', icon: <ClipboardList className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-100', hover: 'hover:bg-emerald-50 hover:text-emerald-600' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-gray-700 transition-all text-sm font-medium group ${action.hover}`}
                  >
                    <div className={`w-8 h-8 ${action.bg} rounded-lg flex items-center justify-center`}>
                      {action.icon}
                    </div>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

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
                  {[1, 2].map((item) => <div key={item} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
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

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Avg. match</p>
                  <p className="text-xl font-bold text-gray-900">{stats.averageScore ? `${stats.averageScore}%` : '-'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Invites</p>
                  <p className="text-xl font-bold text-gray-900">{stats.pendingInvitations}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Search views</p>
                  <p className="text-xl font-bold text-gray-900">{stats.searchAppearances}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-gray-500">Network</p>
                  <p className="text-xl font-bold text-gray-900">{stats.connections}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
