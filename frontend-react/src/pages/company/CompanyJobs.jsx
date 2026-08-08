import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  Edit3,
  EyeOff,
  Laptop,
  Layers,
  MapPin,
  PlusCircle,
  Save,
  Search,
  Send,
  Timer,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'
import {
  formatDeadline,
  formatExperienceLevel,
  formatJobType,
  formatSalary,
  formatWorkMode,
  isJobAcceptingApplications,
  isJobExpired,
} from '../../utils/jobDetails'

const emptyForm = {
  title: '',
  description: '',
  required_skills: '',
  job_type: 'full_time',
  work_mode: 'onsite',
  experience_level: 'entry',
  location: '',
  salary_min: '',
  salary_max: '',
  salary_currency: 'PKR',
  application_deadline: '',
  status: 'active',
}

const jobTypeOptions = [
  { key: 'full_time', label: 'Full time' },
  { key: 'part_time', label: 'Part time' },
  { key: 'contract', label: 'Contract' },
  { key: 'internship', label: 'Internship' },
  { key: 'temporary', label: 'Temporary' },
]

const workModeOptions = [
  { key: 'onsite', label: 'On-site' },
  { key: 'remote', label: 'Remote' },
  { key: 'hybrid', label: 'Hybrid' },
]

const experienceOptions = [
  { key: 'entry', label: 'Entry level' },
  { key: 'junior', label: 'Junior' },
  { key: 'mid', label: 'Mid level' },
  { key: 'senior', label: 'Senior' },
  { key: 'lead', label: 'Lead' },
]

const currencyOptions = ['PKR', 'USD', 'EUR', 'GBP']

const statusOptions = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'closed', label: 'Closed' },
]

const statusMeta = {
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    helper: 'Visible to job seekers and included in recommendations.',
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
    helper: 'Hidden from job seekers until you publish it.',
  },
  closed: {
    label: 'Closed',
    className: 'bg-red-50 text-red-600 border-red-200',
    helper: 'Hidden from new applicants while keeping existing history.',
  },
}

const getStatusMeta = (status) => statusMeta[status] || statusMeta.active

const formatDate = (value) => {
  if (!value) return 'Recently'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const splitSkills = (skills) => String(skills || '')
  .split(',')
  .map((skill) => skill.trim())
  .filter(Boolean)

const dateInputValue = (value) => {
  if (!value) return ''
  return String(value).slice(0, 10)
}

const todayInputValue = () => {
  const today = new Date()
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)

  return localDate.toISOString().slice(0, 10)
}

