import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  Building2,
  Camera,
  Check,
  Clock,
  Eye,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import PostCard from '../../components/posts/PostCard'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const emptyProfile = {
  name: '',
  email: '',
  headline: '',
  location: '',
  phone: '',
  website: '',
  company: '',
  education: '',
  about: '',
  skills: '',
  cover_position: 'center center',
}

const emptyExperience = {
  title: '',
  company: '',
  employment_type: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
}

const coverStyle = {
  background: 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 42%, #e0f2fe 70%, #cbd5e1 100%)',
}

const coverBackground = (imageUrl, position = 'center center') => ({
  ...(imageUrl ? { backgroundImage: `url(${imageUrl})` } : coverStyle),
  backgroundPosition: position || 'center center',
})

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const parsePositionToken = (token, axis) => {
  if (!token) return 50
  if (token.endsWith('%')) return Number.parseFloat(token)
  if (token === 'left' || token === 'top') return 0
  if (token === 'right' || token === 'bottom') return 100
  if (token === 'center') return 50

  return axis === 'x' ? 50 : 50
}

const coverPositionToPoint = (position = 'center center') => {
  const [xToken, yToken] = position.split(' ')

  return {
    x: clamp(parsePositionToken(xToken, 'x')),
    y: clamp(parsePositionToken(yToken, 'y')),
  }
}

const pointToCoverPosition = ({ x, y }) => `${Math.round(clamp(x))}% ${Math.round(clamp(y))}%`

const loadImage = (file) => new Promise((resolve, reject) => {
  const image = new Image()
  const url = URL.createObjectURL(file)

  image.onload = () => {
    URL.revokeObjectURL(url)
    resolve(image)
  }

  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('Image could not be loaded'))
  }

  image.src = url
})

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => {
  canvas.toBlob(resolve, type, quality)
})

const resizeImageFile = async (file, { maxWidth, maxHeight, quality, namePrefix }) => {
  const image = await loadImage(file)
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  const filename = `${namePrefix}-${Date.now()}.jpg`

  if (!blob) {
    throw new Error('Image compression failed')
  }

  return new File([blob], filename, { type: 'image/jpeg' })
}

