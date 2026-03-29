import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPost, deletePost, likePost, addComment } from '../api/board'
import { getTemplates } from '../api/answers'
import Layout from '../components/Layout'

const CATEGORY_LABEL = { SOLUTION: '풀이', DISCUSSION: '토론', QUESTION: '질문', TIP: '팁' }

function parseSchema(template) {
  if (!template?.schema) return []
  try { return JSON.parse(template.schema).fields ?? [] } catch { return [] }
}

export default function PostDetailPage() {
  const { id: problemId, postId } = useParams()
  const navigate = useNavigate()
  const myUserId = Number(localStorage.getItem('userId'))

  const [post, setPost] = useState(null)
  const [templates, setTemplates] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const [postRes, tmplRes] = await Promise.all([getPost(problemId, postId), getTemplates()])
      setPost(postRes.data.data)
      setTemplates(tmplRes.data.data || [])
    } catch {
      navigate(-1)
    }
  }

  useEffect(() => { load() }, [postId])

  const handleLike = async () => {
    await likePost(problemId, postId)
    load()
  }

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    await deletePost(problemId, postId)
    navigate(-1)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentInput.trim()) return
    setSubmitting(true)
    try {
      await addComment(problemId, postId, commentInput)
      setCommentInput('')
      load()
    } finally {
      setSubmitting(false)
    }
  }

  if (!post) return null

  const postTemplate = post.answer ? templates.find(t => t.id === post.answer.templateId) : null
  const ansFields = parseSchema(postTemplate)
  let parsedAnswerData = {}
  if (post.answer?.data) try { parsedAnswerData = JSON.parse(post.answer.data) } catch { /* ignore */ }

  const isOwner = post.userId === myUserId

  return (
    <Layout>
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-xs text-gray-400 hover:text-gray-600">← 돌아가기</button>

        {/* 게시글 본문 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                  {CATEGORY_LABEL[post.category]}
                </span>
                <span className="text-xs text-gray-400">{post.nickname}</span>
                <span className="text-xs text-gray-300">조회 {post.viewCount}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{post.title}</h2>
            </div>
            {isOwner && (
              <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 shrink-0">
                삭제
              </button>
            )}
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>

          {/* 정답 데이터 */}
          {post.answer && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-indigo-600 mb-2">정답 공유 — {post.answer.templateName}</p>
              {ansFields.length > 0
                ? ansFields.map(f => (
                  <div key={f.key}>
                    <p className="text-xs font-medium text-indigo-400">{f.label}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{parsedAnswerData[f.key] ?? ''}</p>
                  </div>
                ))
                : <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.answer.data}</p>
              }
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`text-sm font-medium transition-colors ${post.liked ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
            >
              ♥ {post.likeCount}
            </button>
            <span className="text-sm text-gray-400">댓글 {post.commentCount}</span>
          </div>
        </div>

        {/* 댓글 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">댓글 {post.comments?.length || 0}</h3>

          {(post.comments || []).length === 0 && (
            <p className="text-xs text-gray-400 py-2">첫 댓글을 남겨보세요.</p>
          )}

          {(post.comments || []).map(c => (
            <div key={c.id} className="py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs font-semibold text-gray-700 mr-2">{c.nickname}</span>
              <span className="text-sm text-gray-600">{c.content}</span>
            </div>
          ))}

          <form onSubmit={handleComment} className="flex gap-2 pt-2">
            <input
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="댓글 작성..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              등록
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
