import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const CTASection = () => {
  const navigate = useNavigate()

  return (
    <section className="py-24 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-indigo-100 text-lg mb-10">
          Join thousands of candidates and companies already using RecruitSense
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            Join as Job Seeker <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/register')}
            className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white transition-all duration-300 flex items-center justify-center gap-2"
          >
            Post Jobs as Company
          </button>
        </div>
      </motion.div>
    </section>
  )
}

export default CTASection