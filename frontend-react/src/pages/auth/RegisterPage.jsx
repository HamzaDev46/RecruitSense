import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight, Briefcase, UserCheck } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'jobseeker'
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/register', form)
      const { token, user } = res.data
      login(user, token)
      toast.success(`Welcome to RecruitSense, ${user.name}!`)
      if (user.role === 'company') navigate('/company/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        Object.values(errors).forEach(e => toast.error(e[0]))
      } else {
        toast.error(err.response?.data?.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-10">
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join RecruitSense today — it's free</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'jobseeker' })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
              form.role === 'jobseeker'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Job Seeker
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'company' })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
              form.role === 'company'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Company
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {form.role === 'company' ? 'Company Name' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={form.role === 'company' ? 'Bright Future Pvt Ltd' : 'Ali Khan'}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default RegisterPage