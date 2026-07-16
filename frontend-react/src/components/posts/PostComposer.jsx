import { useRef, useState } from 'react'
import { Globe2, ImagePlus, Send, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const PostComposer = ({ onPostCreated }) => {
  const fileInput = useRef(null)
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [posting, setPosting] = useState(false)

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || [])
    const nextFiles = [...files, ...selected].slice(0, 4)

    setFiles(nextFiles)
    setPreviews(nextFiles.map((file) => ({
      name: file.name,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
    })))
    event.target.value = ''
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

  const submitPost = async () => {
    if (!body.trim() && files.length === 0) {
      toast.error('Write something or attach media before posting')
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

      setBody('')
      setFiles([])
      setPreviews([])
      onPostCreated?.(res.data.post)
      toast.success('Post shared')
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors ? Object.values(errors)[0][0] : err.response?.data?.message || 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        placeholder="Share an update, project, achievement, or career thought..."
        className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {previews.map((preview, index) => (
            <div key={`${preview.name}-${index}`} className="relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
              {preview.type === 'video' ? (
                <video src={preview.url} className="w-full h-40 object-cover" controls />
              ) : (
                <img src={preview.url} alt={preview.name} className="w-full h-40 object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-2 top-2 w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:bg-white flex items-center justify-center shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="px-3 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            Media
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={handleFiles}
          />

          <div className="flex items-center rounded-full border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${
                visibility === 'public' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              Public
            </button>
            <button
              type="button"
              onClick={() => setVisibility('connections')}
              className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${
                visibility === 'connections' ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Connections
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={submitPost}
          disabled={posting}
          className="px-5 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}

export default PostComposer
