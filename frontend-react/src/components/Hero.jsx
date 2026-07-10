import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react'

const Hero = () => {
  const navigate = useNavigate()

  return (
    <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">

      {/* Background Decoration */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse" />

      <div className="max-w-7xl mx-auto text-center relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-indigo-200"
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Recruitment Platform
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight"
        >
          Find Your Perfect
          <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            Career Match
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          RecruitSense uses advanced NLP and machine learning to match candidates
          with the right jobs — transparently, fairly, and intelligently.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            Find Jobs <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/register')}
            className="border-2 border-indigo-200 text-indigo-600 bg-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-indigo-400 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            Post a Job <Briefcase className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400"
        >
          {['✅ AI-Powered Matching', '✅ Transparent Scoring', '✅ Skill Gap Analysis', '✅ Free to Use'].map((item, i) => (
            <span key={i} className="font-medium">{item}</span>
          ))}
        </motion.div>

      </div>
    </section>
  )
}

export default Hero