const CompanyJobs = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(searchParams.get('compose') === '1')
  const [editingJob, setEditingJob] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteJob, setDeleteJob] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.get('/my-jobs')
        setJobs(res.data || [])
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load company jobs')
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesStatus = statusFilter === 'all' || (job.status || 'active') === statusFilter
      const searchText = [
        job.title,
        job.description,
        job.required_skills,
        job.location,
        formatJobType(job.job_type),
        formatWorkMode(job.work_mode),
        formatExperienceLevel(job.experience_level),
        formatSalary(job),
        formatDeadline(job),
      ].filter(Boolean).join(' ').toLowerCase()
      const matchesSearch = !query || searchText.includes(query)

      return matchesStatus && matchesSearch
    })
  }, [jobs, search, statusFilter])

  const statusCounts = useMemo(() => ({
    all: jobs.length,
    active: jobs.filter((job) => (job.status || 'active') === 'active').length,
    draft: jobs.filter((job) => job.status === 'draft').length,
    closed: jobs.filter((job) => job.status === 'closed').length,
  }), [jobs])

  const jobStats = useMemo(() => {
    const totalApplicants = jobs.reduce((sum, job) => sum + Number(job.applications_count || 0), 0)
    const pendingApplicants = jobs.reduce((sum, job) => sum + Number(job.pending_applications_count || 0), 0)
    const screeningApplicants = jobs.reduce((sum, job) => sum + Number(job.screening_applications_count || 0), 0)
    const scheduledInterviews = jobs.reduce((sum, job) => sum + Number(job.scheduled_interviews_count || 0), 0)
    const acceptingJobs = jobs.filter((job) => isJobAcceptingApplications(job)).length
    const expiredJobs = jobs.filter((job) => isJobExpired(job)).length

    return [
      {
        label: 'Total jobs',
        value: jobs.length,
        helper: `${acceptingJobs} accepting applications`,
        icon: <Briefcase className="w-5 h-5" />,
        tone: 'bg-indigo-50 text-indigo-600',
      },
      {
        label: 'Applicants',
        value: totalApplicants,
        helper: `${pendingApplicants + screeningApplicants} in review`,
        icon: <Users className="w-5 h-5" />,
        tone: 'bg-sky-50 text-sky-600',
      },
      {
        label: 'Interviews',
        value: scheduledInterviews,
        helper: 'Scheduled across jobs',
        icon: <Calendar className="w-5 h-5" />,
        tone: 'bg-violet-50 text-violet-600',
      },
      {
        label: 'Drafts',
        value: statusCounts.draft,
        helper: expiredJobs ? `${expiredJobs} deadline passed` : 'Not visible yet',
        icon: <Edit3 className="w-5 h-5" />,
        tone: 'bg-amber-50 text-amber-600',
      },
    ]
  }, [jobs, statusCounts.draft])

  const formSkills = useMemo(() => splitSkills(form.required_skills), [form.required_skills])
  const formStatusMeta = getStatusMeta(form.status)

  const openCreate = () => {
    setEditingJob(null)
    setForm(emptyForm)
    setShowForm(true)
    setSearchParams({ compose: '1' })
  }

  const openEdit = (job) => {
    setEditingJob(job)
    setForm({
      title: job.title || '',
      description: job.description || '',
      required_skills: job.required_skills || '',
      job_type: job.job_type || 'full_time',
      work_mode: job.work_mode || 'onsite',
      experience_level: job.experience_level || 'entry',
      location: job.location || '',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      salary_currency: job.salary_currency || 'PKR',
      application_deadline: dateInputValue(job.application_deadline),
      status: job.status || 'active',
    })
    setShowForm(true)
    setSearchParams({})
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingJob(null)
    setForm(emptyForm)
    setSearchParams({})
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      required_skills: form.required_skills.trim(),
      job_type: form.job_type || null,
      work_mode: form.work_mode || null,
      experience_level: form.experience_level || null,
      location: form.location.trim(),
      salary_min: form.salary_min,
      salary_max: form.salary_max,
      salary_currency: form.salary_currency || 'PKR',
      application_deadline: form.application_deadline || null,
      status: form.status || 'active',
    }

    if (!payload.title || !payload.description || !payload.required_skills) {
      toast.error('Please fill title, description, and required skills')
      return
    }

    if (Number(payload.salary_min || 0) > 0 && Number(payload.salary_max || 0) > 0 && Number(payload.salary_max) < Number(payload.salary_min)) {
      toast.error('Maximum salary should be greater than minimum salary')
      return
    }

    setSaving(true)
    try {
      if (editingJob) {
        const res = await api.put(`/jobs/${editingJob.id}`, payload)
        setJobs((current) => current.map((job) => (
          job.id === editingJob.id ? { ...job, ...(res.data.job || payload) } : job
        )))
        toast.success('Job updated')
        if (res.data.job_alert_notifications > 0) {
          toast.success(`${res.data.job_alert_notifications} matching job alerts notified`)
        }
      } else {
        const res = await api.post('/jobs', payload)
        setJobs((current) => [res.data.job, ...current])
        toast.success(payload.status === 'active' ? 'Job published' : 'Job saved')
        if (res.data.job_alert_notifications > 0) {
          toast.success(`${res.data.job_alert_notifications} matching job alerts notified`)
        }
      }
      closeForm()
    } catch (err) {
      const errors = err.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || err.response?.data?.message || 'Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  const updateJobStatus = async (job, nextStatus) => {
    if (!job || job.status === nextStatus) return

    setStatusUpdatingId(job.id)
    try {
      const res = await api.put(`/jobs/${job.id}`, { status: nextStatus })
      const updatedJob = res.data.job || { ...job, status: nextStatus }
      setJobs((current) => current.map((item) => (
        item.id === job.id ? { ...item, ...updatedJob } : item
      )))
      toast.success(nextStatus === 'active' ? 'Job activated' : nextStatus === 'closed' ? 'Job closed' : 'Job moved to draft')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteJob) return

    setDeleting(true)
    try {
      await api.delete(`/jobs/${deleteJob.id}`)
      setJobs((current) => current.filter((job) => job.id !== deleteJob.id))
      toast.success('Job deleted')
      setDeleteJob(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job')
    } finally {
      setDeleting(false)
    }
  }

  const showJobForm = showForm || searchParams.get('compose') === '1'

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">Create job posts and manage applicant flow.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="h-11 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Post a job
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {jobStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.tone}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-2">{loading ? 'Loading...' : stat.helper}</p>
            </div>
          ))}
        </div>

        {showJobForm && (
          <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold text-gray-900">{editingJob ? 'Edit job' : 'Post a new job'}</h2>
                <p className="text-sm text-gray-500 mt-1">Add role details, skills, deadline, and visibility.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Close job form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Job title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Junior Backend Developer"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Lahore, Pakistan"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">{formStatusMeta.helper}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Job type</label>
                  <select
                    name="job_type"
                    value={form.job_type}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    {jobTypeOptions.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Work mode</label>
                  <select
                    name="work_mode"
                    value={form.work_mode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    {workModeOptions.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Experience</label>
                  <select
                    name="experience_level"
                    value={form.experience_level}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    {experienceOptions.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Apply deadline</label>
                  <input
                    type="date"
                    name="application_deadline"
                    value={form.application_deadline}
                    min={todayInputValue()}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Required skills</label>
                  <input
                    name="required_skills"
                    value={form.required_skills}
                    onChange={handleChange}
                    placeholder="Laravel, PHP, MySQL, REST API"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  {formSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {formSkills.slice(0, 5).map((skill) => (
                        <span key={skill} className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 text-[11px] font-semibold">
                          {skill}
                        </span>
                      ))}
                      {formSkills.length > 5 && (
                        <span className="rounded-full bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 text-[11px] font-semibold">
                          +{formSkills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Min salary</label>
                  <input
                    type="number"
                    min="0"
                    name="salary_min"
                    value={form.salary_min}
                    onChange={handleChange}
                    placeholder="60000"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Max salary</label>
                  <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2">
                    <input
                      type="number"
                      min="0"
                      name="salary_max"
                      value={form.salary_max}
                      onChange={handleChange}
                      placeholder="120000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <select
                      name="salary_currency"
                      value={form.salary_currency}
                      onChange={handleChange}
                      aria-label="Salary currency"
                      className="w-full rounded-xl border border-gray-200 px-2 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Job description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Write responsibilities, requirements, and expected experience..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-y"
                />
              </div>
              <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-3">
                <div className={`rounded-xl border p-3 ${form.title.trim() ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {form.title.trim() ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Title
                  </div>
                  <p className="text-xs mt-1">{form.title.trim() ? 'Role title is ready.' : 'Add a clear job title.'}</p>
                </div>
                <div className={`rounded-xl border p-3 ${form.description.trim() ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {form.description.trim() ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Description
                  </div>
                  <p className="text-xs mt-1">{form.description.trim() ? 'Responsibilities are added.' : 'Add role details for candidates.'}</p>
                </div>
                <div className={`rounded-xl border p-3 ${formSkills.length ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {formSkills.length ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Skills
                  </div>
                  <p className="text-xs mt-1">{formSkills.length ? `${formSkills.length} skills will be used for matching.` : 'Add comma-separated skills.'}</p>
                </div>
                <div className={`rounded-xl border p-3 ${form.location.trim() ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {form.location.trim() ? <MapPin className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Location
                  </div>
                  <p className="text-xs mt-1">{form.location.trim() ? form.location : 'Add office or hiring location.'}</p>
                </div>
                <div className={`rounded-xl border p-3 ${Number(form.salary_min || 0) > 0 || Number(form.salary_max || 0) > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {Number(form.salary_min || 0) > 0 || Number(form.salary_max || 0) > 0 ? <Banknote className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Salary
                  </div>
                  <p className="text-xs mt-1">{formatSalary(form)}</p>
                </div>
                <div className={`rounded-xl border p-3 ${form.application_deadline ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {form.application_deadline ? <Timer className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Deadline
                  </div>
                  <p className="text-xs mt-1">{formatDeadline(form)}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingJob ? 'Save changes' : form.status === 'active' ? 'Publish job' : 'Save job'}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs by title, skills, location, salary, or work mode..."
            className="w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 py-3.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setStatusFilter(option.key)}
              className={`h-10 px-4 rounded-full border text-sm font-semibold transition-all ${
                statusFilter === option.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {option.label}
              <span className={statusFilter === option.key ? 'ml-2 text-white/80' : 'ml-2 text-gray-400'}>
                {statusCounts[option.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-52 rounded-2xl bg-white border border-gray-100 p-5">
                <div className="h-full rounded-xl bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-300 mx-auto mb-4 flex items-center justify-center">
              <Briefcase className="w-8 h-8" />
            </div>
            <p className="font-bold text-gray-900">No jobs found</p>
            <p className="text-sm text-gray-500 mt-1">
              {search || statusFilter !== 'all' ? 'Try a different search or filter.' : 'Create your first company job post.'}
            </p>
            {!search && statusFilter === 'all' && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
              >
                Post a job
              </button>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const skills = splitSkills(job.required_skills)
              const currentStatus = job.status || 'active'
              const meta = getStatusMeta(currentStatus)
              const expired = isJobExpired(job)
              const acceptingApplications = isJobAcceptingApplications(job)

              return (
                <article key={job.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {job.title?.charAt(0)?.toUpperCase() || 'J'}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-gray-900 truncate">{job.title}</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" />
                          Posted {formatDate(job.created_at)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.className}`}>
                            {meta.label}
                          </span>
                          {expired && (
                            <span className="inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold bg-red-50 text-red-600 border-red-100">
                              Deadline passed
                            </span>
                          )}
                          {acceptingApplications && (
                            <span className="inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-100">
                              Accepting
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(job)}
                        className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center"
                        aria-label="Edit job"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteJob(job)}
                        className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
                        aria-label="Delete job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-4 line-clamp-3">{job.description}</p>

                  <div className="grid sm:grid-cols-2 gap-2 mt-4 text-xs font-semibold">
                    <span className="rounded-xl bg-gray-50 text-gray-600 border border-gray-100 px-3 py-2 flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{job.location || 'Location not set'}</span>
                    </span>
                    <span className="rounded-xl bg-sky-50 text-sky-700 border border-sky-100 px-3 py-2 flex items-center gap-2 min-w-0">
                      <Laptop className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="truncate">{formatWorkMode(job.work_mode)}</span>
                    </span>
                    <span className="rounded-xl bg-violet-50 text-violet-700 border border-violet-100 px-3 py-2 flex items-center gap-2 min-w-0">
                      <Layers className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="truncate">{formatJobType(job.job_type)} - {formatExperienceLevel(job.experience_level)}</span>
                    </span>
                    <span className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-2 flex items-center gap-2 min-w-0">
                      <Banknote className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{formatSalary(job)}</span>
                    </span>
                    <span className={`sm:col-span-2 rounded-xl border px-3 py-2 flex items-center gap-2 min-w-0 ${
                      expired
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      <Timer className="w-4 h-4 shrink-0" />
                      <span className="truncate">{formatDeadline(job)}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {skills.slice(0, 6).map((skill) => (
                      <span key={skill} className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                    {skills.length > 6 && (
                      <span className="rounded-full bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1 text-xs font-semibold">
                        +{skills.length - 6}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 text-center">
                    <div className="rounded-xl bg-gray-50 px-2 py-3">
                      <p className="text-lg font-bold text-gray-900">{job.applications_count || 0}</p>
                      <p className="text-xs text-gray-500">Applicants</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-2 py-3">
                      <p className="text-lg font-bold text-amber-600">{job.pending_applications_count || 0}</p>
                      <p className="text-xs text-amber-700">Pending</p>
                    </div>
                    <div className="rounded-xl bg-sky-50 px-2 py-3">
                      <p className="text-lg font-bold text-sky-600">{job.screening_applications_count || 0}</p>
                      <p className="text-xs text-sky-700">Screening</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-2 py-3">
                      <p className="text-lg font-bold text-emerald-600">{job.shortlisted_applications_count || 0}</p>
                      <p className="text-xs text-emerald-700">Shortlisted</p>
                    </div>
                    <div className="rounded-xl bg-violet-50 px-2 py-3">
                      <p className="text-lg font-bold text-violet-600">{job.scheduled_interviews_count || 0}</p>
                      <p className="text-xs text-violet-700">Interviews</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1">
                      {job.offered_applications_count || 0} offered
                    </span>
                    <span className="rounded-full bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1">
                      {job.hired_applications_count || 0} hired
                    </span>
                    <span className="rounded-full bg-red-50 text-red-600 border border-red-100 px-3 py-1">
                      {job.rejected_applications_count || 0} rejected
                    </span>
                    <span className="rounded-full bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1">
                      {job.withdrawn_applications_count || 0} withdrawn
                    </span>
                  </div>

                  <div className={`mt-4 grid gap-2 ${currentStatus === 'draft' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                    <button
                      type="button"
                      onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                      className="h-10 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 text-sm font-semibold hover:bg-indigo-100 flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      View applicants
                    </button>
                    {currentStatus === 'active' ? (
                      <button
                        type="button"
                        disabled={statusUpdatingId === job.id}
                        onClick={() => updateJobStatus(job, 'closed')}
                        className="h-10 rounded-xl border border-red-200 text-red-600 bg-red-50 text-sm font-semibold hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {statusUpdatingId === job.id ? (
                          <span className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                        Close job
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={statusUpdatingId === job.id}
                        onClick={() => updateJobStatus(job, 'active')}
                        className="h-10 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {statusUpdatingId === job.id ? (
                          <span className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {currentStatus === 'closed' ? 'Reopen' : 'Publish'}
                      </button>
                    )}
                    {currentStatus !== 'draft' && (
                      <button
                        type="button"
                        disabled={statusUpdatingId === job.id}
                        onClick={() => updateJobStatus(job, 'draft')}
                        className="h-10 rounded-xl border border-gray-200 text-gray-600 bg-white text-sm font-semibold hover:border-amber-200 hover:text-amber-700 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {statusUpdatingId === job.id ? (
                          <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Edit3 className="w-4 h-4" />
                        )}
                        Draft
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {deleteJob && (
          <div className="fixed inset-0 z-50 bg-gray-900/45 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delete job?</h2>
                  <p className="text-sm text-gray-500 mt-1">{deleteJob.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteJob(null)}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Close delete confirmation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600">
                  {Number(deleteJob.applications_count || 0) > 0
                    ? `This job has ${deleteJob.applications_count} applicant${Number(deleteJob.applications_count || 0) === 1 ? '' : 's'}. Deleting it will also remove linked applications, quiz responses, skill gaps, and saved-job references.`
                    : 'This will remove the job post from your company panel.'}
                </p>
                <div className="mt-5 flex flex-col sm:flex-row sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteJob(null)}
                    className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={confirmDelete}
                    className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}

export default CompanyJobs
