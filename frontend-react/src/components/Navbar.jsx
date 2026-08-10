import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Brain, Briefcase, GraduationCap, Menu, Search, Users, X } from 'lucide-react'

const navLinks = [
  { label: 'Top Content', path: '/feed', icon: BarChart3 },
  { label: 'People', path: '/network', icon: Users },
  { label: 'Learning', path: '/resume-coach', icon: GraduationCap },
  { label: 'Jobs', path: '/jobs', icon: Briefcase },
]

const Navbar = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const openFeature = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 w-full bg-white z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-5">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            Recruit<span className="text-indigo-600">Sense</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-7 ml-auto">
          {navLinks.map((item) => {
            const Icon = item.icon

            return (
              <button
                type="button"
                key={item.label}
                onClick={() => openFeature(item.path)}
                className="text-gray-500 hover:text-indigo-600 font-medium transition-colors text-xs flex flex-col items-center gap-1"
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => openFeature('/search')}
            className="pl-6 border-l border-gray-200 text-gray-500 hover:text-indigo-600 font-medium transition-colors text-xs flex flex-col items-center gap-1"
          >
            <Search className="w-5 h-5" />
            Browse
          </button>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="h-12 px-7 rounded-full border border-indigo-600 text-indigo-600 bg-white font-semibold hover:bg-indigo-50 transition-colors"
          >
            Join now
          </button>
          <button
            onClick={() => navigate('/login')}
            className="h-12 px-7 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Sign in
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => openFeature(item.path)}
              className="text-left text-gray-600 font-medium"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => openFeature('/search')}
            className="text-left text-gray-600 font-medium"
          >
            Browse
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-left text-indigo-600 font-semibold"
          >
            Join now
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold text-center"
          >
            Sign in
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar
