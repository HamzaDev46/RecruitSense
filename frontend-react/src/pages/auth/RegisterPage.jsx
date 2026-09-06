import { useCallback, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Briefcase, UserCheck, CheckCircle2, AlertCircle, ShieldAlert,
  Send, RefreshCw, Building2, MapPin, Globe, Users
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton'
import { validateTrustedEmail } from '../../utils/emailValidation'

const INDUSTRY_OPTIONS = [
  'Software & IT',
  'Artificial Intelligence',
  'Healthcare & Pharma',
  'Banking & Financial Services',
  'E-commerce & Retail',
  'Education & EdTech',
  'Telecommunications',
  'Manufacturing',
  'Marketing & Advertising',
  'Other',
]

const COMPANY_SIZE_OPTIONS = [
  '1-10 employees (Startup)',
  '11-50 employees (Small)',
  '51-200 employees (Medium)',
  '201-500 employees (Mid-Enterprise)',
  '500+ employees (Enterprise)',
]

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'jobseeker',
    industry: 'Software & IT',
    location: '',
    website: '',
    company_size: '11-50 employees (Small)',
  })

  const [verificationSent, setVerificationSent] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const emailValidation = form.email ? validateTrustedEmail(form.email) : null

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const finishRegistration = useCallback((user, token, message = `Welcome to RecruitSense, ${user.name}!`) => {
    login(user, token)
    toast.success(message)
    if (user.role === 'company') navigate('/company/dashboard')
    else navigate('/dashboard')
  }, [login, navigate])

  const handleGoogleSuccess = useCallback((user, token) => {
    finishRegistration(user, token, `Welcome to RecruitSense, ${user.name}!`)
  }, [finishRegistration])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.email) {
      const check = validateTrustedEmail(form.email)
      if (!check.isValid) {
        toast.error(check.message || 'Please use a trusted email address.')
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        company_name: form.role === 'company' ? form.name : undefined,
      }
      const res = await axios.post('http://127.0.0.1:8000/api/register', payload)
      if (res.data.requires_verification) {
        setRegisteredEmail(res.data.email || form.email)
        setVerificationSent(true)
        setCooldown(60)
        toast.success(res.data.message || 'Verification email sent! Please check your inbox.')
      } else {
        const { token, user } = res.data
        finishRegistration(user, token)
      }
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

  const handleResend = async () => {
    if (cooldown > 0 || !registeredEmail) return
    setResending(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/resend-verification', { email: registeredEmail })
      toast.success(res.data.message || 'Fresh verification link sent!')
      setCooldown(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend email.')
    } finally {
      setResending(false)
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
        className={`bg-white rounded-3xl shadow-2xl p-8 w-full ${form.role === 'company' ? 'max-w-xl' : 'max-w-md'} transition-all duration-300 relative z-10`}
      >
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {verificationSent ? 'Verify Your Email' : form.role === 'company' ? 'Register Your Company' : 'Create Candidate Account'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {verificationSent
              ? 'One final step to activate your account'
              : form.role === 'company'
                ? 'Start hiring top AI-screened talent today'
                : "Join RecruitSense today - it's free"}
          </p>
        </div>

        {verificationSent ? (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-indigo-50/50">
              <Send className="w-8 h-8" />
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent to</p>
              <p className="text-sm font-bold text-gray-900 break-all">{registeredEmail}</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Click the activation link in the email to activate your account and start using RecruitSense.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending...' : cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
              </button>

              <Link
                to="/login"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 block"
              >
                Proceed to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
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
                  {form.role === 'company' ? (
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  ) : (
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={form.role === 'company' ? 'e.g. Acme Technologies Ltd' : 'e.g. Ali Khan'}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Company Specific Profile Fields */}
              {form.role === 'company' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Industry
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="industry"
                          value={form.industry}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                        >
                          {INDUSTRY_OPTIONS.map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Company Size
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="company_size"
                          value={form.company_size}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                        >
                          {COMPANY_SIZE_OPTIONS.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Headquarters / Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          placeholder="e.g. Islamabad, Pakistan"
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Website <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          name="website"
                          value={form.website}
                          onChange={handleChange}
                          placeholder="https://acme.com"
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">
                    {form.role === 'company' ? 'Work / Official Email' : 'Email Address'}
                  </label>
                  {emailValidation && form.email.includes('@') && (
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      emailValidation.isValid ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {emailValidation.isValid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Trusted provider
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> Invalid domain
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    emailValidation && form.email.includes('@')
                      ? emailValidation.isValid
                        ? 'text-emerald-500'
                        : 'text-red-400'
                      : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={form.role === 'company' ? 'hr@company.com' : 'you@gmail.com'}
                    required
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${
                      emailValidation && form.email.includes('@')
                        ? emailValidation.isValid
                          ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-400 bg-emerald-50/20'
                          : 'border-red-300 focus:ring-2 focus:ring-red-400 bg-red-50/20'
                        : 'border-gray-200 focus:ring-2 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                {emailValidation && !emailValidation.isValid && form.email.includes('@') ? (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    {emailValidation.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Supported: Gmail, Yahoo, Outlook, Hotmail, iCloud, Proton, or .edu
                  </p>
                )}
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
                  <>
                    {form.role === 'company' ? 'Register Company' : 'Create Account'}{' '}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <GoogleAuthButton
              mode="signup"
              role={form.role}
              onSuccess={handleGoogleSuccess}
            />

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default RegisterPage
