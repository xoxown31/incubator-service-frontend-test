import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProblem, deleteProblem, getProblemComments, addProblemComment, deleteProblemComment } from '../api/problems'
import { getPosts, createPost, likePost } from '../api/board'
import { getTemplates, submitAnswer } from '../api/answers'
import Layout from '../components/Layout'

const CATEGORY_LABEL = { SOLUTION: '풀이', DISCUSSION: '토론', QUESTION: '질문', TIP: '팁' }
const POST_CATEGORIES = ['SOLUTION', 'DISCUSSION', 'QUESTION', 'TIP']
const STATUS_COLOR = { UNSOLVED: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-yellow-100 text-yellow-700', SOLVED: 'bg-green-100 text-green-700' }
const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }

function parseSchema(template) {
  if (!template?.schema) return []
  try { return JSON.parse(template.schema).fields ?? [] } catch { return [] }
}

export default function ProblemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const myUserId = Number(localStorage.getItem('userId'))

  const [problem, setProblem] = useState(null)
  const [posts, setPosts] = useState([])
  const [templates, setTemplates] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'DISCUSSION' })
  const [includeAnswer, setIncludeAnswer] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [answerFields, setAnswerFields] = useState({})

  // 힌트
  const [showHint, setShowHint] = useState(false)

  // 문제 댓글
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [showComments, setShowComments] = useState(false)

  const loadAll = async () => {
    try {
      const [probRes, postsRes, templatesRes] = await Promise.all([
        getProblem(id),
        getPosts(id),
        getTemplates(),
      ])
      setProblem(probRes.data.data)
      setPosts(postsRes.data.data.content || [])
      const tmps = templatesRes.data.data || []
      setTemplates(tmps)
      if (!selectedTemplateId && tmps.length > 0) setSelectedTemplateId(String(tmps[0].id))
    } catch {
      navigate('/login')
    }
  }

  const loadComments = async () => {
    try {
      const { data } = await getProblemComments(id)
      setComments(data.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadAll() }, [id])
  useEffect(() => { if (showComments) loadComments() }, [showComments])

  const handleTemplateChange = (tid) => {
    setSelectedTemplateId(tid)
    setAnswerFields({})
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    let answerId = null
    if (includeAnswer && selectedTemplateId) {
      const fields = parseSchema(templates.find(t => t.id === Number(selectedTemplateId)))
      const data = JSON.stringify(Object.fromEntries(fields.map(f => [f.key, answerFields[f.key] ?? ''])))
      try {
        const res = await submitAnswer(id, Number(selectedTemplateId), data)
        answerId = res.data.data.id
      } catch { /* ignore */ }
    }
    await createPost(id, { ...postForm, answerId })
    setShowForm(false)
    setPostForm({ title: '', content: '', category: 'DISCUSSION' })
    setIncludeAnswer(false)
    setAnswerFields({})
    loadAll()
  }

  const handleLike = async (e, postId) => {
    e.stopPropagation()
    await likePost(id, postId)
    loadAll()
  }

  const handleDeleteProblem = async () => {
    if (!confirm('문제를 삭제하시겠습니까?')) return
    await deleteProblem(id)
    navigate('/problems')
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentInput.trim()) return
    await addProblemComment(id, commentInput.trim())
    setCommentInput('')
    loadComments()
  }

  const handleDeleteComment = async (commentId) => {
    await deleteProblemComment(commentId)
    loadComments()
  }

  if (!problem) return null

  const selectedTemplate = templates.find(t => t.id === Number(selectedTemplateId))
  const answerSchemaFields = parseSchema(selectedTemplate)
  const isOwner = problem.userId === myUserId

  return (
    <Layout>
      {/* 문제 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-xs text-gray-400 hover:text-gray-600 mb-3 block">← 돌아가기</button>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[problem.status]}`}>
                {STATUS_LABEL[problem.status]}
              </span>
              {problem.isPublic && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">공개</span>}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{problem.title}</h2>
            {problem.description && <p className="text-gray-500 text-sm">{problem.description}</p>}
          </div>
          {isOwner && (
            <button onClick={handleDeleteProblem} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 shrink-0">
              삭제
            </button>
          )}
        </div>

        {/* 힌트 */}
        {problem.hint && (
          <div className="mt-4 border-t border-gray-50 pt-4">
            <button
              onClick={() => setShowHint(v => !v)}
              className="text-xs text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
            >
              💡 {showHint ? '힌트 숨기기' : '힌트 보기'}
            </button>
            {showHint && (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 leading-relaxed">
                {problem.hint}
              </p>
            )}
          </div>
        )}

        {/* 문제 댓글 토글 */}
        <div className="mt-4 border-t border-gray-50 pt-4">
          <button
            onClick={() => setShowComments(v => !v)}
            className="text-xs text-gray-500 font-medium hover:text-gray-700 flex items-center gap-1"
          >
            💬 문제 댓글 {showComments ? '숨기기' : '보기'} ({comments.length})
          </button>

          {showComments && (
            <div className="mt-3 space-y-3">
              {comments.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">아직 댓글이 없습니다.</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-gray-700">{c.nickname}</span>
                    <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                  </div>
                  {c.userId === myUserId && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-xs text-red-400 hover:text-red-600 shrink-0"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="댓글 입력..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-medium">
                  등록
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">게시글 {posts.length}</h3>
          <button onClick={() => setShowForm(v => !v)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + 글쓰기
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <select
                value={postForm.category}
                onChange={e => setPostForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {POST_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
              <input
                type="text" placeholder="제목" required value={postForm.title}
                onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="내용" required value={postForm.content} rows={4}
                onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              {templates.length > 0 && (
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeAnswer}
                      onChange={e => setIncludeAnswer(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700">정답 양식으로 작성</span>
                  </label>
                  {includeAnswer && (
                    <div className="space-y-3">
                      <select
                        value={selectedTemplateId}
                        onChange={e => handleTemplateChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      {answerSchemaFields.map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                          <textarea
                            value={answerFields[f.key] ?? ''}
                            onChange={e => setAnswerFields(v => ({ ...v, [f.key]: e.target.value }))}
                            rows={2} required
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium">등록</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium">취소</button>
              </div>
            </form>
          </div>
        )}

        {posts.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">아직 게시글이 없습니다.</div>}

        {posts.map(post => (
          <div
            key={post.id}
            onClick={() => navigate(`/problems/${id}/posts/${post.id}`)}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{CATEGORY_LABEL[post.category]}</span>
              <span className="text-xs text-gray-400">{post.nickname}</span>
              {post.answer && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">정답 포함</span>}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-4 mt-3" onClick={e => e.stopPropagation()}>
              <button
                onClick={e => handleLike(e, post.id)}
                className={`text-xs font-medium transition-colors ${post.liked ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
              >
                ♥ {post.likeCount}
              </button>
              <span className="text-xs text-gray-400">댓글 {post.commentCount}</span>
              <span className="text-xs text-gray-300">조회 {post.viewCount}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
