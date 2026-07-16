import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Briefcase, MapPin, Clock, ChevronRight, Bookmark, BookmarkCheck, X } from 'lucide-react'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
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

    return jobs.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.company?.name?.toLowerCase().includes(q) ||
      j.required_skills?.toLowerCase().includes(q)
    )
  }, [jobs, search])

  const selected = filtered.find(job => job.id === selectedId) || filtered[0] || null

  const handleApply = async (jobId) => {
    setApplying(true)
    try {
      await api.post(`/jobs/${jobId}/apply`)
      toast.success('Application submitted! AI is analyzing your resume...')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally {
      setApplying(false)
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
            placeholder="Search jobs, companies, or skills..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* LinkedIn Style - List + Detail Panel */}
        <div className="grid grid-cols-5 gap-6 h-[calc(100vh-280px)]">

          {/* Left - Job List */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 overflow-y-auto">
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
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {job.company?.name?.charAt(0) || 'J'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${selected?.id === job.id ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{job.company?.name}</p>
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
          <div className="col-span-3 bg-white rounded-2xl border border-gray-100 overflow-y-auto">
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
                className="p-6"
              >
                {/* Job Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {selected.company?.name?.charAt(0) || 'J'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                    <p className="text-gray-600 font-medium mt-0.5">{selected.company?.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Pakistan
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Full Time
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => handleApply(selected.id)}
                    disabled={applying}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {applying ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Apply Now'}
                  </button>
                  <button
                    onClick={() => toggleSave(selected.id)}
                    disabled={savingId === selected.id}
                    className={`px-6 py-3 rounded-xl border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
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
    </DashboardLayout>
  )
}

export default BrowseJobs
