import { useEffect, useState } from 'react'
import {
  Bell,
  Briefcase,
  Check,
  Eye,
  Heart,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Moon,
  Save,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const defaultPreferences = {
  profile_visibility: 'public',
  show_profile_view_notifications: true,
  allow_search_appearance_tracking: true,
  notify_connections: true,
  notify_messages: true,
  notify_application_updates: true,
  notify_job_alerts: true,
  notify_post_activity: true,
  dark_mode: false,
}

const firstError = (err, fallback) => {
  const errors = err.response?.data?.errors
  if (errors) return Object.values(errors)[0]?.[0] || fallback

  return err.response?.data?.message || fallback
}

const SectionCard = ({ icon, title, description, children }) => (
  <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </section>
)

const Field = ({ label, icon, children }) => (
  <label className="block">
    <span className="text-sm font-semibold text-gray-700">{label}</span>
    <div className="relative mt-1">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      {children}
    </div>
  </label>
)

const inputClass = (withIcon = false) => (
  `w-full ${withIcon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`
)

const applyDarkMode = (enabled) => {
  document.documentElement.classList.toggle('rs-dark', enabled)
  localStorage.setItem('recruitsense_dark_mode', enabled ? 'true' : 'false')
}

const ToggleRow = ({ checked, onChange, label, description, icon }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-b-0">
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

const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [accountForm, setAccountForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [deletePassword, setDeletePassword] = useState('')

  useEffect(() => {
    let active = true

    api.get('/settings')
      .then((res) => {
        if (!active) return

        setAccountForm({
          name: res.data.user?.name || '',
          email: res.data.user?.email || '',
        })
        setPreferences({
          ...defaultPreferences,
          ...(res.data.preferences || {}),
        })
        applyDarkMode(Boolean(res.data.preferences?.dark_mode))
      })
      .catch((err) => {
        if (active) toast.error(firstError(err, 'Failed to load settings'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updatePreference = (key, value) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))

    if (key === 'dark_mode') {
      applyDarkMode(value)
    }
  }

  const saveAccount = async (event) => {
    event.preventDefault()
    setSavingAccount(true)

    try {
      const res = await api.put('/settings/account', accountForm)
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
      setPreferences({
        ...defaultPreferences,
        ...(res.data.preferences || {}),
      })
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the RecruitSense settings that affect your profile, applications, network, and notifications.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-44 bg-white border border-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-6">
              <SectionCard
                icon={<User className="w-5 h-5" />}
                title="Account"
                description="Update your name and login email."
              >
                <form onSubmit={saveAccount} className="space-y-4">
                  <Field label="Full name">
                    <input
                      value={accountForm.name}
                      onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Email address" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                      className={inputClass(true)}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingAccount}
                      className="px-4 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                    >
                      {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingAccount ? 'Saving...' : 'Save account'}
                    </button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard
                icon={<Lock className="w-5 h-5" />}
                title="Password"
                description="Change your password for account security."
              >
                <form onSubmit={savePassword} className="space-y-4">
                  <Field label="Current password">
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="New password">
                    <input
                      type="password"
                      value={passwordForm.password}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Confirm password">
                    <input
                      type="password"
                      value={passwordForm.password_confirmation}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                      className={inputClass()}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 flex items-center gap-2"
                    >
                      {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {savingPassword ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </form>
              </SectionCard>
            </div>

            <SectionCard
              icon={<Moon className="w-5 h-5" />}
              title="Appearance"
              description="Switch between light and dark mode."
            >
              <ToggleRow
                checked={preferences.dark_mode}
                onChange={(value) => updatePreference('dark_mode', value)}
                label="Dark mode"
                description="Use a darker theme across RecruitSense on this device."
                icon={<Moon className="w-4 h-4" />}
              />

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={savingPreferences}
                  className="px-4 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {savingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {savingPreferences ? 'Saving...' : 'Save appearance'}
                </button>
              </div>
            </SectionCard>

            <SectionCard
              icon={<Shield className="w-5 h-5" />}
              title="Privacy"
              description="Control who can view your profile and analytics tracking."
            >
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">Profile visibility</p>
                <div className="grid md:grid-cols-3 gap-3 mb-5">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can view your profile.' },
                    { value: 'network', label: 'Network only', desc: 'Only accepted connections can view it.' },
                    { value: 'private', label: 'Private', desc: 'Only you can view your profile.' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        preferences.profile_visibility === option.value
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="profile_visibility"
                        value={option.value}
                        checked={preferences.profile_visibility === option.value}
                        onChange={() => updatePreference('profile_visibility', option.value)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-bold text-gray-900">{option.label}</span>
                      <span className="block text-xs text-gray-500 mt-1">{option.desc}</span>
                    </label>
                  ))}
                </div>

                <ToggleRow
                  checked={preferences.show_profile_view_notifications}
                  onChange={(value) => updatePreference('show_profile_view_notifications', value)}
                  label="Profile view alerts"
                  description="Notify me when another user views my profile."
                  icon={<Eye className="w-4 h-4" />}
                />
                <ToggleRow
                  checked={preferences.allow_search_appearance_tracking}
                  onChange={(value) => updatePreference('allow_search_appearance_tracking', value)}
                  label="Search appearance count"
                  description="Track when my profile appears in network search."
                  icon={<Search className="w-4 h-4" />}
                />

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={savePreferences}
                    disabled={savingPreferences}
                    className="px-4 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {savingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {savingPreferences ? 'Saving...' : 'Save privacy'}
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={<Bell className="w-5 h-5" />}
              title="Notifications"
              description="Choose which RecruitSense updates you want to receive."
            >
              <div>
                <ToggleRow
                  checked={preferences.notify_connections}
                  onChange={(value) => updatePreference('notify_connections', value)}
                  label="Network updates"
                  description="Connection requests and accepted connections."
                  icon={<UserPlus className="w-4 h-4" />}
                />
                <ToggleRow
                  checked={preferences.notify_messages}
                  onChange={(value) => updatePreference('notify_messages', value)}
                  label="Messages"
                  description="New messages from your accepted network."
                  icon={<MessageCircle className="w-4 h-4" />}
                />
                <ToggleRow
                  checked={preferences.notify_application_updates}
                  onChange={(value) => updatePreference('notify_application_updates', value)}
                  label="Applications"
                  description="Application status updates from companies."
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <ToggleRow
                  checked={preferences.notify_job_alerts}
                  onChange={(value) => updatePreference('notify_job_alerts', value)}
                  label="Job alerts"
                  description="New jobs matching your saved alerts."
                  icon={<Bell className="w-4 h-4" />}
                />
                <ToggleRow
                  checked={preferences.notify_post_activity}
                  onChange={(value) => updatePreference('notify_post_activity', value)}
                  label="Post activity"
                  description="Likes and comments on your posts."
                  icon={<Heart className="w-4 h-4" />}
                />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={savingPreferences}
                  className="px-4 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {savingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {savingPreferences ? 'Saving...' : 'Save preferences'}
                </button>
              </div>
            </SectionCard>

            <SectionCard
              icon={<Trash2 className="w-5 h-5" />}
              title="Delete account"
              description="Permanently remove your account and all related RecruitSense data."
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  This will delete your profile, resume records, applications, posts, messages, and saved settings.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-4 py-2.5 rounded-full border border-red-200 text-red-600 bg-red-50 text-sm font-semibold hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete account
                </button>
              </div>
            </SectionCard>
          </>
        )}

        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
            <div className="w-full max-w-md rounded-xl bg-white border border-gray-100 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delete account?</h2>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deletingAccount}
                  aria-label="Close delete account dialog"
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600">
                  Enter your password to permanently delete this account.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="Password"
                  className="mt-4 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={deletingAccount}
                    className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={deleteAccount}
                    disabled={deletingAccount || !deletePassword}
                    className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deletingAccount ? 'Deleting...' : 'Delete account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