const monthYear = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const personInitials = (name = 'User') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const viewedDate = (value) => {
  if (!value) return 'Recently'

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const normalizeProfilePayload = (data) => ({
  profile: {
    name: data.user?.name || '',
    email: data.user?.email || '',
    headline: data.profile?.headline || '',
    location: data.profile?.location || '',
    phone: data.profile?.phone || '',
    website: data.profile?.website || '',
    company: data.profile?.company || '',
    education: data.profile?.education || '',
    about: data.profile?.about || '',
    skills: data.profile?.skills || '',
    cover_position: data.profile?.cover_position || 'center center',
  },
  images: {
    profile: data.profile?.profile_image_url || '',
    cover: data.profile?.cover_image_url || '',
  },
  experiences: data.experiences || [],
  analytics: data.analytics || {
    views_count: 0,
    post_impressions_count: 0,
    applications_count: 0,
    search_appearances_count: 0,
  },
})

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const profileImageInput = useRef(null)
  const coverImageInput = useRef(null)
  const canEdit = !userId || String(userId) === String(user?.id)
  const profileEndpoint = canEdit ? '/profile' : `/profiles/${userId}`
  const viewedUserId = userId || user?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(emptyProfile)
  const [profileImages, setProfileImages] = useState({ profile: '', cover: '' })
  const [experiences, setExperiences] = useState([])
  const [profilePosts, setProfilePosts] = useState([])
  const [profilePostsLoading, setProfilePostsLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    views_count: 0,
    post_impressions_count: 0,
    applications_count: 0,
    search_appearances_count: 0,
  })
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [profileViewers, setProfileViewers] = useState([])
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [experienceModalOpen, setExperienceModalOpen] = useState(false)
  const [editingExperienceId, setEditingExperienceId] = useState(null)
  const [form, setForm] = useState(emptyProfile)
  const [files, setFiles] = useState({ profile_image: null, cover_image: null })
  const [previews, setPreviews] = useState({ profile: '', cover: '' })
  const [experienceForm, setExperienceForm] = useState(emptyExperience)
  const [coverDrag, setCoverDrag] = useState(null)
  const [connection, setConnection] = useState(null)
  const [networkActionLoading, setNetworkActionLoading] = useState(false)

  const initials = useMemo(() => {
    return (profile.name || user?.name || 'User')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [profile.name, user?.name])

  const skills = useMemo(
    () => (profile.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean),
    [profile.skills]
  )

  const loadProfile = async () => {
    try {
      const res = await api.get(profileEndpoint)
      const normalized = normalizeProfilePayload(res.data)

      setProfile(normalized.profile)
      setForm(normalized.profile)
      setProfileImages(normalized.images)
      setExperiences(normalized.experiences)
      setAnalytics(normalized.analytics)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    api.get(profileEndpoint)
      .then((res) => {
        if (!active) return

        const normalized = normalizeProfilePayload(res.data)
        setProfile(normalized.profile)
        setForm(normalized.profile)
        setProfileImages(normalized.images)
        setExperiences(normalized.experiences)
        setAnalytics(normalized.analytics)
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load profile')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [profileEndpoint])

  useEffect(() => {
    if (!viewedUserId) return

    let active = true

    api.get(`/profiles/${viewedUserId}/posts`)
      .then((res) => {
        if (active) setProfilePosts(res.data)
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load posts')
      })
      .finally(() => {
        if (active) setProfilePostsLoading(false)
      })

    return () => {
      active = false
    }
  }, [viewedUserId])

  useEffect(() => {
    if (canEdit || !userId) return

    let active = true

    api.get(`/network/status/${userId}`)
      .then((res) => {
        if (active) setConnection(res.data.connection)
      })
      .catch(() => {
        if (active) setConnection(null)
      })

    return () => {
      active = false
    }
  }, [canEdit, userId])

  const openProfileModal = () => {
    if (!canEdit) return

    setForm(profile)
    setFiles({ profile_image: null, cover_image: null })
    setPreviews({ profile: '', cover: '' })
    setProfileModalOpen(true)
  }

  const handleProfileChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleImageChange = async (event, field) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }

    try {
      const resizedFile = await resizeImageFile(file, field === 'cover_image'
        ? { maxWidth: 1800, maxHeight: 900, quality: 0.82, namePrefix: 'cover' }
        : { maxWidth: 900, maxHeight: 900, quality: 0.86, namePrefix: 'profile' })

      setFiles({ ...files, [field]: resizedFile })
      setPreviews({
        ...previews,
        [field === 'profile_image' ? 'profile' : 'cover']: URL.createObjectURL(resizedFile),
      })
    } catch {
      toast.error('Image could not be prepared for upload')
    }
  }

  const startCoverDrag = (event) => {
    const currentPoint = coverPositionToPoint(form.cover_position)

    event.currentTarget.setPointerCapture(event.pointerId)
    setCoverDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: currentPoint,
    })
  }

  const moveCoverDrag = (event) => {
    if (!coverDrag) return

    const nextPoint = {
      x: coverDrag.origin.x - ((event.clientX - coverDrag.startX) / 4),
      y: coverDrag.origin.y - ((event.clientY - coverDrag.startY) / 2),
    }

    setForm((current) => ({
      ...current,
      cover_position: pointToCoverPosition(nextPoint),
    }))
  }

  const stopCoverDrag = (event) => {
    if (coverDrag?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setCoverDrag(null)
  }

  const saveProfile = async () => {
    const formData = new FormData()

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value || '')
    })

    if (files.profile_image) formData.append('profile_image', files.profile_image)
    if (files.cover_image) formData.append('cover_image', files.cover_image)

    setSaving(true)
    try {
      const res = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const normalized = normalizeProfilePayload(res.data)

      setProfile(normalized.profile)
      setForm(normalized.profile)
      setProfileImages(normalized.images)
      setExperiences(normalized.experiences)
      setAnalytics(normalized.analytics)
      updateUser?.(res.data.user)
      window.dispatchEvent(new CustomEvent('recruitsense-profile-updated'))
      setProfileModalOpen(false)
      toast.success('Profile updated')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        toast.error(Object.values(errors)[0][0])
      } else {
        toast.error(err.response?.data?.message || 'Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  const openExperienceModal = (experience = null) => {
    setEditingExperienceId(experience?.id || null)
    setExperienceForm(experience ? {
      title: experience.title || '',
      company: experience.company || '',
      employment_type: experience.employment_type || '',
      location: experience.location || '',
      start_date: experience.start_date || '',
      end_date: experience.end_date || '',
      is_current: Boolean(experience.is_current),
      description: experience.description || '',
    } : emptyExperience)
    setExperienceModalOpen(true)
  }

  const saveExperience = async () => {
    try {
      if (editingExperienceId) {
        await api.put(`/profile/experiences/${editingExperienceId}`, experienceForm)
        toast.success('Experience updated')
      } else {
        await api.post('/profile/experiences', experienceForm)
        toast.success('Experience added')
      }

      setExperienceModalOpen(false)
      await loadProfile()
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        toast.error(Object.values(errors)[0][0])
      } else {
        toast.error(err.response?.data?.message || 'Failed to save experience')
      }
    }
  }

  const openAnalyticsModal = async () => {
    if (!canEdit) return

    setAnalyticsModalOpen(true)
    setAnalyticsLoading(true)

    try {
      const res = await api.get('/profile/viewers')

      setProfileViewers(res.data.viewers || [])
      setAnalytics((current) => ({
        ...current,
        views_count: res.data.total ?? current.views_count,
      }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const updateProfilePost = (nextPost) => {
    setProfilePosts((current) => current.map((post) => post.id === nextPost.id ? nextPost : post))
  }

  const removeProfilePost = (postId) => {
    setProfilePosts((current) => current.filter((post) => post.id !== postId))
  }

  const deleteExperience = async (experienceId) => {
    if (!window.confirm('Delete this experience?')) return

    try {
      await api.delete(`/profile/experiences/${experienceId}`)
      setExperiences(experiences.filter((item) => item.id !== experienceId))
      toast.success('Experience deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete experience')
    }
  }

  const sendConnectionRequest = async () => {
    setNetworkActionLoading(true)
    try {
      const res = await api.post(`/network/connect/${userId}`)
      setConnection(res.data.connection)
      window.dispatchEvent(new CustomEvent('recruitsense-network-updated'))
      toast.success(res.data.message || 'Connection request sent')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request')
    } finally {
      setNetworkActionLoading(false)
    }
  }

  const acceptConnectionRequest = async () => {
    if (!connection?.id) return

    setNetworkActionLoading(true)
    try {
      const res = await api.post(`/network/accept/${connection.id}`)
      setConnection(res.data.connection)
      window.dispatchEvent(new CustomEvent('recruitsense-network-updated'))
      toast.success('Connection accepted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request')
    } finally {
      setNetworkActionLoading(false)
    }
  }

  const rejectConnectionRequest = async () => {
    if (!connection?.id) return

    setNetworkActionLoading(true)
    try {
      await api.post(`/network/reject/${connection.id}`)
      setConnection(null)
      window.dispatchEvent(new CustomEvent('recruitsense-network-updated'))
      toast.success('Request ignored')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to ignore request')
    } finally {
      setNetworkActionLoading(false)
    }
  }

  const networkAction = () => {
    if (canEdit) return null

    if (!connection) {
      return (
        <button
          onClick={sendConnectionRequest}
          disabled={networkActionLoading}
          className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Connect
        </button>
      )
    }

    if (connection.status === 'accepted') {
      return (
        <button className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          Connected
        </button>
      )
    }

    if (connection.status === 'pending' && connection.direction === 'sent') {
      return (
        <button className="px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending
        </button>
      )
    }

    if (connection.status === 'pending' && connection.direction === 'received') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={rejectConnectionRequest}
            disabled={networkActionLoading}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Ignore
          </button>
          <button
            onClick={acceptConnectionRequest}
            disabled={networkActionLoading}
            className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-64 bg-white rounded-lg border border-gray-100 animate-pulse" />
          <div className="h-32 bg-white rounded-lg border border-gray-100 animate-pulse" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        <aside className="col-span-4 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
            <div
              className="h-24 bg-cover bg-center"
              style={coverBackground(profileImages.cover, profile.cover_position)}
            />
            <div className="px-5 pb-5">
              <button onClick={openProfileModal} className="-mt-10 mb-3 block relative z-10">
                {profileImages.profile ? (
                  <img src={profileImages.profile} alt={profile.name} className="w-24 h-24 rounded-full object-cover object-top border-4 border-white shadow-sm" />
                ) : (
                  <span className="w-24 h-24 rounded-full bg-sky-600 text-white border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold">
                    {initials}
                  </span>
                )}
              </button>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{profile.name}</h1>
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">{profile.headline || 'Add your headline'}</p>
              <p className="text-sm text-gray-500 mt-2">{profile.location || 'Add location'}</p>
              <div className="flex items-center gap-3 mt-4 text-sm font-semibold text-gray-800">
                <Building2 className="w-5 h-5 text-gray-400" />
                {profile.company || 'Add company'}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Profile viewers</span>
              <span className="text-sky-600 font-bold">{analytics.views_count}</span>
            </div>
            {canEdit ? (
              <button onClick={openAnalyticsModal} className="font-semibold text-gray-800 hover:text-sky-700 transition-colors">
                View all analytics
              </button>
            ) : (
              <p className="text-sm text-gray-500">Analytics are private to the profile owner.</p>
            )}
          </div>
        </aside>

        <section className="col-span-8 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
            <div
              className="h-48 bg-cover bg-center relative"
              style={coverBackground(profileImages.cover, profile.cover_position)}
            >
              {canEdit && (
                <button
                  onClick={openProfileModal}
                  className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow-sm flex items-center justify-center transition-all"
                  title="Edit profile"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-16">
                <button onClick={openProfileModal} className="relative z-10">
                  {profileImages.profile ? (
                    <img src={profileImages.profile} alt={profile.name} className="w-32 h-32 rounded-full object-cover object-top border-4 border-white shadow-sm" />
                  ) : (
                    <span className="w-32 h-32 rounded-full bg-sky-600 text-white border-4 border-white shadow-sm flex items-center justify-center text-4xl font-bold">
                      {initials}
                    </span>
                  )}
                </button>

                {canEdit && (
                  <button
                    onClick={openProfileModal}
                    className="mb-3 px-4 py-2 rounded-full border border-sky-600 text-sky-700 font-semibold text-sm hover:bg-sky-50 transition-all flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit profile
                  </button>
                )}
              </div>

              <div className="mt-4 flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-gray-800 mt-1">{profile.headline || 'Add your professional headline'}</p>
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {profile.location || 'Add location'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {canEdit ? (
                      <button className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-all">
                        Open to
                      </button>
                    ) : networkAction()}
                    {canEdit && (
                      <button onClick={() => openExperienceModal()} className="px-4 py-2 rounded-full border border-sky-600 text-sky-700 text-sm font-semibold hover:bg-sky-50 transition-all">
                        Add experience
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-56 space-y-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    {profile.company || 'Add company'}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    {profile.education || 'Add education'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 truncate">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    {profile.email || user?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-bold text-gray-900">Analytics</h3>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { icon: <Eye className="w-5 h-5" />, title: `${analytics.views_count} profile views`, desc: 'Discover who viewed your profile.' },
                { icon: <BarChart3 className="w-5 h-5" />, title: `${analytics.post_impressions_count || 0} post impressions`, desc: 'See how many people viewed your posts.' },
                { icon: <Search className="w-5 h-5" />, title: `${analytics.search_appearances_count || 0} search appearances`, desc: 'See how recruiters find you.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="text-gray-700">{item.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">About</h3>
              {canEdit && (
                <button onClick={openProfileModal} className="text-gray-400 hover:text-sky-700">
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.about || 'Add a short professional summary.'}</p>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Posts</h3>
                <p className="text-sm text-gray-500 mt-1">{profilePosts.length} posts shared</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => navigate('/feed')}
                  className="px-4 py-2 rounded-full border border-sky-600 text-sky-700 text-sm font-semibold hover:bg-sky-50"
                >
                  Share a post
                </button>
              )}
            </div>

            {profilePostsLoading ? (
              <div className="h-44 bg-white border border-gray-100 rounded-lg animate-pulse" />
            ) : profilePosts.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-lg p-8 text-center">
                <BarChart3 className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">No posts yet</p>
                <p className="text-sm text-gray-500 mt-1">{canEdit ? 'Share updates from the feed page.' : 'This member has not shared any posts yet.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profilePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPostUpdated={updateProfilePost}
                    onPostDeleted={removeProfilePost}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Experience</h3>
              {canEdit && (
                <button onClick={() => openExperienceModal()} className="text-sky-700 hover:text-sky-800 flex items-center gap-1 text-sm font-semibold">
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>

            {experiences.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-lg p-5 text-center text-gray-500">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No experience added yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {experiences.map((experience) => (
                  <div key={experience.id} className="py-4 flex gap-4">
                    <div className="w-11 h-11 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-gray-900">{experience.title}</p>
                          <p className="text-sm text-gray-700">{experience.company}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {monthYear(experience.start_date)} - {experience.is_current ? 'Present' : monthYear(experience.end_date)}
                          </p>
                          {experience.location && <p className="text-xs text-gray-500 mt-1">{experience.location}</p>}
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openExperienceModal(experience)} className="text-gray-400 hover:text-sky-700">
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteExperience(experience.id)} className="text-gray-400 hover:text-red-600">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {experience.description && <p className="text-sm text-gray-600 mt-3">{experience.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Skills</h3>
              {canEdit && (
                <button onClick={openProfileModal} className="text-gray-400 hover:text-sky-700">
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 ? (
                <p className="text-sm text-gray-500">Add skills to improve your match quality.</p>
              ) : (
                skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-sm font-semibold">
                    {skill}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {canEdit && analyticsModalOpen && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Profile viewers</h3>
                  <p className="text-sm text-gray-500 mt-1">{analytics.views_count} total views</p>
                </div>
                <button onClick={() => setAnalyticsModalOpen(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[65vh] overflow-y-auto">
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : profileViewers.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <Eye className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">No profile views yet</p>
                    <p className="text-sm text-gray-500 mt-1">Views will appear here when another user opens your profile.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profileViewers.map((view) => (
                      <div key={view.id} className="flex items-center gap-4 border border-gray-100 rounded-lg p-4">
                        {view.user?.profile_image_url ? (
                          <img
                            src={view.user.profile_image_url}
                            alt={view.user.name}
                            className="w-12 h-12 rounded-full object-cover object-top border border-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                            {personInitials(view.user?.name || 'User')}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{view.user?.name || 'Deleted user'}</p>
                          <p className="text-sm text-gray-600 truncate">{view.user?.headline || view.user?.company || 'RecruitSense member'}</p>
                          <p className="text-xs text-gray-400 mt-1">Viewed on {viewedDate(view.viewed_at || view.viewed_on)}</p>
                        </div>

                        {view.user?.id && (
                          <button
                            onClick={() => {
                              setAnalyticsModalOpen(false)
                              navigate(`/profile/${view.user.id}`)
                            }}
                            className="px-4 py-2 rounded-full border border-sky-600 text-sky-700 text-sm font-semibold hover:bg-sky-50"
                          >
                            View profile
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {canEdit && profileModalOpen && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Edit profile</h3>
                <button onClick={() => setProfileModalOpen(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div
                  className="h-44 rounded-lg bg-cover relative border border-gray-100 cursor-move select-none overflow-hidden"
                  style={{
                    ...coverBackground(previews.cover || profileImages.cover, form.cover_position),
                    touchAction: 'none',
                  }}
                  onPointerDown={startCoverDrag}
                  onPointerMove={moveCoverDrag}
                  onPointerUp={stopCoverDrag}
                  onPointerCancel={stopCoverDrag}
                >
                  <input ref={coverImageInput} type="file" accept="image/*" className="hidden" onChange={(event) => handleImageChange(event, 'cover_image')} />
                  <button
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => coverImageInput.current?.click()}
                    className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full bg-white text-gray-700 shadow-sm flex items-center justify-center hover:bg-gray-50"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <div className="pointer-events-none absolute inset-4 rounded border-2 border-white/90 shadow-[0_0_0_999px_rgba(15,23,42,0.14)]" />
                  <div className="pointer-events-none absolute left-4 top-4 h-5 w-5 border-l-4 border-t-4 border-white" />
                  <div className="pointer-events-none absolute right-4 top-4 h-5 w-5 border-r-4 border-t-4 border-white" />
                  <div className="pointer-events-none absolute bottom-4 left-4 h-5 w-5 border-b-4 border-l-4 border-white" />
                  <div className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 border-b-4 border-r-4 border-white" />
                </div>

                <div className="flex items-end gap-4">
                  <div className="-mt-14 relative z-10">
                    {previews.profile || profileImages.profile ? (
                      <img src={previews.profile || profileImages.profile} alt={form.name} className="w-28 h-28 rounded-full object-cover object-top border-4 border-white shadow-sm" />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-sky-600 text-white border-4 border-white shadow-sm flex items-center justify-center text-3xl font-bold">
                        {initials}
                      </div>
                    )}
                    <input ref={profileImageInput} type="file" accept="image/*" className="hidden" onChange={(event) => handleImageChange(event, 'profile_image')} />
                  </div>
                  <button onClick={() => profileImageInput.current?.click()} className="px-4 py-2 rounded-full border border-sky-600 text-sky-700 font-semibold text-sm hover:bg-sky-50 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Profile photo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'name', label: 'Full name' },
                    { name: 'email', label: 'Email address' },
                    { name: 'headline', label: 'Headline', wide: true },
                    { name: 'location', label: 'Location' },
                    { name: 'phone', label: 'Phone' },
                    { name: 'company', label: 'Company' },
                    { name: 'education', label: 'Education' },
                    { name: 'website', label: 'Website', wide: true },
                  ].map((field) => (
                    <label key={field.name} className={`block ${field.wide ? 'col-span-2' : ''}`}>
                      <span className="text-sm font-semibold text-gray-700">{field.label}</span>
                      <input
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleProfileChange}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </label>
                  ))}

                  <label className="block col-span-2">
                    <span className="text-sm font-semibold text-gray-700">About</span>
                    <textarea name="about" value={form.about} onChange={handleProfileChange} rows={4} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                  </label>

                  <label className="block col-span-2">
                    <span className="text-sm font-semibold text-gray-700">Skills</span>
                    <input name="skills" value={form.skills} onChange={handleProfileChange} placeholder="React, Laravel, Flask" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                <button onClick={() => setProfileModalOpen(false)} className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving} className="px-5 py-2 rounded-full bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 disabled:opacity-60 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {canEdit && experienceModalOpen && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{editingExperienceId ? 'Edit experience' : 'Add experience'}</h3>
                <button onClick={() => setExperienceModalOpen(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { name: 'title', label: 'Title' },
                  { name: 'company', label: 'Company' },
                  { name: 'employment_type', label: 'Employment type' },
                  { name: 'location', label: 'Location' },
                  { name: 'start_date', label: 'Start date', type: 'date' },
                  { name: 'end_date', label: 'End date', type: 'date', disabled: experienceForm.is_current },
                ].map((field) => (
                  <label key={field.name} className="block">
                    <span className="text-sm font-semibold text-gray-700">{field.label}</span>
                    <input
                      type={field.type || 'text'}
                      name={field.name}
                      disabled={field.disabled}
                      value={experienceForm[field.name]}
                      onChange={(event) => setExperienceForm({ ...experienceForm, [event.target.name]: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-100"
                    />
                  </label>
                ))}

                <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={experienceForm.is_current}
                    onChange={(event) => setExperienceForm({ ...experienceForm, is_current: event.target.checked, end_date: event.target.checked ? '' : experienceForm.end_date })}
                    className="rounded border-gray-300"
                  />
                  I currently work here
                </label>

                <label className="block col-span-2">
                  <span className="text-sm font-semibold text-gray-700">Description</span>
                  <textarea
                    name="description"
                    value={experienceForm.description}
                    onChange={(event) => setExperienceForm({ ...experienceForm, description: event.target.value })}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </label>
              </div>

              <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                <button onClick={() => setExperienceModalOpen(false)} className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveExperience} className="px-5 py-2 rounded-full bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ProfilePage
