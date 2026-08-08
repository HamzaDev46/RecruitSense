import { useState } from 'react'
import { Check, Eye, Flag, Globe2, Heart, MessageCircle, Pencil, Repeat2, Send, Trash2, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ReportContentModal from '../ReportContentModal'
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

const wasEdited = (item) => Boolean(item?.updated_at && item?.created_at && item.updated_at !== item.created_at)

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

const OriginalPostPreview = ({ post, onOpenProfile }) => {
  if (!post) return null

  return (
    <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onOpenProfile(post.author)}>
            <Avatar user={post.author} size="w-9 h-9" />
          </button>
          <button type="button" onClick={() => onOpenProfile(post.author)} className="min-w-0 text-left">
            <p className="text-sm font-bold text-gray-900 truncate">{post.author?.name || 'RecruitSense member'}</p>
            <p className="text-xs text-gray-500 truncate">{post.author?.headline || post.author?.company || 'RecruitSense member'}</p>
          </button>
        </div>
        {post.body && (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-3">{post.body}</p>
        )}
      </div>

      {post.media?.length > 0 && (
        <div className={`grid gap-1 bg-gray-100 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media.map((media) => (
            <div key={media.id} className="bg-gray-100">
              {media.file_type === 'video' ? (
                <video src={media.url} className="w-full max-h-72 object-cover bg-black" controls />
              ) : (
                <img src={media.url} alt="Original post media" className="w-full max-h-72 object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PostCard = ({ post, onPostUpdated, onPostDeleted, onPostCreated }) => {
  const navigate = useNavigate()
  const [commentBody, setCommentBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingPost, setEditingPost] = useState(false)
  const [editBody, setEditBody] = useState(post?.body || '')
  const [editVisibility, setEditVisibility] = useState(post?.visibility || 'public')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')
  const [reportTarget, setReportTarget] = useState(null)

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
    reposts_count: post.reposts_count || 0,
    can_report: Boolean(post.can_report),
  }

  const openAuthorProfile = (author) => {
    if (author?.id) {
      navigate(`/profile/${author.id}`)
    }
  }

  const updatePost = (nextPost) => {
    onPostUpdated?.(nextPost)
  }

  const mergeSourcePost = (sourcePost) => {
    if (sourcePost && sourcePost.id === localPost.id) {
      updatePost(sourcePost)
    }
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

  const startPostEdit = () => {
    setEditBody(localPost.body || '')
    setEditVisibility(localPost.visibility || 'public')
    setEditingPost(true)
  }

  const savePostEdit = async () => {
    const trimmedBody = editBody.trim()

    if (!trimmedBody && !localPost.original_post && mediaCount === 0) {
      toast.error('Write something before saving this post')
      return
    }

    setBusy(true)
    try {
      const res = await api.put(`/posts/${localPost.id}`, {
        body: trimmedBody,
        visibility: editVisibility,
      })
      updatePost(res.data.post)
      setEditingPost(false)
      toast.success('Post updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update post')
    } finally {
      setBusy(false)
    }
  }

  const startCommentEdit = (comment) => {
    setEditingCommentId(comment.id)
    setEditingCommentBody(comment.body || '')
  }

  const saveCommentEdit = async (commentId) => {
    const trimmedBody = editingCommentBody.trim()

    if (!trimmedBody) {
      toast.error('Comment cannot be empty')
      return
    }

    setBusy(true)
    try {
      const res = await api.put(`/post-comments/${commentId}`, { body: trimmedBody })
      updatePost(res.data.post)
      setEditingCommentId(null)
      setEditingCommentBody('')
      toast.success('Comment updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update comment')
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

  const toggleRepost = async () => {
    const targetId = localPost.original_post?.id || localPost.id

    setBusy(true)
    try {
      if (localPost.is_reposted) {
        const res = await api.delete(`/posts/${targetId}/repost`)

        if (localPost.is_repost && localPost.can_delete) {
          onPostDeleted?.(localPost.id)
        } else {
          mergeSourcePost(res.data.source_post)
        }

        toast.success('Repost removed')
      } else {
        const res = await api.post(`/posts/${targetId}/repost`, {
          visibility: localPost.visibility || 'public',
        })

        onPostCreated?.(res.data.post)
        mergeSourcePost(res.data.source_post)
        toast.success('Post reposted')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update repost')
    } finally {
      setBusy(false)
    }
  }

  const mediaCount = localPost.media?.length || 0

  return (
    <article className="bg-white border border-gray-100 rounded-lg overflow-hidden">
      {localPost.is_repost && (
        <div className="px-5 pt-4 flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Repeat2 className="w-4 h-4" />
          {localPost.author.name} reposted
        </div>
      )}
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
              {wasEdited(localPost) && <span>edited</span>}
              {localPost.visibility === 'public' ? <Globe2 className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            </p>
          </button>

          {(localPost.can_edit || localPost.can_delete || localPost.can_report) && (
            <div className="flex items-center gap-1">
              {localPost.can_edit && (
                <button
                  type="button"
                  onClick={startPostEdit}
                  disabled={busy || editingPost}
                  aria-label="Edit post"
                  className="w-9 h-9 rounded-full text-gray-400 hover:text-sky-700 hover:bg-sky-50 disabled:opacity-50 flex items-center justify-center"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {localPost.can_delete && (
                <button
                  type="button"
                  onClick={deletePost}
                  disabled={busy}
                  aria-label="Delete post"
                  className="w-9 h-9 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              {localPost.can_report && (
                <button
                  type="button"
                  onClick={() => setReportTarget({
                    type: 'post',
                    reportableId: localPost.id,
                    title: 'Report post',
                  })}
                  disabled={busy}
                  aria-label="Report post"
                  className="w-9 h-9 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center justify-center"
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {editingPost ? (
          <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50/40 p-3">
            <textarea
              value={editBody}
              onChange={(event) => setEditBody(event.target.value)}
              rows={4}
              placeholder={localPost.original_post ? 'Add a thought to your repost...' : 'What do you want to share?'}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
                {[
                  { value: 'public', label: 'Public', icon: <Globe2 className="w-3.5 h-3.5" /> },
                  { value: 'connections', label: 'Connections', icon: <Users className="w-3.5 h-3.5" /> },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEditVisibility(option.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      editVisibility === option.value
                        ? 'bg-sky-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPost(false)}
                  disabled={busy}
                  className="px-3 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-50 flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePostEdit}
                  disabled={busy}
                  className="px-3 py-2 rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : localPost.body && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mt-4">{localPost.body}</p>
        )}

        {localPost.original_post && (
          <OriginalPostPreview post={localPost.original_post} onOpenProfile={openAuthorProfile} />
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
            <span>{localPost.reposts_count} reposts</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {localPost.impressions_count}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3">
          <button
            type="button"
            onClick={toggleLike}
            disabled={busy}
            className={`py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-gray-50 ${
              localPost.is_liked ? 'text-sky-700' : 'text-gray-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${localPost.is_liked ? 'fill-current' : ''}`} />
            Like
          </button>
          <button
            type="button"
            onClick={() => document.getElementById(`comment-${localPost.id}`)?.focus()}
            className="py-2 rounded-lg text-xs sm:text-sm font-semibold text-gray-600 flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-gray-50"
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>
          <button
            type="button"
            onClick={toggleRepost}
            disabled={busy}
            className={`py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-gray-50 ${
              localPost.is_reposted ? 'text-sky-700' : 'text-gray-600'
            }`}
          >
            <Repeat2 className="w-4 h-4" />
            {localPost.is_reposted ? 'Reposted' : 'Repost'}
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
                      <p className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                        {wasEdited(comment) && ' - edited'}
                      </p>
                    </div>
                    {(comment.can_edit || comment.can_delete || comment.can_report) && (
                      <div className="flex items-center gap-1">
                        {comment.can_edit && (
                          <button
                            type="button"
                            onClick={() => startCommentEdit(comment)}
                            disabled={busy || editingCommentId === comment.id}
                            aria-label="Edit comment"
                            className="w-7 h-7 rounded-full text-gray-400 hover:text-sky-700 hover:bg-white disabled:opacity-50 flex items-center justify-center"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {comment.can_delete && (
                          <button
                            type="button"
                            onClick={() => deleteComment(comment.id)}
                            disabled={busy}
                            aria-label="Delete comment"
                            className="w-7 h-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-white disabled:opacity-50 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {comment.can_report && (
                          <button
                            type="button"
                            onClick={() => setReportTarget({
                              type: 'comment',
                              reportableId: comment.id,
                              title: 'Report comment',
                            })}
                            disabled={busy}
                            aria-label="Report comment"
                            className="w-7 h-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-white disabled:opacity-50 flex items-center justify-center"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingCommentBody}
                        onChange={(event) => setEditingCommentBody(event.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null)
                            setEditingCommentBody('')
                          }}
                          disabled={busy}
                          className="w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
                          aria-label="Cancel comment edit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => saveCommentEdit(comment.id)}
                          disabled={busy || !editingCommentBody.trim()}
                          className="w-8 h-8 rounded-full bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center"
                          aria-label="Save comment edit"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.body}</p>
                  )}
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

      <ReportContentModal
        open={Boolean(reportTarget)}
        type={reportTarget?.type}
        reportableId={reportTarget?.reportableId}
        title={reportTarget?.title}
        onClose={() => setReportTarget(null)}
      />
    </article>
  )
}

export default PostCard
