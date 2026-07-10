import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Menu, X } from 'lucide-react'

const Navbar = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Recruit<span className="text-indigo-600">Sense</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-gray-500 hover:text-indigo-600 font-medium transition-colors text-sm">
            How It Works
          </a>
          <a href="#features" className="text-gray-500 hover:text-indigo-600 font-medium transition-colors text-sm">
            Features
          </a>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-indigo-600 font-semibold transition-colors px-4 py-2 text-sm"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
          >
            Get Started
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
          <a href="#how-it-works" className="text-gray-600 font-medium">How It Works</a>
          <a href="#features" className="text-gray-600 font-medium">Features</a>
          <button
            onClick={() => navigate('/login')}
            className="text-left text-indigo-600 font-semibold"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-center"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar