import { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)
  const [resending, setResending] = useState(false)

  const finishLogin = useCallback((user, token, message = `Welcome back, ${user.name}!`) => {
    login(user, token)
    toast.success(message)
    if (user.role === 'admin') navigate('/admin/dashboard')
    else if (user.role === 'company') navigate('/company/dashboard')
    else navigate('/dashboard')
  }, [login, navigate])

  const handleGoogleSuccess = useCallback((user, token) => {
    finishLogin(user, token, `Welcome back, ${user.name}!`)
  }, [finishLogin])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setUnverifiedEmail(null)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/login', form)
      const { token, user } = res.data
      finishLogin(user, token)
    } catch (err) {
      if (err.response?.data?.requires_verification) {
        setUnverifiedEmail(err.response?.data?.email || form.email)
      }
      const errors = err.response?.data?.errors
      if (errors) {
        Object.values(errors).forEach(e => toast.error(e[0]))
      } else {
        toast.error(err.response?.data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!unverifiedEmail) return
    setResending(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/resend-verification', { email: unverifiedEmail })
      toast.success(res.data.message || 'Activation link re-sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your RecruitSense account</p>
        </div>

        {unverifiedEmail && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Account Not Activated
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              We sent a verification link to <strong>{unverifiedEmail}</strong>. Please verify your email before logging in.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@gmail.com"
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
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
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleAuthButton
          mode="signin"
          onSuccess={handleGoogleSuccess}
        />

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default LoginPage
