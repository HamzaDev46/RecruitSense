import { useEffect, useState } from 'react'
import { Newspaper, RefreshCw, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import PostCard from '../../components/posts/PostCard'
import PostComposer from '../../components/posts/PostComposer'
import api from '../../services/api'

const FeedPage = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFeed = async () => {
    setLoading(true)
    try {
      const res = await api.get('/posts/feed')
      setPosts(res.data)
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
        if (active) setPosts(res.data)
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
  }, [])

  const updatePost = (nextPost) => {
    setPosts((current) => current.map((post) => post.id === nextPost.id ? nextPost : post))
  }

  const removePost = (postId) => {
    setPosts((current) => current.filter((post) => post.id !== postId))
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        <section className="col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
              <p className="text-sm text-gray-500 mt-1">Share updates and engage with your network.</p>
            </div>
            <button
              type="button"
              onClick={loadFeed}
              className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <PostComposer onPostCreated={(post) => setPosts((current) => [post, ...current])} />

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-56 bg-white border border-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-lg p-10 text-center">
              <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h2 className="font-bold text-gray-900">No posts yet</h2>
              <p className="text-sm text-gray-500 mt-1">Create the first post or connect with people to see updates.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={updatePost}
                  onPostDeleted={removePost}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="col-span-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-lg p-5">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900">How visibility works</h2>
            <div className="mt-3 space-y-3 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">Public</span> posts can appear to any logged-in jobseeker.</p>
              <p><span className="font-semibold text-gray-900">Connections</span> posts are shown to accepted connections only.</p>
              <p>Post impressions increase when another user sees your post in feed or on your profile.</p>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  )
}

export default FeedPage
