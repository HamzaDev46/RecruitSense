import { motion } from 'framer-motion'
import { Users, Building2, Briefcase } from 'lucide-react'

const stats = [
  { icon: <Users className="w-8 h-8" />, value: '1000+', label: 'Active Candidates' },
  { icon: <Building2 className="w-8 h-8" />, value: '50+', label: 'Companies Hiring' },
  { icon: <Briefcase className="w-8 h-8" />, value: '500+', label: 'Jobs Posted' },
]

const Stats = () => {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center border border-indigo-100"
          >
            <div className="text-indigo-500 flex justify-center mb-4">{stat.icon}</div>
            <div className="text-4xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
              {stat.value}
            </div>
            <div className="text-gray-500 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default Stats