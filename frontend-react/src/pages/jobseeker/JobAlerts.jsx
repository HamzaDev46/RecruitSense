import { useEffect, useMemo, useState } from 'react'
import {
  BellRing,
  Briefcase,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'

const emptyForm = {
  keyword: '',
  skills: '',
  location: '',
  min_match_score: 50,
  is_active: true,
}

const formatDate = (date) => {
  if (!date) return 'Never'

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const JobAlerts = () => {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [profileSkills, setProfileSkills] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.is_active).length, [alerts])
  const totalMatches = useMemo(
    () => alerts.reduce((total, alert) => total + Number(alert.matched_jobs_count || 0), 0),
    [alerts]
  )

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/job-alerts')
      setAlerts(res.data.alerts || [])
      setProfileSkills(res.data.profile_skills || '')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load job alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    api.get('/job-alerts')
      .then((res) => {
        if (!active) return
        setAlerts(res.data.alerts || [])
        setProfileSkills(res.data.profile_skills || '')
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load job alerts')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setDeleteTarget(null)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const saveAlert = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...form,
        min_match_score: Number(form.min_match_score),
      }
      const res = editingId
        ? await api.put(`/job-alerts/${editingId}`, payload)
        : await api.post('/job-alerts', payload)

      setAlerts((current) => {
        if (!editingId) return [res.data.alert, ...current]

        return current.map((alert) => alert.id === editingId ? res.data.alert : alert)
      })
      toast.success(editingId ? 'Job alert updated' : 'Job alert created')
      resetForm()
      window.dispatchEvent(new Event('recruitsense-notifications-updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job alert')
    } finally {
      setSaving(false)
    }
  }

  const editAlert = (alert) => {
    setEditingId(alert.id)
    setForm({
      keyword: alert.keyword || '',
      skills: alert.skills || '',
      location: alert.location || '',
      min_match_score: alert.min_match_score || 50,
      is_active: Boolean(alert.is_active),
    })
  }

  const toggleAlert = async (alert) => {
    setBusyId(alert.id)
    try {
      const res = await api.put(`/job-alerts/${alert.id}`, {
        is_active: !alert.is_active,
      })
      setAlerts((current) => current.map((item) => item.id === alert.id ? res.data.alert : item))
      toast.success(res.data.alert.is_active ? 'Alert enabled' : 'Alert paused')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update alert')
    } finally {
      setBusyId(null)
    }
  }

  const requestDeleteAlert = (alert) => {
    setDeleteTarget(alert)
  }

  const deleteAlert = async (alert) => {
    setBusyId(alert.id)
    try {
      await api.delete(`/job-alerts/${alert.id}`)
      setAlerts((current) => current.filter((item) => item.id !== alert.id))
      setDeleteTarget(null)
      if (editingId === alert.id) resetForm()
      toast.success('Job alert deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete alert')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">Get notified when new jobs match your skills and keywords.</p>
          </div>
          <button
            onClick={loadAlerts}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Total alerts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{alerts.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Active alerts</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeAlerts}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500">Current matches</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalMatches}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          <form onSubmit={saveAlert} className="bg-white border border-gray-100 rounded-xl p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <BellRing className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit alert' : 'Create alert'}</h2>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Keyword</span>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="keyword"
                    value={form.keyword}
                    onChange={handleChange}
                    placeholder="Backend developer, React, Support..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Skills</span>
                <textarea
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  rows="3"
                  placeholder={profileSkills || 'React, Laravel, MySQL'}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to use your profile/resume skills.</p>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Preferred location</span>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Pakistan, Lahore, Remote"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Minimum match</span>
                  <span className="text-sm font-bold text-indigo-600">{form.min_match_score}%</span>
                </div>
                <input
                  type="range"
                  name="min_match_score"
                  min="0"
                  max="100"
                  step="5"
                  value={form.min_match_score}
                  onChange={handleChange}
                  className="mt-2 w-full"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <span className="text-sm font-semibold text-gray-700">Alert active</span>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Saving...' : editingId ? 'Save alert' : 'Create alert'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-44 bg-white border border-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <BellRing className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h2 className="font-bold text-gray-900">No job alerts yet</h2>
                <p className="text-sm text-gray-500 mt-1">Create an alert to watch for matching jobs automatically.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-white border border-gray-100 rounded-xl p-5">
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-gray-900">
                            {alert.keyword || 'Profile skill alert'}
                          </h2>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            alert.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {alert.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <SlidersHorizontal className="w-4 h-4" />
                            {alert.min_match_score}% minimum match
                          </span>
                          {alert.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {alert.location}
                            </span>
                          )}
                          <span>Last notified: {formatDate(alert.last_notified_at)}</span>
                        </div>
                        {alert.skills && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {alert.skills.split(',').slice(0, 8).map((skill) => (
                              <span key={skill} className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAlert(alert)}
                          disabled={busyId === alert.id}
                          className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                            alert.is_active
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          } disabled:opacity-60`}
                        >
                          {alert.is_active ? 'Pause' : 'Enable'}
                        </button>
                        <button
                          onClick={() => editAlert(alert)}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center"
                          title="Edit alert"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDeleteAlert(alert)}
                          disabled={busyId === alert.id}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center disabled:opacity-60"
                          title="Delete alert"
                        >
                          {busyId === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          Matching jobs
                        </h3>
                        <span className="text-xs font-semibold text-gray-500">{alert.matched_jobs_count} matches</span>
                      </div>

                      {alert.latest_matches.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                          <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No current jobs match this alert yet.</p>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-3 gap-3">
                          {alert.latest_matches.map((match) => (
                            <button
                              key={match.job.id}
                              onClick={() => navigate(`/jobs/${match.job.id}`)}
                              className="text-left border border-gray-100 rounded-xl p-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 text-sm truncate">{match.job.title}</p>
                                  <p className="text-xs text-gray-500 truncate">{match.job.company?.name}</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-1">
                                  {match.match_score}%
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {match.matched_skills.slice(0, 3).map((skill) => (
                                  <span key={skill} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-indigo-100 text-indigo-700">
                                    {skill}
                                  </span>
                                ))}
                                {match.keyword_matched && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-emerald-100 text-emerald-700">
                                    keyword
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete job alert?</h2>
                <p className="text-sm text-gray-500 mt-1">{deleteTarget.keyword || 'Profile skill alert'}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={busyId === deleteTarget.id}
                aria-label="Close delete confirmation"
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-600">
                This alert will stop watching for matching jobs. Existing notifications and saved jobs will stay as they are.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={busyId === deleteTarget.id}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteAlert(deleteTarget)}
                  disabled={busyId === deleteTarget.id}
                  className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {busyId === deleteTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {busyId === deleteTarget.id ? 'Deleting...' : 'Delete alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default JobAlerts
