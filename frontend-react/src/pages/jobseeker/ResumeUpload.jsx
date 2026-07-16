import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, FileText, RefreshCw, Sparkles, Trash2, Upload } from 'lucide-react'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const MAX_SIZE_MB = 5

const ResumeUpload = () => {
  const inputRef = useRef(null)
  const [resume, setResume] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dragging, setDragging] = useState(false)

  const fileName = useMemo(() => {
    if (selectedFile) return selectedFile.name
    if (!resume?.file_path) return 'No resume selected'
    return resume.file_path.split('/').pop()
  }, [resume, selectedFile])

  useEffect(() => {
    api.get('/my-resume')
      .then((res) => setResume(res.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast.error('Failed to load resume')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const validateFile = (file) => {
    if (!file) return false

    if (file.type !== 'application/pdf') {
      toast.error('Please choose a PDF file')
      return false
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Resume must be under ${MAX_SIZE_MB}MB`)
      return false
    }

    return true
  }

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Choose a resume first')
      return
    }

    const formData = new FormData()
    formData.append('resume', selectedFile)

    setUploading(true)

    try {
      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setResume(res.data.resume)
      setSelectedFile(null)

      if (inputRef.current) inputRef.current.value = ''

      toast.success('Resume uploaded successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      await api.delete('/resume')
      setResume(null)
      setSelectedFile(null)
      toast.success('Resume removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    handleFileSelect(event.dataTransfer.files?.[0])
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Resume</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload the PDF resume used for AI job matching.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`bg-white border-2 border-dashed rounded-2xl p-8 transition-all ${
                dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>

                <h2 className="text-lg font-bold text-gray-900">Upload your resume</h2>

                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Drop your PDF here or choose it from your computer. RecruitSense will use it
                  when calculating job match scores.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Choose PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {resume ? 'Replace Resume' : 'Upload Resume'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 font-medium">Selected file</p>
                  <p className="font-bold text-gray-900 truncate mt-0.5">{fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF only, up to {MAX_SIZE_MB}MB</p>
                </div>

                {selectedFile && (
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Ready
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Current Resume</h3>

              {loading ? (
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ) : resume ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-800 truncate">
                        {fileName}
                      </p>
                      <p className="text-xs text-emerald-600">Ready for matching</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full mt-4 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete Resume
                  </button>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        No resume uploaded
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Upload a PDF before applying for jobs.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-indigo-800">AI Matching Tip</h3>
              <p className="text-sm text-indigo-600 mt-1">
                A clear PDF with skills, projects, and experience helps the AI score your
                applications more accurately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ResumeUpload