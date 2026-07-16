import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Briefcase, Clock, MapPin, Search, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState(null)

  const loadSavedJobs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/saved-jobs')
      setSavedJobs(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load saved jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    api.get('/saved-jobs')
      .then((res) => {
        if (active) setSavedJobs(res.data)
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load saved jobs')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return savedJobs

    return savedJobs.filter(({ job }) =>
      job?.title?.toLowerCase().includes(query) ||
      job?.company?.name?.toLowerCase().includes(query) ||
      job?.required_skills?.toLowerCase().includes(query)
    )
  }, [savedJobs, search])

  const handleUnsave = async (jobId) => {
    try {
      await api.delete(`/saved-jobs/${jobId}`)
      setSavedJobs((current) => current.filter((item) => item.job?.id !== jobId))
      toast.success('Removed from saved jobs')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove saved job')
    }
  }

  const handleApply = async (jobId) => {
    setApplyingId(jobId)
    try {
      await api.post(`/jobs/${jobId}/apply`)
      toast.success('Application submitted! AI is analyzing your resume...')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} saved positions</p>
          </div>
          <button
            onClick={loadSavedJobs}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search saved jobs, companies, or skills..."
            className="w-full pl-12 pr-11 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 bg-white border border-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-bold text-gray-900">No saved jobs found</h2>
            <p className="text-sm text-gray-500 mt-1">Save jobs while browsing so you can apply later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(({ id, job, saved_at }) => (
              <div key={id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {job?.company?.name?.charAt(0) || 'J'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900">{job?.title}</h2>
                    <p className="text-sm text-gray-600 mt-0.5">{job?.company?.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Pakistan
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Saved {saved_at ? new Date(saved_at).toLocaleDateString() : 'recently'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job?.required_skills?.split(',').slice(0, 5).map((skill, index) => (
                        <span key={index} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUnsave(job.id)}
                      className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center"
                      title="Remove saved job"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applyingId === job.id}
                      className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                    >
                      <Briefcase className="w-4 h-4" />
                      {applyingId === job.id ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default SavedJobs
