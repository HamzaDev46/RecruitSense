import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Bookmark,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  Newspaper,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import CompanyLogo from '../../components/CompanyLogo'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const initialStats = {
  totalJobs: 0,
  myApplications: 0,
  savedJobs: 0,
  shortlisted: 0,
  inProgress: 0,
  pending: 0,
  rejected: 0,
  profileViews: 0,
  postImpressions: 0,
  searchAppearances: 0,
  connections: 0,
  pendingInvitations: 0,
  averageScore: 0,
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(initialStats)
  const [profileStrength, setProfileStrength] = useState(0)
  const [profileTasks, setProfileTasks] = useState([])
  const [profileSteps, setProfileSteps] = useState([])
  const [nextProfileTask, setNextProfileTask] = useState(null)
  const [completedProfileTasks, setCompletedProfileTasks] = useState(0)
  const [totalProfileTasks, setTotalProfileTasks] = useState(0)
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApps, setRecentApps] = useState([])
  const [feedPosts, setFeedPosts] = useState([])
  const [mobileFeedEnabled, setMobileFeedEnabled] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  ))
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
        setProfileSteps(strength.tasks || [])
        setNextProfileTask(strength.next_task || null)
        setCompletedProfileTasks(strength.completed_tasks || 0)
        setTotalProfileTasks(strength.total_tasks || 0)
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const query = window.matchMedia('(max-width: 767px)')
    const updateMobileFeed = () => setMobileFeedEnabled(query.matches)

    updateMobileFeed()
    query.addEventListener('change', updateMobileFeed)

    return () => query.removeEventListener('change', updateMobileFeed)
  }, [])

  useEffect(() => {
    if (!mobileFeedEnabled) return undefined

    let active = true

    api.get('/posts/feed')
      .then((res) => {
        if (active) setFeedPosts(res.data || [])
      })
      .catch(() => {
        if (active) setFeedPosts([])
      })

    return () => {
      active = false
    }
  }, [mobileFeedEnabled])

  const pipelineTotal = Math.max(stats.myApplications, 1)
  const pipeline = useMemo(() => ([
    { label: 'Pending', value: stats.pending, color: 'bg-amber-500' },
    { label: 'In progress', value: stats.inProgress, color: 'bg-sky-500' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-500' },
  ]), [stats.inProgress, stats.pending, stats.rejected])

  const profileChecklist = useMemo(() => {
    if (profileSteps.length > 0) return profileSteps

    return profileTasks.map((task) => ({
      id: task,
      task,
      description: 'Complete this step to improve your profile.',
      complete: false,
      action_path: task === 'Upload resume' ? '/resume' : '/profile?setup=profile',
    }))
  }, [profileSteps, profileTasks])

  const visibleProfileChecklist = profileChecklist.slice(0, 5)
  const nextSetupTask = nextProfileTask || profileChecklist.find((task) => !task.complete)
  const completedSteps = totalProfileTasks > 0
    ? completedProfileTasks
    : profileChecklist.filter((task) => task.complete).length
  const totalSteps = totalProfileTasks || profileChecklist.length

  const openSetupTask = (task) => {
    if (!task) return

    navigate(task.action_path || (task.task === 'Upload resume' ? '/resume' : '/profile?setup=profile'))
  }

  const getStatusColor = (status) => {
    if (status === 'screening') return 'bg-sky-100 text-sky-700'
    if (status === 'shortlisted') return 'bg-emerald-100 text-emerald-700'
    if (status === 'interview') return 'bg-indigo-100 text-indigo-700'
    if (status === 'offered') return 'bg-violet-100 text-violet-700'
    if (status === 'hired') return 'bg-teal-100 text-teal-700'
    if (status === 'rejected') return 'bg-red-100 text-red-600'
    if (status === 'withdrawn') return 'bg-gray-100 text-gray-600'
    return 'bg-amber-100 text-amber-700'
  }

  const statusLabel = (status) => ({
    pending: 'Pending',
    screening: 'Screening',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offered: 'Offered',
    hired: 'Hired',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  }[status] || 'Pending')

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-500'
  }

  const mainStatCards = [
    { label: 'Available Jobs', value: stats.totalJobs, icon: <Briefcase className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/jobs' },
    { label: 'Applications', value: stats.myApplications, icon: <ClipboardList className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50', path: '/my-applications' },
    { label: 'Saved Jobs', value: stats.savedJobs, icon: <Bookmark className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50', path: '/saved-jobs' },
    { label: 'In Progress', value: stats.inProgress, icon: <Star className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50', path: '/my-applications' },
  ]

  const activityStatCards = [
    { label: 'Profile Views', value: stats.profileViews, icon: <Eye className="w-5 h-5" />, color: 'text-slate-600', bg: 'bg-slate-50', path: '/profile' },
    { label: 'Post Impressions', value: stats.postImpressions, icon: <BarChart3 className="w-5 h-5" />, color: 'text-sky-600', bg: 'bg-sky-50', path: '/feed' },
    { label: 'Connections', value: stats.connections, icon: <Users className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50', path: '/network' },
  ]

  const mobileProfileShortcuts = [...mainStatCards, ...activityStatCards]
  const mobileMixedItems = useMemo(() => {
    const posts = feedPosts.slice(0, 5).map((post) => ({ id: `post-${post.id}`, type: 'post', post }))
    const jobs = recentJobs.slice(0, 5).map((job) => ({ id: `job-${job.id}`, type: 'job', job }))
    const mixed = []
    const total = Math.max(posts.length, jobs.length)

    for (let index = 0; index < total; index += 1) {
      if (posts[index]) mixed.push(posts[index])
      if (jobs[index]) mixed.push(jobs[index])
    }

    return mixed.slice(0, 8)
  }, [feedPosts, recentJobs])

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-700 rounded-2xl p-5 sm:p-6 mb-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-72 h-full opacity-10">
            <div className="w-72 h-72 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Welcome back</p>
              <h1 className="text-2xl font-bold mb-1">{user?.name}</h1>
              <p className="text-indigo-100 text-sm">Track your job search, profile reach, and network activity.</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50"
            >
              Improve profile
            </button>
          </div>
        </motion.div>

        <section className="md:hidden mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Latest for you</h2>
              <p className="text-xs text-gray-500">Feed posts and jobs mixed together.</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
              Feed + Jobs
            </span>
          </div>

          {loading && mobileMixedItems.length === 0 ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse" />
            ))
          ) : mobileMixedItems.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-gray-900">Nothing to show yet</p>
              <p className="text-sm text-gray-500 mt-1">Posts and jobs will appear here when available.</p>
            </div>
          ) : (
            mobileMixedItems.map((item) => {
              if (item.type === 'job') {
                const job = item.job

                return (
                  <article key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <CompanyLogo company={job.company} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Job</span>
                          <span className="text-xs text-gray-400">{job.job_type || job.type || 'Open role'}</span>
                        </div>
                        <h3 className="mt-2 font-bold text-gray-900 leading-tight">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{job.company?.name || 'Company'}</p>
                      </div>
                    </div>

                    {job.required_skills && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.required_skills.split(',').slice(0, 3).map((skill, index) => (
                          <span key={index} className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500 truncate">{job.location || 'Location not specified'}</p>
                      <button
                        type="button"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold"
                      >
                        View job
                      </button>
                    </div>
                  </article>
                )
              }

              const post = item.post
              const sourcePost = post.original_post || post
              const media = sourcePost.media?.[0] || post.media?.[0]

              return (
                <article key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {post.author?.profile_image_url ? (
                      <img
                        src={post.author.profile_image_url}
                        alt={post.author.name}
                        className="w-11 h-11 rounded-full object-cover object-top border border-gray-100"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                        {(post.author?.name || 'U').charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">Post</span>
                        <span className="text-xs text-gray-400">{post.visibility || 'public'}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-gray-900 truncate">{post.author?.name || 'RecruitSense member'}</h3>
                      <p className="text-xs text-gray-500 truncate">{post.author?.headline || post.author?.company || 'Shared an update'}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {sourcePost.body || post.body || 'Shared a post'}
                  </p>

                  {media?.file_type === 'image' && (
                    <img src={media.url} alt="Post media" className="mt-3 w-full max-h-56 object-cover rounded-xl bg-gray-100" />
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes_count || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count || 0}
                    </span>
                  </div>
                </article>
              )
            })
          )}
        </section>

        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {mainStatCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => navigate(stat.path)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="hidden md:grid md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {activityStatCards.map((stat) => (
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

        <div className="hidden md:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
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
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900">Profile Setup</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {loading ? 'Checking your profile...' : `${completedSteps} of ${totalSteps} steps complete`}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{loading ? '-' : `${profileStrength}%`}</span>
                </div>

                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all"
                    style={{ width: `${profileStrength}%` }}
                  />
                </div>

                <div className="md:hidden mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Profile shortcuts</p>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="text-xs font-semibold text-indigo-600"
                    >
                      View profile
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {mobileProfileShortcuts.map((stat) => (
                      <button
                        key={stat.label}
                        type="button"
                        onClick={() => navigate(stat.path)}
                        className="rounded-xl bg-gray-50 p-3 text-left transition-colors hover:bg-indigo-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color} shrink-0`}>
                            {stat.icon}
                          </div>
                          <span className="text-lg font-bold text-gray-900 leading-none">{loading ? '-' : stat.value}</span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-gray-600">{stat.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {!loading && nextSetupTask && (
                  <button
                    type="button"
                    onClick={() => openSetupTask(nextSetupTask)}
                    className="mt-4 w-full rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-left hover:bg-indigo-100 transition-colors"
                  >
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Next step</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{nextSetupTask.task}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{nextSetupTask.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-indigo-500 shrink-0" />
                    </div>
                  </button>
                )}

                <div className="mt-4 space-y-2">
                  {loading ? (
                    [1, 2, 3].map((item) => <div key={item} className="h-8 rounded-lg bg-gray-100 animate-pulse" />)
                  ) : profileChecklist.length === 0 || profileChecklist.every((task) => task.complete) ? (
                    <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Your profile is complete.
                    </p>
                  ) : (
                    visibleProfileChecklist.map((task) => (
                      <button
                        key={task.id || task.task}
                        type="button"
                        onClick={() => !task.complete && openSetupTask(task)}
                        className={`w-full flex items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                          task.complete ? 'cursor-default text-gray-400' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                        }`}
                      >
                        {task.complete ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{task.task}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
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
                      className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                      <CompanyLogo company={job.company} size="md" />

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
                        className="w-full sm:w-auto flex-shrink-0 text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
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
                          {statusLabel(app.status)}
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
