import { useRef, useState, useEffect } from 'react'
import { Globe2, ImagePlus, Loader2, Send, Sparkles, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/useAuth'

const initials = (name = 'User') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const SUGGESTED_TAGS = ['#Hiring', '#OpenToWork', '#TechCareer', '#WebDevelopment', '#Achievement', '#InterviewTips']

// Client-side auto compression to ensure fast uploads
const compressImage = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1920
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width))
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height))
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
              lastModified: Date.now(),
            })
            resolve(compressed)
          },
          'image/webp',
          0.85
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth()
  const fileInput = useRef(null)
  const textareaRef = useRef(null)
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [posting, setPosting] = useState(false)
  const [processingMedia, setProcessingMedia] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFiles = async (event) => {
    const rawSelected = Array.from(event.target.files || [])
    if (rawSelected.length === 0) return

    setProcessingMedia(true)
    try {
      const processedFiles = await Promise.all(
        rawSelected.map((file) => compressImage(file))
      )

      const nextFiles = [...files, ...processedFiles].slice(0, 4)

      setFiles(nextFiles)
      setPreviews(nextFiles.map((file) => ({
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: URL.createObjectURL(file),
      })))
    } catch (err) {
      console.error('Failed to process image:', err)
      toast.error('Failed to process image attachment')
    } finally {
      setProcessingMedia(false)
      event.target.value = ''
    }
  }

  const removeFile = (index) => {
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index)
    setFiles(nextFiles)
    setPreviews(nextFiles.map((file) => ({
      name: file.name,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
    })))
  }

  const addTag = (tag) => {
    if (!body.includes(tag)) {
      setBody((prev) => (prev ? `${prev} ${tag} ` : `${tag} `))
    }
  }

  const resetForm = () => {
    setBody('')
    setFiles([])
    setPreviews([])
    setVisibility('public')
  }

  const handleClose = () => {
    if (posting) return
    resetForm()
    onClose()
  }

  const submitPost = async () => {
    if (!body.trim() && files.length === 0) {
      toast.error('Write something or attach an image before posting')
      return
    }

    const formData = new FormData()
    formData.append('body', body.trim())
    formData.append('visibility', visibility)
    files.forEach((file) => formData.append('media[]', file))

    setPosting(true)
    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      resetForm()
      onPostCreated?.(res.data.post)
      toast.success('Post published to RecruitSense network!')
      onClose()
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors)[0][0] : err.response?.data?.message || 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover object-top border border-gray-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {initials(user?.name)}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-sm">{user?.name || 'Create a Post'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => setVisibility(visibility === 'public' ? 'connections' : 'public')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-semibold transition"
                >
                  {visibility === 'public' ? <Globe2 className="w-3 h-3 text-sky-600" /> : <Users className="w-3 h-3 text-indigo-600" />}
                  <span>{visibility === 'public' ? 'Public' : 'Connections only'}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={posting}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="What do you want to share? Career achievements, project updates, hiring announcements..."
            className="w-full resize-none border-none outline-none text-base text-gray-900 placeholder:text-gray-400 focus:ring-0 p-0"
          />

          {/* Quick Hashtags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-sky-500" /> Tags:
            </span>
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Media Previews Grid */}
          {processingMedia && (
            <div className="p-4 rounded-xl bg-sky-50 text-sky-700 flex items-center gap-2 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Optimizing image for fast upload...</span>
            </div>
          )}

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {previews.map((preview, index) => (
                <div
                  key={`${preview.name}-${index}`}
                  className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video"
                >
                  {preview.type === 'video' ? (
                    <video src={preview.url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-2 top-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={posting || processingMedia || files.length >= 4}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition disabled:opacity-50 shadow-xs"
            >
              <ImagePlus className="w-4 h-4 text-sky-600" />
              <span>{files.length === 0 ? 'Add Photo / Media' : `${files.length}/4 Selected`}</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={posting}
              className="px-4 py-2 rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitPost}
              disabled={posting || processingMedia || (!body.trim() && files.length === 0)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
