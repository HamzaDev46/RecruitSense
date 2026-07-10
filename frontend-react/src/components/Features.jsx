import { motion } from 'framer-motion'
import { Brain, BarChart3, CheckCircle, Star, Zap, Shield } from 'lucide-react'

const features = [
  { icon: <Brain className="w-6 h-6" />, title: 'AI Resume Analysis', desc: 'NLP-based skill extraction from your PDF resume', color: 'text-indigo-500', bg: 'bg-indigo-50 group-hover:bg-indigo-100' },
  { icon: <BarChart3 className="w-6 h-6" />, title: 'Transparent Scoring', desc: 'See exactly how you match each job requirement', color: 'text-purple-500', bg: 'bg-purple-50 group-hover:bg-purple-100' },
  { icon: <CheckCircle className="w-6 h-6" />, title: 'Skill Gap Detection', desc: 'Know which skills to improve for better matches', color: 'text-cyan-500', bg: 'bg-cyan-50 group-hover:bg-cyan-100' },
  { icon: <Star className="w-6 h-6" />, title: 'Soft Skill Quiz', desc: 'Personality and teamwork assessment built-in', color: 'text-amber-500', bg: 'bg-amber-50 group-hover:bg-amber-100' },
  { icon: <Zap className="w-6 h-6" />, title: 'Instant Matching', desc: 'Real-time AI analysis the moment you apply', color: 'text-emerald-500', bg: 'bg-emerald-50 group-hover:bg-emerald-100' },
  { icon: <Shield className="w-6 h-6" />, title: 'Fair & Unbiased', desc: 'Data-driven decisions, no human bias involved', color: 'text-rose-500', bg: 'bg-rose-50 group-hover:bg-rose-100' },
]

const Features = () => {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why RecruitSense?</h2>
          <p className="text-gray-500 text-lg">Features that make us different from the rest</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center ${feature.color} mb-4 transition-colors duration-300`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Features