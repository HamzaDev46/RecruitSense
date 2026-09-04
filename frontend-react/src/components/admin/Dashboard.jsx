import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, Briefcase, ClipboardList,
  TrendingUp, UserCheck, UserX, Activity
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    rejected: 0,
    pending: 0,
  })
  const [recentCompanies, setRecentCompanies] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, companiesRes, jobsRes, appsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/companies'),
          api.get('/admin/jobs'),
          api.get('/admin/applications'),
        ])

        const apps = appsRes.data

        setStats({
          totalUsers: usersRes.data.length,
          totalCompanies: companiesRes.data.length,
          totalJobs: jobsRes.data.length,
          totalApplications: apps.length,
          shortlisted: apps.filter(a => a.status === 'shortlisted').length,
          rejected: apps.filter(a => a.status === 'rejected').length,
          pending: apps.filter(a => a.status === 'pending').length,
        })

        setRecentCompanies(companiesRes.data.slice(0, 5))
        setRecentJobs(jobsRes.data.slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { icon: <Users className="w-6 h-6" />, label: 'Total Users', value: stats.totalUsers, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { icon: <Building2 className="w-6 h-6" />, label: 'Companies', value: stats.totalCompanies, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
    { icon: <Briefcase className="w-6 h-6" />, label: 'Job Postings', value: stats.totalJobs, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-600' },
    { icon: <ClipboardList className="w-6 h-6" />, label: 'Applications', value: stats.totalApplications, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' },
  ]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Platform overview and statistics</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.text} mb-3`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Application Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', value: stats.pending, icon: <Activity className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Shortlisted', value: stats.shortlisted, icon: <UserCheck className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', value: stats.rejected, icon: <UserX className="w-5 h-5" />, color: 'text-red-500', bg: 'bg-red-50' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4"
            >
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{loading ? '—' : item.value}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-2 gap-6">

          {/* Recent Companies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Recent Companies</h2>
              <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:text-indigo-700">View all</span>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {company.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{company.name}</p>
                    <p className="text-xs text-gray-400">{company.industry || 'Industry N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Recent Job Postings</h2>
              <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:text-indigo-700">View all</span>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : recentJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {job.title?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.company?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard