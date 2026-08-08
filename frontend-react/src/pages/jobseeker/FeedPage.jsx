import { useEffect, useMemo, useState } from 'react'
import { Newspaper, RefreshCw, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import PostCard from '../../components/posts/PostCard'
import PostComposer from '../../components/posts/PostComposer'
import api from '../../services/api'

const FeedPage = () => {
  const [searchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-5 lg:gap-6">
        <section className="lg:col-span-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
              <p className="text-sm text-gray-500 mt-1">Share updates and engage with your network.</p>
            </div>
            <button
              type="button"
              onClick={loadFeed}
              className="w-full sm:w-auto px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <PostComposer onPostCreated={addPost} />

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
                <div
                  id={`post-${post.id}`}
                  key={post.id}
                  className={`rounded-lg transition-all ${
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

        <aside className="lg:col-span-4 space-y-4">
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
