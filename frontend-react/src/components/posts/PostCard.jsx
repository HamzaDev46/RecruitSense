import { useState } from 'react'
import { Eye, Globe2, Heart, MessageCircle, Send, Trash2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'

const initials = (name = 'User') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const formatDate = (value) => {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const Avatar = ({ user, size = 'w-11 h-11' }) => {
  if (user?.profile_image_url) {
    return (
      <img
        src={user.profile_image_url}
        alt={user.name}
        className={`${size} rounded-full object-cover object-top border border-gray-100`}
      />
    )
  }

  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold`}>
      {initials(user?.name)}
    </div>
  )
}

const PostCard = ({ post, onPostUpdated, onPostDeleted }) => {
  const navigate = useNavigate()
  const [commentBody, setCommentBody] = useState('')
  const [busy, setBusy] = useState(false)

  if (!post) return null

  const localPost = {
    ...post,
    author: post.author || { name: 'RecruitSense member' },
    media: Array.isArray(post.media) ? post.media : [],
    comments: Array.isArray(post.comments)
      ? post.comments.map((comment) => ({
        ...comment,
        author: comment.author || { name: 'Deleted member' },
      }))
      : [],
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    impressions_count: post.impressions_count || 0,
  }

  const openAuthorProfile = (author) => {
    if (author?.id) {
      navigate(`/profile/${author.id}`)
    }
  }

  const updatePost = (nextPost) => {
    onPostUpdated?.(nextPost)
  }

  const toggleLike = async () => {
    setBusy(true)
    try {
      const res = localPost.is_liked
        ? await api.delete(`/posts/${localPost.id}/like`)
        : await api.post(`/posts/${localPost.id}/like`)

      updatePost(res.data.post)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update like')
    } finally {
      setBusy(false)
    }
  }

  const addComment = async () => {
    if (!commentBody.trim()) return

    setBusy(true)
    try {
      const res = await api.post(`/posts/${localPost.id}/comments`, { body: commentBody.trim() })
      setCommentBody('')
      updatePost(res.data.post)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment')
    } finally {
      setBusy(false)
    }
  }

  const deleteComment = async (commentId) => {
    setBusy(true)
    try {
      const res = await api.delete(`/post-comments/${commentId}`)
      updatePost(res.data.post)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment')
    } finally {
      setBusy(false)
    }
  }

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return

    setBusy(true)
    try {
      await api.delete(`/posts/${localPost.id}`)
      onPostDeleted?.(localPost.id)
      toast.success('Post deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post')
    } finally {
      setBusy(false)
    }
  }

  const mediaCount = localPost.media?.length || 0

  return (
    <article className="bg-white border border-gray-100 rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => openAuthorProfile(localPost.author)}>
            <Avatar user={localPost.author} />
          </button>

          <button type="button" onClick={() => openAuthorProfile(localPost.author)} className="min-w-0 flex-1 text-left">
            <p className="font-bold text-gray-900 truncate">{localPost.author.name}</p>
            <p className="text-sm text-gray-500 truncate">{localPost.author.headline || localPost.author.company || 'RecruitSense member'}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
              {formatDate(localPost.created_at)}
              {localPost.visibility === 'public' ? <Globe2 className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            </p>
          </button>

          {localPost.can_delete && (
            <button
              type="button"
              onClick={deletePost}
              disabled={busy}
              className="w-9 h-9 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {localPost.body && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mt-4">{localPost.body}</p>
        )}
      </div>

      {mediaCount > 0 && (
        <div className={`grid gap-1 bg-gray-100 ${mediaCount === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {localPost.media.map((media) => (
            <div key={media.id} className="bg-gray-100">
              {media.file_type === 'video' ? (
                <video src={media.url} className="w-full max-h-[460px] object-cover bg-black" controls />
              ) : (
                <img src={media.url} alt="Post media" className="w-full max-h-[460px] object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{localPost.likes_count} likes</span>
          <span className="flex items-center gap-3">
            <span>{localPost.comments_count} comments</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {localPost.impressions_count}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            type="button"
            onClick={toggleLike}
            disabled={busy}
            className={`py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 ${
              localPost.is_liked ? 'text-sky-700' : 'text-gray-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${localPost.is_liked ? 'fill-current' : ''}`} />
            Like
          </button>
          <button
            type="button"
            onClick={() => document.getElementById(`comment-${localPost.id}`)?.focus()}
            className="py-2 rounded-lg text-sm font-semibold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {localPost.comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar user={comment.author} size="w-9 h-9" />
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{comment.author.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(comment.created_at)}</p>
                    </div>
                    {comment.can_delete && (
                      <button
                        type="button"
                        onClick={() => deleteComment(comment.id)}
                        disabled={busy}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              id={`comment-${localPost.id}`}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  addComment()
                }
              }}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={addComment}
              disabled={busy || !commentBody.trim()}
              className="w-10 h-10 rounded-full bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default PostCard
