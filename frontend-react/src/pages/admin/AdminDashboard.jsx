import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, Briefcase, ClipboardList,
  TrendingUp, UserCheck, Activity, ArrowRight,
  Eye, Sparkles, RefreshCw, Shield, Bell, CheckCircle2,
  Clock, AlertCircle, ArrowUpRight, Award
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie,
  Pie, Cell, Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#EF4444']

const initials = (name = 'User') => name
  .split(' ')
  .map((p) => p[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    rejected: 0,
    pending: 0,
    offered: 0,
    hired: 0,
    activeJobs: 0,
    pendingReports: 0,
    suspendedUsers: 0,
    verifiedCompanies: 0,
    pendingCompanies: 0,
  })
  const [recentCompanies, setRecentCompanies] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [userGrowth, setUserGrowth] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics').catch(() => ({ data: {} })),
      ])

      setStats(prev => ({ ...prev, ...(dashRes.data.stats || {}) }))
      setRecentCompanies(dashRes.data.recent_companies || [])
      setRecentJobs(dashRes.data.recent_jobs || [])
      setRecentActivity(dashRes.data.recent_activity || [])
      if (analyticsRes.data?.user_growth) {
        setUserGrowth(analyticsRes.data.user_growth)
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const pieData = [
    { name: 'Pending', value: stats.pending || 0 },
    { name: 'Shortlisted', value: stats.shortlisted || 0 },
    { name: 'Offered', value: stats.offered || 0 },
    { name: 'Hired', value: stats.hired || 0 },
    { name: 'Rejected', value: stats.rejected || 0 },
  ].filter(item => item.value > 0)

  const primaryCards = [
    {
      label: 'Job Seekers',
      value: stats.totalUsers,
      sub: `${stats.suspendedUsers || 0} suspended`,
      icon: <Users className="w-5 h-5" />,
      gradient: 'from-indigo-600 to-indigo-700',
      shadow: 'shadow-indigo-500/20',
      glow: 'bg-indigo-500/10 text-indigo-600',
      path: '/admin/users',
      trend: '+12% this mo',
    },
    {
      label: 'Registered Companies',
      value: stats.totalCompanies,
      sub: `${stats.pendingCompanies || 0} pending review`,
      icon: <Building2 className="w-5 h-5" />,
      gradient: 'from-purple-600 to-purple-700',
      shadow: 'shadow-purple-500/20',
      glow: 'bg-purple-500/10 text-purple-600',
      path: '/admin/companies',
      trend: '+8% this mo',
    },
    {
      label: 'Live Job Openings',
      value: stats.activeJobs,
      sub: `${stats.totalJobs || 0} total postings`,
      icon: <Briefcase className="w-5 h-5" />,
      gradient: 'from-cyan-600 to-blue-600',
      shadow: 'shadow-cyan-500/20',
      glow: 'bg-cyan-500/10 text-cyan-600',
      path: '/admin/jobs',
      trend: 'Active now',
    },
    {
      label: 'Total Applications',
      value: stats.totalApplications,
      sub: `${stats.hired || 0} hired candidates`,
      icon: <ClipboardList className="w-5 h-5" />,
      gradient: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      glow: 'bg-emerald-500/10 text-emerald-600',
      path: '/admin/analytics',
      trend: `${stats.shortlisted || 0} shortlisted`,
    },
  ]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-950/20 border border-slate-800/80"
        >
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-300 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Executive Control Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Platform Intelligence & Oversight
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Monitor system metrics, candidate acquisition, employer verifications, and platform-wide recruiting activities in real-time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg backdrop-blur-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Sync Data
              </button>
              <button
                onClick={() => navigate('/admin/broadcast')}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Bell className="w-3.5 h-3.5" />
                Broadcast
              </button>
            </div>
          </div>
        </motion.div>

        {/* Primary 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {primaryCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:border-indigo-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${card.glow} group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
                <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                  {card.trend}
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {loading ? '—' : card.value}
                </p>
                <p className="text-xs font-bold text-gray-700 mt-1">{card.label}</p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Middle Row: Recruitment Funnel & User Growth Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Growth Area Chart (2 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">User Growth & Acquisition</h2>
                <p className="text-xs text-gray-400">Monthly breakdown of candidate and company registrations</p>
              </div>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Deep Analytics <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="h-56 bg-gray-50 rounded-2xl animate-pulse" />
            ) : userGrowth.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-xs">
                No growth data recorded yet
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorJobseekers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area type="monotone" dataKey="jobseekers" name="Job Seekers" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorJobseekers)" />
                    <Area type="monotone" dataKey="companies" name="Companies" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompanies)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Application Pipeline Donut (1 Col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Application Pipeline</h2>
                  <p className="text-xs text-gray-400">Current status breakdown</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              {loading ? (
                <div className="h-44 bg-gray-50 rounded-2xl animate-pulse my-2" />
              ) : pieData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-gray-400 text-xs">
                  No applications recorded yet
                </div>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pipeline Stage Pills */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50 text-xs">
              <div className="flex items-center gap-2 p-2 bg-amber-50/60 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold">Pending</p>
                  <p className="font-bold text-gray-900">{stats.pending || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold">Shortlisted</p>
                  <p className="font-bold text-gray-900">{stats.shortlisted || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-50/60 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold">Offered</p>
                  <p className="font-bold text-gray-900">{stats.offered || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-teal-50/60 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold">Hired</p>
                  <p className="font-bold text-gray-900">{stats.hired || 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Split: Recent Employers & Recent Job Openings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Companies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Recent Companies</h2>
                  <p className="text-[11px] text-gray-400">Newly registered employer organizations</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/companies')}
                className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-gray-50 p-2">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
                </div>
              ) : recentCompanies.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No companies registered yet</p>
                </div>
              ) : (
                recentCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                        {initials(company.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{company.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{company.industry || company.user?.email || 'Employer'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {company.job_postings_count || 0} jobs
                      </span>
                      <button
                        onClick={() => navigate('/admin/companies')}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Job Postings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Recent Job Openings</h2>
                  <p className="text-[11px] text-gray-400">Latest active career opportunities</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/jobs')}
                className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-gray-50 p-2">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No jobs posted yet</p>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                        {job.title?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{job.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">{job.company?.name || 'Company'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {job.applications_count || 0} apps
                      </span>
                      <button
                        onClick={() => navigate('/admin/jobs')}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Live Platform Activity Stream */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Real-Time Platform Audit Stream</h2>
                <p className="text-[11px] text-gray-400">Live feed of user registrations, company onboarding, and applications</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/activity')}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
            >
              Full Audit Trail <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-gray-50 p-2">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No activity logged yet</p>
              </div>
            ) : (
              recentActivity.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3.5 hover:bg-gray-50/80 rounded-2xl transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-gray-500 truncate">{item.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
