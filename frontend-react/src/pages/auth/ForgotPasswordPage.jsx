import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, Mail, Send, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { validateTrustedEmail } from '../../utils/emailValidation'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const emailValidation = email ? validateTrustedEmail(email) : null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (email) {
      const check = validateTrustedEmail(email)
      if (!check.isValid) {
        toast.error(check.message || 'Please use a trusted email address.')
        return
      }
    }

    setLoading(true)

    try {
      const res = await api.post('/forgot-password', { email })
      setSent(true)
      toast.success(res.data.message || 'Reset link sent')
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || 'Could not send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10"
      >
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mb-6 text-sm font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        <div className="text-center mb-8">
          <div
            className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email and we will send a reset link.</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <Send className="w-9 h-9 text-emerald-600 mx-auto" />
            <h2 className="mt-3 font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              If an account exists for {email}, a password reset link has been sent.
            </p>
            <Link to="/login" className="mt-4 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700 block">Email Address</label>
                {emailValidation && email.includes('@') && (
                  <span className={`text-xs font-semibold flex items-center gap-1 ${
                    emailValidation.isValid ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {emailValidation.isValid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Trusted
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
                  emailValidation && email.includes('@')
                    ? emailValidation.isValid
                      ? 'text-emerald-500'
                      : 'text-red-400'
                    : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@gmail.com"
                  required
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${
                    emailValidation && email.includes('@')
                      ? emailValidation.isValid
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-400 bg-emerald-50/20'
                        : 'border-red-300 focus:ring-2 focus:ring-red-400 bg-red-50/20'
                      : 'border-gray-200 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {emailValidation && !emailValidation.isValid && email.includes('@') && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  {emailValidation.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Send Reset Link <Send className="w-4 h-4" /></>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage
