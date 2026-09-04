import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Bell, Globe, Save, AlertTriangle,
  Lock, CheckCircle2, RefreshCw, Cpu, Database
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    site_name: 'RecruitSense',
    site_email: 'admin@recruitsense.com',
    allow_registrations: true,
    email_notifications: true,
    maintenance_mode: false,
    auto_verify_companies: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const res = await api.get('/admin/settings')
        if (mounted && res.data?.settings) {
          setSettings(prev => ({ ...prev, ...res.data.settings }))
        }
      } catch (err) {
        if (mounted) {
          const msg = err.response?.data?.message || 'Failed to load admin settings'
          toast.error(msg === 'Unauthorized' ? 'Admin access required. Please sign in as admin.' : msg)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchSettings()
    return () => { mounted = false }
  }, [])

  const handleSave = async (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const res = await api.put('/admin/settings', settings)
      setSettings(res.data.settings || settings)
      toast.success('Platform settings saved and applied successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        value ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Configuration & Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Control global platform policies, employer auto-verifications, and maintenance statuses</p>
        </motion.div>

        {settings.maintenance_mode && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Maintenance Mode is currently ACTIVE</p>
              <p className="text-amber-700 mt-0.5">Only administrative users can perform platform actions.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* Section 1: General Platform Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">General Identity</h2>
                <p className="text-xs text-gray-400">Public platform naming and support email contact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                  Platform Admin Email
                </label>
                <input
                  type="email"
                  value={settings.site_email}
                  onChange={(e) => setSettings({ ...settings, site_email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>
          </motion.div>

          {/* Section 2: Security & Platform Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Security & Access Controls</h2>
                <p className="text-xs text-gray-400">Toggle public signup availability and employer verification defaults</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-xs font-bold text-gray-900">Allow New User Registrations</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Enable or pause candidate and employer account creation</p>
                </div>
                <Toggle
                  value={settings.allow_registrations}
                  onChange={(val) => setSettings({ ...settings, allow_registrations: val })}
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-xs font-bold text-gray-900">Auto-Verify New Employers</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Automatically mark newly registered companies as verified</p>
                </div>
                <Toggle
                  value={settings.auto_verify_companies}
                  onChange={(val) => setSettings({ ...settings, auto_verify_companies: val })}
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-xs font-bold text-gray-900">Automated System Email Alerts</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Dispatch automated transactional emails for verification and interviews</p>
                </div>
                <Toggle
                  value={settings.email_notifications}
                  onChange={(val) => setSettings({ ...settings, email_notifications: val })}
                />
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-xs font-bold text-amber-900">System Maintenance Mode</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Restrict non-admin access while performing database maintenance</p>
                </div>
                <Toggle
                  value={settings.maintenance_mode}
                  onChange={(val) => setSettings({ ...settings, maintenance_mode: val })}
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end"
          >
            <button
              type="submit"
              disabled={saving || loading}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Platform Configuration
                </>
              )}
            </button>
          </motion.div>

        </form>

      </div>
    </AdminLayout>
  )
}

export default AdminSettings
