import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Briefcase, MapPin, Clock, ChevronRight, Bookmark, BookmarkCheck, X, Banknote, Laptop, Layers, Timer } from 'lucide-react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import ApplyJobModal from '../../components/jobseeker/ApplyJobModal'
import CompanyLogo from '../../components/CompanyLogo'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  formatDeadline,
  formatExperienceLevel,
  formatJobType,
  formatSalary,
  formatWorkMode,
  isJobAcceptingApplications,
} from '../../utils/jobDetails'

const BrowseJobs = () => {
  const { jobId } = useParams()
  const [jobs, setJobs] = useState([])
  const [selectedId, setSelectedId] = useState(jobId ? Number(jobId) : null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [applyModal, setApplyModal] = useState({
    open: false,
    job: null,
    loading: false,
  })
  const [savingId, setSavingId] = useState(null)
  const [savedJobIds, setSavedJobIds] = useState([])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [jobsRes, savedJobsRes] = await Promise.all([
          api.get('/jobs'),
          api.get('/saved-jobs'),
        ])

        setJobs(jobsRes.data)
        setSavedJobIds(savedJobsRes.data.map((item) => item.job?.id).filter(Boolean))
      } catch {
        toast.error('Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return jobs

    return jobs.filter((job) => [
      job.title,
      job.company?.name,
      job.required_skills,
      job.location,
      formatJobType(job.job_type),
      formatWorkMode(job.work_mode),
      formatExperienceLevel(job.experience_level),
      formatSalary(job),
    ].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [jobs, search])

  const selected = filtered.find(job => job.id === selectedId) || filtered[0] || null
  const selectedAccepting = isJobAcceptingApplications(selected)

  const openApply = (job) => {
    setApplyModal({
      open: true,
      job,
      loading: false,
    })
  }

  const closeApply = () => {
    if (applyModal.loading) return

    setApplyModal({
      open: false,
      job: null,
      loading: false,
    })
  }

  const submitApplication = async (payload) => {
    if (!applyModal.job) return

    setApplyModal((current) => ({ ...current, loading: true }))
    try {
      await api.post(`/jobs/${applyModal.job.id}/apply`, payload)
      toast.success('Application submitted! AI is analyzing your resume...')
      setApplyModal({
        open: false,
        job: null,
        loading: false,
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
      setApplyModal((current) => ({ ...current, loading: false }))
    }
  }

  const toggleSave = async (jobId) => {
    const isSaved = savedJobIds.includes(jobId)
    setSavingId(jobId)

    try {
      if (isSaved) {
        await api.delete(`/saved-jobs/${jobId}`)
        setSavedJobIds((current) => current.filter((id) => id !== jobId))
        toast.success('Removed from saved jobs')
      } else {
        await api.post(`/saved-jobs/${jobId}`)
        setSavedJobIds((current) => [...current, jobId])
        toast.success('Job saved')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update saved job')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} positions available</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, companies, skills, location, or salary..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* LinkedIn Style - List + Detail Panel */}
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6 lg:h-[calc(100vh-280px)]">

          {/* Left - Job List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-y-auto max-h-[42vh] lg:max-h-none">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                <Briefcase className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No jobs found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedId(job.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${selected?.id === job.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <CompanyLogo company={job.company} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${selected?.id === job.id ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{job.company?.name}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {job.location || 'Location not set'} - {formatJobType(job.job_type)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.required_skills?.split(',').slice(0, 2).map((skill, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      {savedJobIds.includes(job.id) && (
                        <BookmarkCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right - Job Detail Panel */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-y-auto">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Briefcase className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a job to view details</p>
              </div>
            ) : (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 sm:p-6"
              >
                {/* Job Header */}
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                  <CompanyLogo company={selected.company} size="xl" className="w-14 h-14 sm:w-16 sm:h-16" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                    <p className="text-gray-600 font-medium mt-0.5">{selected.company?.name}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {selected.location || 'Location not set'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {formatJobType(selected.job_type)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={() => openApply(selected)}
                    disabled={applyModal.loading || !selectedAccepting}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {applyModal.loading && applyModal.job?.id === selected.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : selectedAccepting ? 'Apply Now' : 'Applications closed'}
                  </button>
                  <button
                    onClick={() => toggleSave(selected.id)}
                    disabled={savingId === selected.id}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
                      savedJobIds.includes(selected.id)
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                    } disabled:opacity-60`}
                  >
                    {savedJobIds.includes(selected.id) ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                    {savedJobIds.includes(selected.id) ? 'Saved' : 'Save'}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-sky-500" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Work mode</p>
                      <p className="text-sm font-bold text-gray-900">{formatWorkMode(selected.work_mode)}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3">
                    <Layers className="w-5 h-5 text-violet-500" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Experience</p>
                      <p className="text-sm font-bold text-gray-900">{formatExperienceLevel(selected.experience_level)}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Salary</p>
                      <p className="text-sm font-bold text-gray-900">{formatSalary(selected)}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3">
                    <Timer className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400">Deadline</p>
                      <p className="text-sm font-bold text-gray-900">{formatDeadline(selected)}</p>
                    </div>
                  </div>
                </div>

                {/* Required Skills */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.required_skills?.split(',').map((skill, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-sm font-medium">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">Job Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{selected.description}</p>
                </div>

                {/* AI Note */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-700">AI-Powered Matching</p>
                      <p className="text-xs text-indigo-500 mt-0.5">
                        When you apply, our AI will instantly analyze your resume and calculate your match score for this position.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <ApplyJobModal
        key={applyModal.open ? `apply-${applyModal.job?.id}` : 'apply-closed'}
        open={applyModal.open}
        job={applyModal.job}
        loading={applyModal.loading}
        onClose={closeApply}
        onSubmit={submitApplication}
      />
    </DashboardLayout>
  )
}

export default BrowseJobs
