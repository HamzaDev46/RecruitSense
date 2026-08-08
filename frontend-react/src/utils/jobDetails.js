export const jobTypeLabels = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}

export const workModeLabels = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

export const experienceLevelLabels = {
  entry: 'Entry level',
  junior: 'Junior',
  mid: 'Mid level',
  senior: 'Senior',
  lead: 'Lead',
}

const formatNumber = (value) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
}).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const formatJobType = (value) => jobTypeLabels[value] || 'Job type not set'

export const formatWorkMode = (value) => workModeLabels[value] || 'Work mode not set'

export const formatExperienceLevel = (value) => experienceLevelLabels[value] || 'Experience not set'

export const formatSalary = (job) => {
  const currency = job?.salary_currency || 'PKR'
  const min = Number(job?.salary_min || 0)
  const max = Number(job?.salary_max || 0)

  if (min > 0 && max > 0) return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`
  if (min > 0) return `${currency} ${formatNumber(min)}+`
  if (max > 0) return `Up to ${currency} ${formatNumber(max)}`

  return 'Salary not listed'
}

export const formatDeadline = (job) => {
  const formatted = formatDate(job?.application_deadline)

  return formatted ? `Apply by ${formatted}` : 'No deadline'
}

export const isJobExpired = (job) => {
  if (!job) return false
  if (typeof job.is_expired === 'boolean') return job.is_expired
  if (!job.application_deadline) return false

  const deadline = new Date(job.application_deadline)
  if (Number.isNaN(deadline.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)

  return deadline < today
}

export const isJobAcceptingApplications = (job) => {
  if (!job) return false
  if (typeof job.is_accepting_applications === 'boolean') return job.is_accepting_applications

  return (job.status || 'active') === 'active' && !isJobExpired(job)
}

export const jobSummaryMeta = (job) => ([
  job?.location || 'Location not set',
  formatWorkMode(job?.work_mode),
  formatJobType(job?.job_type),
  formatExperienceLevel(job?.experience_level),
])
