import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const emptyForm = {
  name: '',
  industry: '',
  description: '',
  website: '',
  location: '',
  phone: '',
  contact_email: '',
  company_size: '',
  founded_year: '',
}

const defaultCompanyPreferences = {
  dark_mode: false,
  notify_messages: true,
  notify_candidate_activity: true,
  notify_quiz_results: true,
  notify_post_activity: true,
}

const companySizes = [
  '',
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
]

const fieldLabels = {
  name: 'Company name',
  industry: 'Industry',
  description: 'About company',
  website: 'Website',
  location: 'Location',
  contact_email: 'Contact email',
  company_size: 'Company size',
}

const completionFields = [
  'name',
  'industry',
  'description',
  'website',
  'location',
  'contact_email',
  'company_size',
]

const settingsTabs = [
  { key: 'account', label: 'Account', description: 'Name and login email', icon: User },
  { key: 'security', label: 'Security', description: 'Password and sessions', icon: Lock },
  { key: 'preferences', label: 'Preferences', description: 'Alerts and appearance', icon: Bell },
  { key: 'profile', label: 'Company profile', description: 'Branding and public info', icon: Building2 },
  { key: 'danger', label: 'Danger zone', description: 'Delete company account', icon: AlertTriangle },
]

const buildForm = (company = {}) => ({
  name: company.name || '',
  industry: company.industry || '',
  description: company.description || '',
  website: company.website || '',
  location: company.location || '',
  phone: company.phone || '',
  contact_email: company.contact_email || '',
  company_size: company.company_size || '',
  founded_year: company.founded_year || '',
})

const normalizeWebsite = (value) => {
  const website = String(value || '').trim()
  if (!website) return ''
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
}

