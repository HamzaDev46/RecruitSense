import { motion } from 'framer-motion'

const steps = [
  {
    step: '01',
    title: 'Upload Resume',
    desc: 'Upload your PDF resume. Our AI extracts your skills and experience automatically.',
    color: 'from-indigo-500 to-indigo-600',
    bg: 'from-indigo-50 to-indigo-100'
  },
  {
    step: '02',
    title: 'Apply to Jobs',
    desc: 'Browse jobs and apply. AI instantly calculates your match score with each position.',
    color: 'from-purple-500 to-purple-600',
    bg: 'from-purple-50 to-purple-100'
  },
  {
    step: '03',
    title: 'Get Matched',
    desc: 'Take a soft-skill quiz and get a transparent score. Companies see your ranked profile.',
    color: 'from-cyan-500 to-cyan-600',
    bg: 'from-cyan-50 to-cyan-100'
  },
]

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-500 text-lg">Three simple steps to your perfect match</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default HowItWorks