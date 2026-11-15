import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ExternalLink,
  FilePlus,
  FileText,
  Layers,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import PageContentLoader from '../../components/common/PageContentLoader'
import api, { API_BASE_URL } from '../../services/api'
import toast from 'react-hot-toast'

const MAX_FILE_SIZE_MB = 10
const MAX_PAGES_COUNT = 10

const ResumeUpload = () => {
  const inputRef = useRef(null)
  const addMoreInputRef = useRef(null)

  const [resume, setResume] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [mergingStatus, setMergingStatus] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [dragging, setDragging] = useState(false)

  const currentFileName = useMemo(() => {
    if (!resume?.file_path) return 'No resume uploaded'
    return resume.file_path.split('/').pop()
  }, [resume])

  const totalSelectedSizeKB = useMemo(() => {
    const totalBytes = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0)
    return Math.round(totalBytes / 1024)
  }, [selectedFiles])

  useEffect(() => {
    api.get('/my-resume')
      .then((res) => setResume(res.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast.error('Failed to load resume profile')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const validatePdfFile = (file) => {
    if (!file) return false

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      toast.error(`"${file.name}" is not a PDF file. Only PDF files are supported.`)
      return false
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`)
      return false
    }

    return true
  }

  const addFilesToList = (fileList) => {
    const incoming = Array.from(fileList || [])
    if (!incoming.length) return

    const validFiles = incoming.filter(validatePdfFile)
    if (!validFiles.length) return

    setSelectedFiles((prev) => {
      const combined = [...prev, ...validFiles]
      if (combined.length > MAX_PAGES_COUNT) {
        toast.error(`You can select up to ${MAX_PAGES_COUNT} pages max.`)
        return combined.slice(0, MAX_PAGES_COUNT)
      }
      return combined
    })
  }

  const handleInitialFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const valid = files.filter(validatePdfFile)
    if (valid.length) {
      setSelectedFiles(valid.slice(0, MAX_PAGES_COUNT))
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleAddMoreFiles = (e) => {
    addFilesToList(e.target.files)
    if (addMoreInputRef.current) addMoreInputRef.current.value = ''
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    setSelectedFiles((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const handleMoveDown = (index) => {
    if (index === selectedFiles.length - 1) return
    setSelectedFiles((prev) => {
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files?.length) {
      addFilesToList(event.dataTransfer.files)
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please choose at least one PDF page')
      return
    }

    setUploading(true)
    setMergingStatus(selectedFiles.length > 1 ? 'Merging PDF pages into a single document...' : 'Preparing document...')

    try {
      let finalFileToUpload = selectedFiles[0]

      // If multiple pages / files were selected, merge them into a single unified PDF
      if (selectedFiles.length > 1) {
        const mergedPdf = await PDFDocument.create()

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const arrayBuffer = await file.arrayBuffer()
          const sourceDoc = await PDFDocument.load(arrayBuffer)
          const copiedPages = await mergedPdf.copyPages(sourceDoc, sourceDoc.getPageIndices())
          copiedPages.forEach((page) => mergedPdf.addPage(page))
        }

        const mergedPdfBytes = await mergedPdf.save()
        const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
        const baseTitle = selectedFiles[0].name.replace(/\.pdf$/i, '').replace(/[_\-\s]+(page|p)?\d+$/i, '')
        finalFileToUpload = new File([mergedBlob], `${baseTitle || 'my_resume'}_complete.pdf`, {
          type: 'application/pdf',
        })
      }

      setMergingStatus('Uploading verified resume to cloud...')

      const formData = new FormData()
      formData.append('resume', finalFileToUpload)

      // Also append each raw slice for backend multi-page verification if needed
      selectedFiles.forEach((file) => {
        formData.append('resumes[]', file)
      })

      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setResume(res.data.resume)
      setSelectedFiles([])

      toast.success(
        selectedFiles.length > 1
          ? `All ${selectedFiles.length} pages combined & uploaded successfully!`
          : 'Resume uploaded successfully!'
      )
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Upload failed. Please check the files and try again.')
    } finally {
      setUploading(false)
      setMergingStatus('')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      await api.delete('/resume')
      setResume(null)
      setSelectedFiles([])
      toast.success('Resume removed from profile')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const viewResumeUrl = useMemo(() => {
    if (!resume?.file_path) return null
    const base = API_BASE_URL.replace(/\/api\/?$/, '')
    return `${base}/storage/${resume.file_path}`
  }, [resume])

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-10">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">My Resume</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Multi-Page PDF Ready
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Upload your PDF resume used for AI job matching. If your CV has 2 or more pages, select all PDF pages and they will be automatically combined into one clean document.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Upload Box */}
          <div className="lg:col-span-2 space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`bg-white border-2 border-dashed rounded-2xl p-6 sm:p-8 transition-all ${
                dragging
                  ? 'border-indigo-500 bg-indigo-50/60 shadow-lg scale-[1.01]'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleInitialFileSelect}
              />
              <input
                ref={addMoreInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleAddMoreFiles}
              />

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
                  <Upload className="w-8 h-8" />
                </div>

                <h2 className="text-lg font-bold text-gray-900">Upload your CV / Resume</h2>

                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Select single or multiple PDF files (e.g. Page 1 & Page 2). RecruitSense automatically merges all pages into one continuous PDF for AI evaluation.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    {selectedFiles.length > 0 ? 'Replace Selection' : 'Choose PDF File(s)'}
                  </button>

                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => addMoreInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl border border-dashed border-indigo-300 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                      <FilePlus className="w-4 h-4" />
                      Add Another Page
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || uploading}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading
                      ? mergingStatus || 'Processing...'
                      : selectedFiles.length > 1
                      ? `Merge & Upload (${selectedFiles.length} Pages)`
                      : resume
                      ? 'Replace Resume'
                      : 'Upload Resume'}
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Files / Pages Reordering Section */}
            {selectedFiles.length > 0 && (
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-900 text-sm">
                      Selected Document Pages ({selectedFiles.length})
                    </h3>
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    Total: {totalSelectedSizeKB} KB • Will be combined in sequence
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Arrange pages in your preferred reading order using the up/down arrows before submitting:
                </p>

                <div className="space-y-2.5">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/70 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Page {idx + 1} of {selectedFiles.length} • {Math.round(file.size / 1024)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          title="Move Up"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === selectedFiles.length - 1}
                          title="Move Down"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          title="Remove Page"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 hover:underline"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    Add more pages to this document
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Current Active Resume */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Active Profile Resume</span>
                {resume && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Live
                  </span>
                )}
              </h3>

              {loading ? (
                <div className="py-2">
                  <PageContentLoader
                    compact
                    count={1}
                    type="list"
                    title="Loading resume..."
                    subtitle="Fetching uploaded resume..."
                  />
                </div>
              ) : resume ? (
                <>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-emerald-900 truncate">
                          {currentFileName}
                        </p>
                        <p className="text-xs text-emerald-700">Verified for AI ATS Screening</p>
                      </div>
                    </div>

                    {viewResumeUrl && (
                      <div className="pt-1">
                        <a
                          href={viewResumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Document Preview
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 font-semibold text-xs hover:bg-indigo-50 transition-all text-center"
                    >
                      Replace With New PDF
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      title="Delete Resume"
                      className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      {deleting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        No resume uploaded
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Upload your PDF resume to start receiving tailored job recommendations and AI match scores.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Multi-Page Guide Card */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50/50 border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-indigo-900 text-sm">2-Page or Multi-Page CVs?</h3>
              <p className="text-xs text-indigo-700 leading-relaxed">
                If your resume was scanned or saved across multiple PDF files (e.g. Page 1 and Page 2), simply select all of them or click <strong>"Add Another Page"</strong>.
              </p>
              <p className="text-xs text-indigo-600/90 leading-relaxed">
                RecruitSense will stitch them into a seamless, high-resolution multi-page PDF so employers can review your complete qualifications without missing pages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ResumeUpload
