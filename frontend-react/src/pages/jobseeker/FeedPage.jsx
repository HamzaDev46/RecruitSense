import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Newspaper, Plus, RefreshCw, Sparkles, User, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import PostCard from '../../components/posts/PostCard'
import CreatePostModal from '../../components/posts/CreatePostModal'
import api from '../../services/api'
import { useAuth } from '../../context/useAuth'

const initials = (name = 'User') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const FeedPage = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('community') // 'community' (others only) | 'all' | 'mine'

  const targetPostId = searchParams.get('post')
  const highlightedPostId = useMemo(() => Number(targetPostId || 0), [targetPostId])

  const loadFeed = async () => {
    setLoading(true)
    try {
      const res = await api.get('/posts/feed')
      let nextPosts = res.data || []

      if (targetPostId && !nextPosts.some((post) => String(post.id) === String(targetPostId))) {
        try {
          const targetRes = await api.get(`/posts/${targetPostId}`)
          nextPosts = [targetRes.data, ...nextPosts.filter((post) => String(post.id) !== String(targetPostId))]
        } catch {
          toast.error('The post is no longer available')
        }
      }

      setPosts(nextPosts)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    api.get('/posts/feed')
      .then((res) => {
        if (!active) return

        const feedPosts = res.data || []

        if (!targetPostId || feedPosts.some((post) => String(post.id) === String(targetPostId))) {
          setPosts(feedPosts)
          return
        }

        api.get(`/posts/${targetPostId}`)
          .then((targetRes) => {
            if (!active) return

            setPosts([
              targetRes.data,
              ...feedPosts.filter((post) => String(post.id) !== String(targetPostId)),
            ])
          })
          .catch(() => {
            if (!active) return

            setPosts(feedPosts)
            toast.error('The post is no longer available')
          })
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load feed')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [targetPostId])

  useEffect(() => {
    if (!highlightedPostId || loading) return

    const timer = window.setTimeout(() => {
      document.getElementById(`post-${highlightedPostId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [highlightedPostId, loading, posts])

  const updatePost = (nextPost) => {
    setPosts((current) => current.map((post) => post.id === nextPost.id ? nextPost : post))
  }

  const addPost = (nextPost) => {
    setPosts((current) => [
      nextPost,
      ...current.filter((post) => post.id !== nextPost.id),
    ])
  }

  const removePost = (postId) => {
    setPosts((current) => current.filter((post) => post.id !== postId))
  }

  // Filter posts based on selected tab
  const displayedPosts = useMemo(() => {
    if (activeTab === 'community') {
      // Show only OTHER users' posts (exclude current logged-in user)
      return posts.filter((post) => {
        const authorId = post.author?.id || post.user_id
        return Number(authorId) !== Number(user?.id)
      })
    }
    if (activeTab === 'mine') {
      // Show only current user's posts
      return posts.filter((post) => {
        const authorId = post.author?.id || post.user_id
        return Number(authorId) === Number(user?.id)
      })
    }
    return posts
  }, [posts, activeTab, user?.id])

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-5 lg:gap-6">
        <section className="lg:col-span-8 space-y-5">
          {/* Header & Create Post Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Community Feed</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Explore updates, projects, and career insights from professionals.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadFeed}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
                title="Refresh feed"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            </div>
          </div>

          {/* Quick Click-to-Post Trigger Pill */}
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center gap-3 cursor-pointer hover:border-sky-300 hover:shadow-sm transition group"
          >
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
            <div className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200/80 text-gray-400 text-sm font-medium group-hover:bg-sky-50/50 group-hover:text-gray-600 transition">
              Share an update, project photo, achievement, or job thought...
            </div>
            <button
              type="button"
              className="p-2.5 rounded-full text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition"
              title="Add Media"
            >
              <ImagePlus className="w-5 h-5 text-sky-600" />
            </button>
          </div>

          {/* Feed Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                activeTab === 'community'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Community Network (Other Users)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                activeTab === 'mine'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Posts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>All Feed</span>
            </button>
          </div>

          {/* Posts Stream */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-56 bg-white border border-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                <Newspaper className="w-7 h-7" />
              </div>
              <h2 className="font-bold text-gray-900 text-base">
                {activeTab === 'community' ? 'No other member posts yet' : activeTab === 'mine' ? 'You haven\'t posted yet' : 'No posts in feed'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                {activeTab === 'community'
                  ? 'Connect with other professionals or recruiters to see their updates here.'
                  : 'Click "+ Create Post" above to publish your first update to the network!'}
              </p>
              {activeTab === 'mine' && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Post</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {displayedPosts.map((post) => (
                <div
                  id={`post-${post.id}`}
                  key={post.id}
                  className={`rounded-2xl transition-all ${
                    highlightedPostId === post.id ? 'ring-2 ring-sky-500 ring-offset-4 ring-offset-[#f3f2ef]' : ''
                  }`}
                >
                  <PostCard
                    post={post}
                    onPostUpdated={updatePost}
                    onPostDeleted={removePost}
                    onPostCreated={addPost}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sidebar Info */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-base">Network & Feed Rules</h2>
            <div className="mt-3 space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <p>
                <span className="font-semibold text-gray-900">🌐 Community Tab:</span> Displays posts published by other job seekers and recruiters across the platform.
              </p>
              <p>
                <span className="font-semibold text-gray-900">👤 My Posts Tab:</span> Easily track your own published posts and engagement metrics.
              </p>
              <p>
                <span className="font-semibold text-gray-900">📸 High-Res Previews:</span> Click any post photo to open the full-screen photo viewer.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Dedicated Create Post Popup Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={addPost}
      />
    </DashboardLayout>
  )
}

export default FeedPage
