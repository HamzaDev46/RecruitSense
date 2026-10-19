import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain, LayoutDashboard, Users, Building2,
  Briefcase, BarChart3, Bell, ClipboardList,
  Settings, LogOut, Shield, ChevronRight, Zap
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'

const navSections = [
  {
    title: 'Core Management',
    items: [
      { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: <Users className="w-4 h-4" />, label: 'Job Seekers', path: '/admin/users' },
      { icon: <Building2 className="w-4 h-4" />, label: 'Companies', path: '/admin/companies' },
      { icon: <Briefcase className="w-4 h-4" />, label: 'Job Postings', path: '/admin/jobs' },
    ]
  },
  {
    title: 'Analytics & Broadcast',
    items: [
      { icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics & KPIs', path: '/admin/analytics' },
      { icon: <Bell className="w-4 h-4" />, label: 'Broadcast Studio', path: '/admin/broadcast' },
      { icon: <ClipboardList className="w-4 h-4" />, label: 'Activity Audit Log', path: '/admin/activity' },
    ]
  },
  {
    title: 'System Controls',
    items: [
      { icon: <Settings className="w-4 h-4" />, label: 'Platform Settings', path: '/admin/settings' },
    ]
  }
]

const AdminSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0B0F19] text-gray-300 flex flex-col z-40 border-r border-slate-800/80 shadow-2xl">
      {/* Brand Header */}
      <motion.div
        whileHover={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
        className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80 cursor-pointer transition-colors group"
        onClick={() => navigate('/admin/dashboard')}
      >
        <motion.div
          whileHover={{ rotate: 10, scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="relative w-10 h-10 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-1 ring-white/20"
        >
          <Brain className="w-5 h-5 text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-300 animate-ping" />
        </motion.div>
        <div>
          <span className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1">
            Recruit<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Sense</span>
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Control Center</p>
          </div>
        </div>
      </motion.div>

      {/* Admin User Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="px-5 py-4 border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-inner">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
              Super Administrator
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto no-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 group ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {/* Sliding active pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="adminSidebarActiveIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md shadow-indigo-600/30 ring-1 ring-white/15"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2.5">
                    <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} transition-colors`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative z-10"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <motion.button
          onClick={handleLogout}
          whileHover={{ x: 3, backgroundColor: 'rgba(239, 68, 68, 0.12)' }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-red-400 group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </div>
          <span className="text-[10px] text-slate-600 group-hover:text-red-400/80 uppercase font-mono">Exit</span>
        </motion.button>
      </div>
    </aside>
  )
}

export default AdminSidebar