const compactDate = (value) => {
  if (!value) return 'Not saved yet'

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const firstError = (err, fallback) => {
  const errors = err.response?.data?.errors
  if (errors) return Object.values(errors)[0]?.[0] || fallback

  return err.response?.data?.message || fallback
}

const applyDarkMode = (enabled) => {
  document.documentElement.classList.toggle('rs-dark', enabled)
  localStorage.setItem('recruitsense_dark_mode', enabled ? 'true' : 'false')
}

const inputClass = 'mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
const iconInputClass = 'w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

const SectionCard = ({ icon, title, description, children, footer }) => (
  <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
    {footer && <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">{footer}</div>}
  </section>
)

const ToggleRow = ({ checked, onChange, label, description, icon }) => (
  <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-500">{icon}</span>
      <div>
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
)

const CompanySettings = () => {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [company, setCompany] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState({ logo: null, cover_image: null })
  const [previews, setPreviews] = useState({ logo: null, cover: null })
  const [accountForm, setAccountForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [preferences, setPreferences] = useState(defaultCompanyPreferences)
  const [imageViewer, setImageViewer] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    let active = true

    Promise.allSettled([
      api.get('/company/profile'),
      api.get('/settings'),
    ])
      .then(([profileResult, settingsResult]) => {
        if (!active) return

        if (profileResult.status === 'fulfilled') {
          const companyProfile = profileResult.value.data
          setCompany(companyProfile)
          setForm(buildForm(companyProfile))
          setPreviews({
            logo: companyProfile.logo_url || null,
            cover: companyProfile.cover_image_url || null,
          })
        } else {
          toast.error(firstError(profileResult.reason, 'Failed to load company profile'))
        }

        if (settingsResult.status === 'fulfilled') {
          const settings = settingsResult.value.data
          setAccountForm({
            name: settings.user?.name || user?.name || '',
            email: settings.user?.email || user?.email || '',
          })
          const nextPreferences = {
            ...defaultCompanyPreferences,
            ...(settings.preferences || {}),
          }
          setPreferences(nextPreferences)
          applyDarkMode(Boolean(nextPreferences.dark_mode))
        } else {
          toast.error(firstError(settingsResult.reason, 'Failed to load account settings'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user?.email, user?.name])

  useEffect(() => {
    if (!imageViewer) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setImageViewer(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [imageViewer])

  const completionItems = useMemo(() => ([
    ...completionFields.map((field) => ({
      key: field,
      label: fieldLabels[field],
      done: Boolean(String(form[field] || '').trim()),
    })),
    {
      key: 'logo',
      label: 'Company logo',
      done: Boolean(previews.logo),
    },
  ]), [form, previews.logo])

  const completion = useMemo(() => {
    const complete = completionItems.filter((item) => item.done).length
    return Math.round((complete / completionItems.length) * 100)
  }, [completionItems])

  const missingItems = completionItems.filter((item) => !item.done)
  const savedForm = useMemo(() => buildForm(company || {}), [company])
  const hasUnsavedChanges = useMemo(() => (
    JSON.stringify(form) !== JSON.stringify(savedForm) || Boolean(files.logo || files.cover_image)
  ), [files.cover_image, files.logo, form, savedForm])

  const descriptionLength = String(form.description || '').trim().length
  const initials = (form.name || company?.name || accountForm.name || 'Company')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleFile = (event, field) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setFiles((current) => ({ ...current, [field]: file }))
    setPreviews((current) => ({
      ...current,
      [field === 'logo' ? 'logo' : 'cover']: URL.createObjectURL(file),
    }))
  }

  const openImageViewer = (type) => {
    const url = type === 'cover' ? previews.cover : previews.logo

    if (!url) {
      toast.error(type === 'cover' ? 'Upload a cover image first' : 'Upload a logo first')
      return
    }

    setImageViewer({
      type,
      url,
      title: type === 'cover' ? 'Cover image' : 'Company logo',
    })
  }

  const updatePreference = (key, value) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))

    if (key === 'dark_mode') {
      applyDarkMode(value)
    }
  }

  const resetProfile = () => {
    setForm(savedForm)
    setFiles({ logo: null, cover_image: null })
    setPreviews({
      logo: company?.logo_url || null,
      cover: company?.cover_image_url || null,
    })
  }

  const copyContact = async () => {
    const details = [
      form.name,
      form.contact_email,
      form.phone,
      normalizeWebsite(form.website),
      form.location,
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(details)
      toast.success('Company contact copied')
    } catch {
      toast.error('Could not copy company contact')
    }
  }

  const openWebsite = () => {
    const website = normalizeWebsite(form.website)

    if (!website) {
      toast.error('Add a website first')
      return
    }

    window.open(website, '_blank', 'noopener,noreferrer')
  }

  const saveProfile = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Company name is required')
      return
    }

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.append(key, value || ''))
    if (files.logo) formData.append('logo', files.logo)
    if (files.cover_image) formData.append('cover_image', files.cover_image)

    setSavingProfile(true)
    try {
      const res = await api.post('/company/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setCompany(res.data.company)
      setForm(buildForm(res.data.company))
      setFiles({ logo: null, cover_image: null })
      setPreviews({
        logo: res.data.company.logo_url || null,
        cover: res.data.company.cover_image_url || null,
      })
      updateUser?.({ name: res.data.user?.name || res.data.company.name })
      window.dispatchEvent(new CustomEvent('recruitsense-company-profile-updated', {
        detail: { company: res.data.company },
      }))
      toast.success('Company profile updated')
    } catch (err) {
      toast.error(firstError(err, 'Failed to update company profile'))
    } finally {
      setSavingProfile(false)
    }
  }

  const saveAccount = async (event) => {
    event.preventDefault()
    setSavingAccount(true)

    try {
      const res = await api.put('/settings/account', accountForm)
      setAccountForm({
        name: res.data.user?.name || accountForm.name,
        email: res.data.user?.email || accountForm.email,
      })
      updateUser?.(res.data.user)
      toast.success('Account updated')
    } catch (err) {
      toast.error(firstError(err, 'Failed to update account'))
    } finally {
      setSavingAccount(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setSavingPassword(true)

    try {
      await api.put('/settings/password', passwordForm)
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
      toast.success('Password updated')
    } catch (err) {
      toast.error(firstError(err, 'Failed to update password'))
    } finally {
      setSavingPassword(false)
    }
  }

  const savePreferences = async () => {
    setSavingPreferences(true)

    try {
      const res = await api.put('/settings/preferences', preferences)
      const nextPreferences = {
        ...defaultCompanyPreferences,
        ...(res.data.preferences || {}),
      }
      setPreferences(nextPreferences)
      applyDarkMode(Boolean(nextPreferences.dark_mode))
      toast.success('Preferences updated')
    } catch (err) {
      toast.error(firstError(err, 'Failed to update preferences'))
    } finally {
      setSavingPreferences(false)
    }
  }

  const deleteAccount = async () => {
    setDeletingAccount(true)

    try {
      await api.delete('/settings/account', { data: { password: deletePassword } })
      logout()
      toast.success('Account deleted')
      navigate('/')
    } catch (err) {
      toast.error(firstError(err, 'Failed to delete account'))
    } finally {
      setDeletingAccount(false)
    }
  }

  const renderAccountTab = () => (
    <div className="space-y-5">
      <SectionCard
        icon={<User className="w-5 h-5" />}
        title="Account"
        description="Update the login identity for this company account."
      >
        <form onSubmit={saveAccount} className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-sm font-semibold text-gray-700">Account name</span>
            <input
              value={accountForm.name}
              onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
              className={inputClass}
              placeholder="Recruiter or company account name"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-gray-700">Login email</span>
            <div className="mt-2 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={accountForm.email}
                onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                className={iconInputClass}
                placeholder="hr@company.com"
              />
            </div>
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={savingAccount}
              className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {savingAccount ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingAccount ? 'Saving...' : 'Save account'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Company profile link"
        description="Keep login details separate from the public company profile candidates see."
      >
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase text-gray-400">Public name</p>
            <p className="mt-2 text-sm font-bold text-gray-900">{form.name || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase text-gray-400">Contact email</p>
            <p className="mt-2 text-sm font-bold text-gray-900 truncate">{form.contact_email || 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase text-gray-400">Last saved</p>
            <p className="mt-2 text-sm font-bold text-gray-900">{compactDate(company?.updated_at)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="h-10 px-4 rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            Edit public profile
          </button>
          <button
            type="button"
            onClick={copyContact}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 inline-flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy contact
          </button>
        </div>
      </SectionCard>
    </div>
  )

  const renderSecurityTab = () => (
    <SectionCard
      icon={<Lock className="w-5 h-5" />}
      title="Password"
      description="Change the password used to sign in to this company account."
    >
      <form onSubmit={savePassword} className="space-y-4 max-w-2xl">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Current password</span>
          <input
            type="password"
            value={passwordForm.current_password}
            onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
            className={inputClass}
          />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-sm font-semibold text-gray-700">New password</span>
            <input
              type="password"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
              className={inputClass}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-gray-700">Confirm password</span>
            <input
              type="password"
              value={passwordForm.password_confirmation}
              onChange={(event) => setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))}
              className={inputClass}
            />
          </label>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          After changing password, other active sessions are removed and this session stays signed in.
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="h-11 px-5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {savingPassword ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {savingPassword ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>
    </SectionCard>
  )

  const renderPreferencesTab = () => (
    <div className="space-y-5">
      <SectionCard
        icon={<Bell className="w-5 h-5" />}
        title="Recruiter preferences"
        description="Choose the company updates you want RecruitSense to show."
      >
        <ToggleRow
          checked={preferences.dark_mode}
          onChange={(value) => updatePreference('dark_mode', value)}
          label="Dark mode"
          description="Use a darker RecruitSense theme on this device."
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <ToggleRow
          checked={preferences.notify_candidate_activity}
          onChange={(value) => updatePreference('notify_candidate_activity', value)}
          label="Candidate activity"
          description="New applicants and withdrawn applications."
          icon={<Briefcase className="w-4 h-4" />}
        />
        <ToggleRow
          checked={preferences.notify_quiz_results}
          onChange={(value) => updatePreference('notify_quiz_results', value)}
          label="Quiz results"
          description="Candidate quiz submissions and updated fit scores."
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <ToggleRow
          checked={preferences.notify_messages}
          onChange={(value) => updatePreference('notify_messages', value)}
          label="Messages"
          description="New messages from candidates and RecruitSense members."
          icon={<MessageCircle className="w-4 h-4" />}
        />
        <ToggleRow
          checked={preferences.notify_post_activity}
          onChange={(value) => updatePreference('notify_post_activity', value)}
          label="Post activity"
          description="Likes, comments, and reposts on company posts."
          icon={<Bell className="w-4 h-4" />}
        />

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={savePreferences}
            disabled={savingPreferences}
            className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {savingPreferences ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingPreferences ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </SectionCard>
    </div>
  )

  const renderProfileTab = () => (
    <form onSubmit={saveProfile} className="grid lg:grid-cols-[350px_minmax(0,1fr)] gap-5">
      <aside className="space-y-4">
        <section className="rounded-2xl border border-gray-100 bg-white overflow-visible">
          <div
            role={previews.cover ? 'button' : undefined}
            tabIndex={previews.cover ? 0 : -1}
            onClick={() => openImageViewer('cover')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openImageViewer('cover')
              }
            }}
            className={`h-40 rounded-t-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 bg-cover bg-center relative outline-none ${
              previews.cover ? 'cursor-zoom-in' : ''
            }`}
            style={previews.cover ? { backgroundImage: `url(${previews.cover})` } : undefined}
          >
            {previews.cover && (
              <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 text-gray-700 shadow-sm flex items-center justify-center">
                <Maximize2 className="w-4 h-4" />
              </span>
            )}
            <label
              onClick={(event) => event.stopPropagation()}
              className="absolute top-3 right-3 h-9 px-3 rounded-full bg-white/90 border border-white/80 text-sm font-semibold text-gray-700 hover:bg-white shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Cover
              <input type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event, 'cover_image')} />
            </label>
          </div>

          <div className="px-5 pb-5">
            <div className="-mt-12 flex items-end justify-between gap-3">
              <div className="relative z-10">
                <button
                  type="button"
                  onClick={() => openImageViewer('logo')}
                  disabled={!previews.logo}
                  className={`w-24 h-24 rounded-2xl border-4 border-white bg-indigo-600 overflow-hidden flex items-center justify-center text-white text-2xl font-bold shadow-sm shrink-0 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-default ${
                    previews.logo ? 'cursor-zoom-in' : ''
                  }`}
                  aria-label={previews.logo ? 'View company logo' : 'Company logo'}
                >
                  {previews.logo ? (
                    <img src={previews.logo} alt="Company logo" className="w-full h-full object-cover" />
                  ) : initials}
                </button>
                {previews.logo && (
                  <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-gray-700 shadow-sm border border-gray-100 flex items-center justify-center pointer-events-none">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                )}
              </div>
              <label className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 flex items-center justify-center gap-2 cursor-pointer">
                <Camera className="w-4 h-4" />
                Change logo
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event, 'logo')} />
              </label>
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">{form.name || 'Company name'}</h2>
            <p className="text-sm text-gray-500">{form.industry || 'Add industry'}</p>
            <p className="text-sm text-gray-600 mt-3 line-clamp-4">
              {form.description || 'Add a short company overview so candidates understand your work, culture, and hiring focus.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.location && (
                <span className="px-3 py-1 rounded-full border border-gray-100 bg-gray-50 text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {form.location}
                </span>
              )}
              {form.company_size && (
                <span className="px-3 py-1 rounded-full border border-gray-100 bg-gray-50 text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {form.company_size}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Profile readiness</h2>
              <p className="text-sm text-gray-500 mt-1">{missingItems.length === 0 ? 'Profile is ready for candidates.' : `${missingItems.length} item${missingItems.length === 1 ? '' : 's'} remaining`}</p>
            </div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-indigo-700"
              style={{ background: `conic-gradient(#4f46e5 ${completion * 3.6}deg, #eef2ff 0deg)` }}
            >
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">{completion}%</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {completionItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-xs font-bold text-amber-600">Missing</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </aside>

      <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Company profile</h2>
            <p className="text-sm text-gray-500 mt-1">This information appears with jobs and applicant communication.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasUnsavedChanges && (
              <span className="px-3 py-1 rounded-full border border-amber-100 bg-amber-50 text-xs font-bold text-amber-700">
                Unsaved changes
              </span>
            )}
            <button
              type="button"
              onClick={copyContact}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 inline-flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              type="button"
              onClick={openWebsite}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Website
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-gray-900">Identity</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-gray-700">Company name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Bright Future Pvt Ltd"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">Industry</span>
                <input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Software, HR, Education..."
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">Company size</span>
                <select
                  name="company_size"
                  value={form.company_size}
                  onChange={handleChange}
                  className={`${inputClass} bg-white`}
                >
                  {companySizes.map((size) => (
                    <option key={size || 'empty'} value={size}>{size || 'Select size'}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">Founded year</span>
                <input
                  name="founded_year"
                  type="number"
                  min="1800"
                  max="2100"
                  value={form.founded_year}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="2020"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">Location</span>
                <div className="mt-2 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className={iconInputClass}
                    placeholder="Chakwal, Punjab"
                  />
                </div>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-gray-900">Contact and web</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label>
                <span className="text-sm font-semibold text-gray-700">Contact email</span>
                <div className="mt-2 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="contact_email"
                    type="email"
                    value={form.contact_email}
                    onChange={handleChange}
                    className={iconInputClass}
                    placeholder="hr@company.com"
                  />
                </div>
              </label>

              <label>
                <span className="text-sm font-semibold text-gray-700">Phone</span>
                <div className="mt-2 relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={iconInputClass}
                    placeholder="+92 300 0000000"
                  />
                </div>
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-gray-700">Website</span>
                <div className="mt-2 relative">
                  <Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className={iconInputClass}
                    placeholder="https://company.com"
                  />
                </div>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-gray-900">Candidate pitch</h3>
              </div>
              <span className={`text-xs font-bold ${descriptionLength >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {descriptionLength}/80 recommended
              </span>
            </div>
            <label>
              <span className="text-sm font-semibold text-gray-700">About company</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={7}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                placeholder="Write a short company overview, culture, hiring focus, and work environment."
              />
            </label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <button
            type="button"
            onClick={resetProfile}
            disabled={!hasUnsavedChanges || savingProfile}
            className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset changes
          </button>
          <button
            type="submit"
            disabled={savingProfile}
            className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {savingProfile ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save company profile
          </button>
        </div>
      </section>
    </form>
  )

  const renderDangerTab = () => (
    <SectionCard
      icon={<Trash2 className="w-5 h-5" />}
      title="Delete account"
      description="Permanently remove this company account and its hiring data."
    >
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-800">
        This will delete the company account, posted jobs, applications connected to those jobs, messages, posts, and saved profile data.
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="h-11 px-5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete company account
        </button>
      </div>
    </SectionCard>
  )

  const renderActiveTab = () => {
    if (activeTab === 'security') return renderSecurityTab()
    if (activeTab === 'preferences') return renderPreferencesTab()
    if (activeTab === 'profile') return renderProfileTab()
    if (activeTab === 'danger') return renderDangerTab()

    return renderAccountTab()
  }

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-1">Company settings</p>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage account access, recruiter preferences, and company profile details.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={copyContact}
              className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy contact
            </button>
            <button
              type="button"
              onClick={openWebsite}
              className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open website
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
            <div className="h-80 rounded-2xl border border-gray-100 bg-white animate-pulse" />
            <div className="h-96 rounded-2xl border border-gray-100 bg-white animate-pulse" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
            <aside className="space-y-4">
              <section className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                    {previews.logo ? (
                      <img src={previews.logo} alt="Company logo" className="w-full h-full object-cover" />
                    ) : initials}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 truncate">{form.name || accountForm.name || 'Company account'}</h2>
                    <p className="text-sm text-gray-500 truncate">{accountForm.email || 'Email not set'}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-indigo-900">Profile readiness</span>
                    <span className="font-bold text-indigo-700">{completion}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${completion}%` }} />
                  </div>
                </div>
              </section>

              <nav className="rounded-2xl border border-gray-100 bg-white p-2">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full rounded-xl px-3 py-3 text-left flex items-start gap-3 transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                      <span>
                        <span className="block text-sm font-bold">{tab.label}</span>
                        <span className={`block text-xs mt-0.5 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`}>
                          {tab.description}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <main className="min-w-0">
              {renderActiveTab()}
            </main>
          </div>
        )}
      </div>

      {imageViewer && (
        <div
          className="fixed inset-0 z-[70] bg-gray-950/95 text-white"
          onClick={() => setImageViewer(null)}
        >
          <div className="absolute inset-x-0 top-0 z-10 px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/60">{form.name || 'Company profile'}</p>
              <h3 className="text-lg font-bold">{imageViewer.title}</h3>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setImageViewer(null)
              }}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Close image viewer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="h-full w-full flex items-center justify-center px-4 py-20 sm:px-8">
            <img
              src={imageViewer.url}
              alt={`${form.name || 'Company'} ${imageViewer.title}`}
              onClick={(event) => event.stopPropagation()}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-900">Delete company account</h2>
                <p className="text-sm text-gray-500 mt-1">Enter password to confirm permanent deletion.</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                This action cannot be undone.
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Password</span>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className={inputClass}
                  placeholder="Enter your password"
                />
              </label>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deletingAccount || !deletePassword}
                  className="h-11 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deletingAccount ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deletingAccount ? 'Deleting...' : 'Delete account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  )
}

export default CompanySettings
