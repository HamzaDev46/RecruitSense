import { useState } from 'react'
import { Flag, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const reportReasons = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'other', label: 'Other' },
]

const ReportContentModal = ({ open, type, reportableId, title = 'Report content', onClose }) => {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const closeModal = () => {
    setReason('spam')
    setDetails('')
    setSubmitting(false)
    onClose?.()
  }

  if (!open) return null

  const submitReport = async () => {
    if (!type || !reportableId) return

    setSubmitting(true)
    try {
      const res = await api.post('/reports', {
        type,
        reportable_id: reportableId,
        reason,
        details: details.trim(),
      })

      toast.success(res.data.message || 'Report submitted')
      closeModal()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white border border-gray-100 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Your report will be reviewed by RecruitSense.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            aria-label="Close report dialog"
            className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm font-bold text-gray-900">Reason</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {reportReasons.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setReason(item.value)}
                disabled={submitting}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  reason === item.value
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="block mt-5">
            <span className="text-sm font-bold text-gray-900">Details</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Add helpful context for review..."
              disabled={submitting}
              className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
            />
          </label>

          <div className="mt-6 flex justify-end gap-2">
            <button
            type="button"
            onClick={closeModal}
              disabled={submitting}
              className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={submitting}
              className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportContentModal
