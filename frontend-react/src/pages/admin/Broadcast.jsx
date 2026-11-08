import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, Send, Users, Building2, UserCheck, Sparkles,
  CheckCircle2, AlertTriangle, ShieldAlert, Info, Flame,
  Eye, RefreshCw, MessageSquare, Mail
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const templates = [
  {
    label: 'Platform Maintenance',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    title: 'Scheduled Platform Maintenance Notice',
    message: 'We will be conducting routine infrastructure upgrades this Sunday between 2:00 AM – 4:00 AM UTC. Services may experience brief intermittent pauses.',
  },
  {
    label: 'New Feature Release',
    icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
    title: 'Exciting Update: AI Smart Matching & Candidate Discovery Live',
    message: 'We have just deployed our next-gen Candidate Discovery engine! Employers can now find top talent with precision filters and direct messaging.',
  },
  {
    label: 'Security & Verification Alert',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />,
    title: 'Security Notice: Mandatory Email Verification',
    message: 'To protect our community, all accounts must maintain verified email addresses. Please review your account settings if prompted.',
  },
]

const Broadcast = () => {
  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'all',
    send_email: false,
    test_email: '',
  })
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(null)
  const [emailCount, setEmailCount] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Please enter both announcement title and message')
      return
    }

    setSending(true)
    try {
      const res = await api.post('/admin/broadcast', form)
      const count = res.data.sent_count || 0
      const emails = res.data.emails_sent || 0
      setSentCount(count)
      setEmailCount(emails)
      
      if (form.send_email && form.test_email) {
        toast.success(`Broadcast posted & test email delivered to ${form.test_email}!`)
      } else if (form.send_email && emails > 0) {
        toast.success(`Broadcast posted to ${count} users & batched to ${emails} inboxes!`)
      } else {
        toast.success(`Broadcast announcement sent to ${count} active users!`)
      }
      setForm({ title: '', message: '', target: 'all', send_email: false, test_email: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast announcement')
    } finally {
      setSending(false)
    }
  }

  const applyTemplate = (tpl) => {
    const isMaintenance = tpl.label === 'Platform Maintenance'
    setForm(prev => ({
      ...prev,
      title: tpl.title,
      message: tpl.message,
      send_email: isMaintenance ? true : prev.send_email,
    }))
    toast.success(`Applied template: "${tpl.label}"${isMaintenance ? ' (Email notice enabled)' : ''}`)
  }

  const targets = [
    { value: 'all', label: 'All Platform Users', desc: 'Candidates & Employers', icon: <Users className="w-4 h-4" /> },
    { value: 'jobseeker', label: 'Job Seekers Only', desc: 'Registered Candidates', icon: <UserCheck className="w-4 h-4" /> },
    { value: 'company', label: 'Companies Only', desc: 'Verified Employers', icon: <Building2 className="w-4 h-4" /> },
  ]

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Broadcast Notification Studio</h1>
          <p className="text-gray-500 text-sm mt-0.5">Send real-time system alerts and platform-wide notifications to users' notification feeds</p>
        </motion.div>

        {/* Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Form Composer (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5"
          >
            {/* Quick Templates */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Quick Announcement Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {tpl.icon}
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* Target Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {targets.map((t) => {
                    const active = form.target === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, target: t.value })}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          active
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-sm shadow-indigo-100'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${active ? 'text-indigo-600' : 'text-gray-400'}`}>{t.icon}</span>
                          <p className="text-xs font-bold">{t.label}</p>
                        </div>
                        <p className="text-[10px] text-gray-400">{t.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Scheduled Platform Maintenance Notice"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                  Announcement Message Content
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Compose your broadcast message details here..."
                  rows={5}
                  required
                  className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />
              </div>

              {/* Email Announcement Option */}
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.send_email}
                    onChange={(e) => setForm({ ...form, send_email: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      Also Send as Official Email Announcement (e.g. Maintenance Notice)
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Batched via ultra-fast BCC delivery so all recipients receive their notice in seconds without lag.
                    </p>
                  </div>
                </label>

                {form.send_email && (
                  <div className="pt-2 border-t border-indigo-100">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                      Send Test Email Only (Optional)
                    </label>
                    <input
                      type="email"
                      value={form.test_email}
                      onChange={(e) => setForm({ ...form, test_email: e.target.value })}
                      placeholder="e.g. your_email@gmail.com (Leave empty to email all users)"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Tip: Enter your own email to test the layout immediately before broadcasting to all platform members.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending || !form.title.trim() || !form.message.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Dispatch Broadcast to Users
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Live Simulation Preview (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 space-y-4"
          >
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Live Notification Preview
                </span>
                <div className="flex items-center gap-1.5">
                  {form.send_email && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5" /> Email Enabled
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                    Target: {form.target}
                  </span>
                </div>
              </div>

              {/* Simulated Notification Card */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100/80 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/20">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-gray-900 truncate">
                        {form.title || 'Platform Announcement Title'}
                      </p>
                      <span className="text-[10px] text-indigo-600 font-semibold shrink-0 ml-1">Just now</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {form.message || 'The broadcast announcement text will appear here in the user notification inbox.'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-indigo-100/40 text-[10px] text-gray-400 font-medium">
                      <span>From: RecruitSense System</span>
                      <span>•</span>
                      <span>Priority: High</span>
                    </div>
                  </div>
                </div>
              </div>

              {sentCount !== null && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Broadcast Dispatched Successfully</p>
                    <p className="text-[11px] text-emerald-700">Delivered to {sentCount} active users.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>

      </div>
    </AdminLayout>
  )
}

export default Broadcast
