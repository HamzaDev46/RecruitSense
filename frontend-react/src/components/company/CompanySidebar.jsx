import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Brain,
  Briefcase,
  Calendar,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Search,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const navItems = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/company/dashboard' },
  { icon: <Briefcase className="w-5 h-5" />, label: 'Jobs', path: '/company/jobs' },
  { icon: <Users className="w-5 h-5" />, label: 'Applicants', path: '/company/applicants' },
  { icon: <Calendar className="w-5 h-5" />, label: 'Interviews', path: '/company/interviews' },
  { icon: <MessageCircle className="w-5 h-5" />, label: 'Messages', path: '/messages' },
  { icon: <ClipboardCheck className="w-5 h-5" />, label: 'Quiz', path: '/company/quiz' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/company/settings' },
]

const CompanySidebar = ({ mobileOpen = false, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [company, setCompany] = useState(null)

  useEffect(() => {
    let active = true

    const loadCompany = () => {
      api.get('/company/profile')
        .then((res) => {
          if (active) setCompany(res.data)
        })
        .catch(() => {})
    }

    loadCompany()

    const refreshCompany = (event) => {
      if (event.detail?.company) {
        setCompany(event.detail.company)
      } else {
        loadCompany()
      }
    }

    window.addEventListener('recruitsense-company-profile-updated', refreshCompany)

    return () => {
      active = false
      window.removeEventListener('recruitsense-company-profile-updated', refreshCompany)
    }
  }, [])

  const navigateWithSpinner = (path, target = path) => {
    if (location.pathname !== path) {
      window.dispatchEvent(new CustomEvent('recruitsense-route-loading', {
        detail: { path },
      }))
    }

    navigate(target)
    onClose?.()
  }

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch (err) {
      console.log(err)
    } finally {
      logout()
      toast.success('Logged out successfully')
      navigate('/')
      onClose?.()
    }
  }

  return (
    <div className={`fixed left-0 top-0 h-full w-64 max-w-[82vw] bg-white border-r border-gray-100 flex flex-col z-40 transform transition-transform duration-200 md:translate-x-0 ${
      mobileOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div
        className="flex items-center gap-2 px-6 py-5 border-b border-gray-100 cursor-pointer"
        onClick={() => navigateWithSpinner('/company/dashboard')}
      >
        <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">
          Recruit<span className="text-indigo-600">Sense</span>
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onClose?.()
          }}
          aria-label="Close navigation"
          className="ml-auto w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold text-sm">
            {company?.logo_url ? (
              <img src={company.logo_url} alt="Company logo" className="w-full h-full object-cover" />
            ) : (
              (company?.name || user?.name || 'C').charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{company?.name || user?.name || 'Company'}</p>
            <p className="text-xs text-gray-400 truncate">{company?.industry || 'Company panel'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/company/applicants' && location.pathname.includes('/applicants'))

          return (
            <button
              key={item.path}
              onClick={() => navigateWithSpinner(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 flex items-start gap-2">
          <Search className="w-4 h-4 mt-0.5 text-gray-400" />
          Review applicants by score, quiz progress, and required skills.
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default CompanySidebar
