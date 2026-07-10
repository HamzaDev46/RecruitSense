import { Brain } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="py-10 px-6 bg-gray-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">
            Recruit<span className="text-indigo-400">Sense</span>
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} RecruitSense — AI-Powered Recruitment Decision Support
        </p>
        <div className="flex gap-6 text-gray-400 text-sm">
          <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer