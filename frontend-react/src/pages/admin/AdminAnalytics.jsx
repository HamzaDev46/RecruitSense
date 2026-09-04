import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, Building2, Briefcase,
  ClipboardList, Award, CheckCircle2, XCircle, ArrowUpRight,
  RefreshCw, Sparkles, Filter, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie,
  Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#EF4444']

const initials = (name = 'Company') => name
  .split(' ')
  .map((p) => p[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const AdminAnalytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    rejected: 0,
    pending: 0,
    hired: 0,
    offered: 0,
    screening: 0,
    interview: 0,
    withdrawn: 0,
  })
  const [jobStatus, setJobStatus] = useState({ active: 0, draft: 0, closed: 0 })
  const [companyStatus, setCompanyStatus] = useState({ pending: 0, verified: 0, suspended: 0 })
  const [userGrowth, setUserGrowth] = useState([])
  const [topCompanies, setTopCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/analytics')
      setStats(prev => ({ ...prev, ...(res.data.stats || {}) }))
      setJobStatus(res.data.job_status || { active: 0, draft: 0, closed: 0 })
      setCompanyStatus(res.data.company_status || { pending: 0, verified: 0, suspended: 0 })
      setUserGrowth(res.data.user_growth || [])
      setTopCompanies(res.data.top_companies || [])
    } catch (err) {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const funnelStages = [
    { label: 'Applied', value: stats.totalApplications, color: 'bg-indigo-500', barColor: '#6366F1' },
    { label: 'Screening', value: stats.screening || 0, color: 'bg-blue-500', barColor: '#3B82F6' },
    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-purple-500', barColor: '#A855F7' },
    { label: 'Interview', value: stats.interview || 0, color: 'bg-cyan-500', barColor: '#06B6D4' },
    { label: 'Offered', value: stats.offered || 0, color: 'bg-amber-500', barColor: '#F59E0B' },
    { label: 'Hired', value: stats.hired || 0, color: 'bg-emerald-500', barColor: '#10B981' },
  ]

  const pieData = [
    { name: 'Pending', value: stats.pending || 0 },
    { name: 'Shortlisted', value: stats.shortlisted || 0 },
    { name: 'Offered', value: stats.offered || 0 },
    { name: 'Hired', value: stats.hired || 0 },
    { name: 'Rejected', value: stats.rejected || 0 },
    { name: 'Withdrawn', value: stats.withdrawn || 0 },
  ].filter(item => item.value > 0)

  const jobDistribution = [
    { name: 'Active', value: jobStatus.active || 0, fill: '#10B981' },
    { name: 'Draft', value: jobStatus.draft || 0, fill: '#F59E0B' },
    { name: 'Closed', value: jobStatus.closed || 0, fill: '#94A3B8' },
  ]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Analytics & Intelligence</h1>
            <p className="text-gray-500 text-sm mt-0.5">Comprehensive insights across talent acquisition, employer activity, and conversion pipelines</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 self-start transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Job Seekers', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            { label: 'Registered Employers', value: stats.totalCompanies, icon: <Building2 className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50 border-purple-100' },
            { label: 'Total Job Postings', value: stats.totalJobs, icon: <Briefcase className="w-5 h-5" />, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
            { label: 'Total Applications', value: stats.totalApplications, icon: <ClipboardList className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{loading ? '—' : item.value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recruitment Funnel Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">End-to-End Recruitment Conversion Funnel</h2>
              <p className="text-xs text-gray-400">Step-by-step applicant journey from initial submission to job placement</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              {stats.hired || 0} Successful Hires
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {funnelStages.map((stage, idx) => {
              const conversion = stats.totalApplications > 0
                ? Math.round((stage.value / stats.totalApplications) * 100)
                : 0
              return (
                <div
                  key={idx}
                  className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stage.label}</span>
                    <span className="text-[11px] font-bold text-gray-400">{conversion}%</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{loading ? '—' : stage.value}</p>
                  <div className="w-full bg-gray-200/70 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max(8, conversion)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Acquisition Trend Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">User Acquisition Trend</h2>
                <p className="text-xs text-gray-400">Monthly breakdown for candidates vs companies</p>
              </div>
            </div>

            {loading ? (
              <div className="h-56 bg-gray-50 rounded-2xl animate-pulse" />
            ) : userGrowth.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-gray-400">No data available</div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowth}>
                    <defs>
                      <linearGradient id="anJobseekers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="anCompanies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="jobseekers" name="Candidates" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#anJobseekers)" />
                    <Area type="monotone" dataKey="companies" name="Companies" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#anCompanies)" />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Application Status Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Application Status Distribution</h2>
                <p className="text-xs text-gray-400">Share of applications by current lifecycle status</p>
              </div>
            </div>

            {loading ? (
              <div className="h-56 bg-gray-50 rounded-2xl animate-pulse" />
            ) : pieData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-gray-400">No applications recorded yet</div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Row: Top Employers Leaderboard & Verification Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Companies by Jobs (2 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
          >
            <h2 className="text-base font-bold text-gray-900 mb-1">Top Employers Leaderboard</h2>
            <p className="text-xs text-gray-400 mb-5">Organizations with highest posted career opportunities</p>

            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
                </div>
              ) : topCompanies.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No company hiring records yet</p>
              ) : (
                topCompanies.map((company, rank) => (
                  <div key={company.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        rank === 0 ? 'bg-amber-100 text-amber-700' : rank === 1 ? 'bg-slate-200 text-slate-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {rank + 1}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {initials(company.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{company.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{company.industry || company.user?.email || 'Employer'}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-indigo-600">{company.job_postings_count || 0} Jobs</p>
                      <p className="text-[10px] text-gray-400">{company.verification_status || 'verified'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Job & Verification Status Metrics (1 Col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Company Verifications</h2>
              <p className="text-xs text-gray-400 mb-4">Verification queue distribution</p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Employers
                  </span>
                  <span className="font-black text-emerald-900 text-sm">{companyStatus.verified || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    Pending Verification
                  </span>
                  <span className="font-black text-amber-900 text-sm">{companyStatus.pending || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50/70 border border-red-100 rounded-2xl">
                  <span className="font-bold text-red-800 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                    Suspended Employers
                  </span>
                  <span className="font-black text-red-900 text-sm">{companyStatus.suspended || 0}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400">Total Employer Accounts</p>
              <p className="text-lg font-black text-gray-900 mt-0.5">{stats.totalCompanies} Companies</p>
            </div>
          </motion.div>
        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminAnalytics
