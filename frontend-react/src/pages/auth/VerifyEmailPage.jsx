import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Mail } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email address...')
  const [customEmail, setCustomEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const hasCalled = useRef(false)

  useEffect(() => {
    if (!id || !email || !token) {
      setStatus('error')
      setMessage('The activation link was opened without full security parameters or tokens.')
      return
    }

    if (hasCalled.current) return
    hasCalled.current = true

    const verify = async () => {
      try {
        const res = await api.post('/verify-email', {
          id: parseInt(id, 10),
          email,
          token,
        })

        const { user, token: authToken, message: successMsg } = res.data
        setStatus('success')
        setMessage(successMsg || 'Your email has been verified successfully!')

        if (user && authToken) {
          login(user, authToken)
          toast.success(successMsg || 'Email verified! Welcome to RecruitSense.')
          setTimeout(() => {
            if (user.role === 'company') navigate('/company/dashboard')
            else if (user.role === 'admin') navigate('/admin/dashboard')
            else navigate('/dashboard')
          }, 2400)
        }
      } catch (err) {
        setStatus('error')
        const errMsg = err.response?.data?.message || 'Verification failed or link expired.'
        setMessage(errMsg)
      }
    }

    verify()
  }, [email, id, login, navigate, token])

  const effectiveEmail = email || customEmail

  const handleResend = async (e) => {
    if (e) e.preventDefault()
    if (!effectiveEmail || !effectiveEmail.trim()) {
      toast.error('Please enter your registered email address.')
      return
    }

    setResending(true)
    try {
      const res = await api.post('/resend-verification', { email: effectiveEmail.trim() })
      setResendSent(true)
      toast.success(res.data.message || 'Verification link sent!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend verification email.')
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
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 text-center"
      >
        <div
          className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Brain className="w-8 h-8 text-white" />
        </div>

        {status === 'verifying' && (
          <div className="py-8 space-y-4">
            <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Activating Account</h2>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-4 space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Account Activated!</h2>
            <p className="text-sm text-gray-600 px-2">{message}</p>
            <div className="pt-4">
              <p className="text-xs text-indigo-600 font-semibold mb-3 animate-pulse">
                Redirecting you to your dashboard...
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-4 space-y-4 text-center"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Account Activation</h2>
            <p className="text-sm text-gray-600 px-2 leading-relaxed">{message}</p>

            <div className="pt-2 space-y-3">
              {!email && (
                <form onSubmit={handleResend} className="space-y-2">
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800"
                  />
                  {resendSent ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" /> Fresh activation link sent to {effectiveEmail}
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={resending || !customEmail.trim()}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {resending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {resending ? 'Sending...' : 'Resend Activation Email'}
                    </button>
                  )}
                </form>
              )}

              {email && (
                <div>
                  {resendSent ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" /> Fresh activation link sent to {email}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {resending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {resending ? 'Sending...' : 'Resend Activation Email'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-95 shadow-md shadow-indigo-500/20"
              >
                Sign In to Your Account
              </Link>
              <Link to="/register" className="text-xs text-gray-500 hover:text-indigo-600 font-medium">
                Create a new account
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default VerifyEmailPage
