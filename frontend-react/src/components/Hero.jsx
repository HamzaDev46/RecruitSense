import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Brain, Briefcase, CheckCircle, Mail, ShieldCheck, Sparkles, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleAuthButton from './auth/GoogleAuthButton'
import { useAuth } from '../context/useAuth'

const HeroVisual = () => (
  <div className="relative min-h-[560px] hidden lg:flex items-center justify-center">
    <div className="absolute inset-x-6 top-10 h-[470px] rounded-t-full bg-[#eef6f8]" />
    <div className="relative z-10 w-full max-w-[660px] pt-16">
      <div className="grid grid-cols-[180px_1fr] gap-5 items-start">
        <div className="pt-20 space-y-5">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-xl p-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xl font-bold text-gray-900">2,450+</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">candidate profiles analyzed</p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-bold">Verified company</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Transparent hiring signals for safer applications.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500">Hiring match</span>
              <BarChart3 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="space-y-3">
              {[82, 68, 54].map((value, index) => (
                <div key={value} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${index === 0 ? 'bg-indigo-600' : index === 1 ? 'bg-emerald-500' : 'bg-amber-500'} text-white text-xs font-bold flex items-center justify-center`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-700">{value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white border border-gray-100 shadow-2xl overflow-hidden">
            <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center gap-2 px-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">RecruitSense AI</p>
                  <p className="text-xs text-gray-500">Live job recommendation</p>
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-indigo-950">Frontend Developer</p>
                    <p className="text-xs text-indigo-700 mt-1">Remote - Full time</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white text-indigo-700 text-xs font-bold">91% match</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Resume score', '88%'],
                  ['Skill match', '94%'],
                  ['Soft skills', '76%'],
                  ['Ready jobs', '18'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const Hero = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleGoogleSuccess = useCallback((user, token) => {
    login(user, token)
    toast.success(`Welcome to RecruitSense, ${user.name}!`)
    navigate(user.role === 'company' ? '/company/dashboard' : '/dashboard')
  }, [login, navigate])

  return (
    <section className="pt-28 pb-16 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.92fr_1.08fr] gap-10 lg:gap-16 items-center min-h-[calc(100vh-112px)]">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-indigo-100"
          >
            <Sparkles className="w-4 h-4" />
            AI-powered career matching
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-5xl md:text-6xl leading-tight font-normal text-gray-900 mb-8"
          >
            Welcome to your professional hiring community
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="w-full max-w-lg space-y-3"
          >
            <div className="rounded-full border border-gray-300 bg-white px-2 py-1.5 shadow-sm">
              <GoogleAuthButton
                mode="signup"
                role="jobseeker"
                onSuccess={handleGoogleSuccess}
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full h-14 rounded-full border border-gray-500 bg-white text-gray-800 font-semibold hover:bg-gray-50 flex items-center justify-center gap-3"
            >
              <Mail className="w-5 h-5 text-gray-500" />
              Sign up with email
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full h-14 rounded-full border border-gray-500 bg-white text-gray-800 font-semibold hover:bg-gray-50 flex items-center justify-center gap-3"
            >
              <ArrowRight className="w-5 h-5 text-gray-500" />
              Sign in to RecruitSense
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.26 }}
            className="text-xs text-gray-500 max-w-lg mt-5 leading-relaxed text-center sm:text-left"
          >
            By continuing, you agree to RecruitSense account terms. Google signup creates a job seeker account.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.34 }}
            className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 text-sm"
          >
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center sm:justify-start gap-2"
            >
              New to RecruitSense? Join now <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-gray-700 hover:text-indigo-600 flex items-center justify-center sm:justify-start gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Company? Post a job
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.42 }}
            className="mt-10 flex flex-wrap gap-4 text-sm text-gray-500"
          >
            {['AI match scores', 'Skill gap analysis', 'Verified opportunities'].map((item) => (
              <span key={item} className="font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}

export default Hero
