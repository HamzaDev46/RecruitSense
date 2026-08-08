import { useMemo, useState } from 'react'
import { Briefcase, Loader2, Send, X } from 'lucide-react'
import CompanyLogo from '../CompanyLogo'

const ApplyJobModal = ({ open, job, loading = false, onClose, onSubmit }) => {
  const [coverLetter, setCoverLetter] = useState('')

  const skills = useMemo(() => (
    job?.required_skills
      ?.split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 8) || []
  ), [job?.required_skills])

  if (!open || !job) return null

  const submitApplication = (event) => {
    event.preventDefault()
    onSubmit?.({
      cover_letter: coverLetter.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center px-4">
      <form onSubmit={submitApplication} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <CompanyLogo company={job.company} size="md" className="rounded-2xl" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">Apply for this job</h2>
              <p className="text-sm text-gray-500 mt-1 truncate">
                {job.title} at {job.company?.name || 'Company'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-60"
            aria-label="Close application form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-indigo-900">Your resume will be analyzed for this role</p>
                <p className="text-xs text-indigo-700 mt-1">
                  RecruitSense will calculate your match score after submission.
                </p>
              </div>
            </div>
          </div>

          {skills.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">Required skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold text-gray-900">Cover letter</span>
            <textarea
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value.slice(0, 3000))}
              rows={8}
              placeholder="Write a short note for the recruiter..."
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <span className="mt-2 block text-xs text-gray-400 text-right">
              {coverLetter.length}/3000
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Submitting...' : 'Submit application'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ApplyJobModal
