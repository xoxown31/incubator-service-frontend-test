import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProblem, deleteProblem } from '../api/problems'
import { getPosts, getPost, createPost, deletePost, likePost, addComment } from '../api/board'
import { getTemplates, submitAnswer } from '../api/answers'
import Layout from '../components/Layout'

const CATEGORY_LABEL = { SOLUTION: '풀이', DISCUSSION: '토론', QUESTION: '질문', TIP: '팁' }
const POST_CATEGORIES = ['SOLUTION', 'DISCUSSION', 'QUESTION', 'TIP']
const STATUS_COLOR = { UNSOLVED: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-yellow-100 text-yellow-700', SOLVED: 'bg-green-100 text-green-700' }
const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }

const myUserId = Number(localStorage.getItem('userId'))

function parseSchema(template) {
  if (!template?.schema) return []
  try { return JSON.parse(template.schema).fields ?? [] } catch { return [] }
}

export default function ProblemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  const [posts, setPosts] = useState([])
  const [templates, setTemplates] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'DISCUSSION' })
  const [includeAnswer, setIncludeAnswer] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [answerFields, setAnswerFields] = useState({})
  const [expandedPost, setExpandedPost] = useState(null)
  const [fullPosts, setFullPosts] = useState({}) // postId -> full post with comments
  const [commentInput, setCommentInput] = useState({})

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

  useEffect(() => { loadAll() }, [id])

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
      } catch { /* 정답 저장 실패해도 게시글은 등록 */ }
    }

    await createPost(id, { ...postForm, answerId })
    setShowForm(false)
    setPostForm({ title: '', content: '', category: 'DISCUSSION' })
    setIncludeAnswer(false)
    setAnswerFields({})
    loadAll()
  }

  const handleLike = async (postId) => { await likePost(id, postId); loadAll() }

  const handleDeletePost = async (postId) => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    await deletePost(id, postId)
    setExpandedPost(null)
    loadAll()
  }

  const handleDeleteProblem = async () => {
    if (!confirm('문제를 삭제하시겠습니까?')) return
    await deleteProblem(id)
    navigate('/problems')
  }

  const handleExpandPost = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
      return
    }
    setExpandedPost(postId)
    if (!fullPosts[postId]) {
      try {
        const res = await getPost(id, postId)
        setFullPosts(prev => ({ ...prev, [postId]: res.data.data }))
      } catch { /* ignore */ }
    }
  }

  const handleComment = async (postId) => {
    const content = commentInput[postId]
    if (!content?.trim()) return
    await addComment(id, postId, content)
    setCommentInput(p => ({ ...p, [postId]: '' }))
    // reload full post to get updated comments
    try {
      const res = await getPost(id, postId)
      setFullPosts(prev => ({ ...prev, [postId]: res.data.data }))
    } catch { /* ignore */ }
  }

  if (!problem) return null

  const selectedTemplate = templates.find(t => t.id === Number(selectedTemplateId))
  const answerSchemaFields = parseSchema(selectedTemplate)
  const isOwner = problem.userId === myUserId

  return (
    <Layout>
      {/* 문제 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
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
            <button
              onClick={handleDeleteProblem}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 shrink-0"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">게시글 {posts.length}</h3>
          <button
            onClick={() => setShowForm(v => !v)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + 글쓰기
          </button>
        </div>

        {/* 글쓰기 폼 */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
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

              {/* 정답 포함 토글 */}
              {templates.length > 0 && (
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAnswer}
                      onChange={e => setIncludeAnswer(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700">정답 양식으로 작성</span>
                    <span className="text-xs text-gray-400">선택한 양식에 맞춰 정답을 함께 남길 수 있습니다</span>
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
                            rows={2}
                            required
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

        {posts.map(post => {
          const isExpanded = expandedPost === post.id
          const full = fullPosts[post.id]
          const displayPost = full || post
          const postAnswer = displayPost.answer
          const postTemplate = postAnswer ? templates.find(t => t.id === postAnswer.templateId) : null
          const ansFields = parseSchema(postTemplate)
          let parsedAnswerData = {}
          if (postAnswer?.data) try { parsedAnswerData = JSON.parse(postAnswer.data) } catch { /* ignore */ }
          const isPostOwner = post.userId === myUserId

          return (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{CATEGORY_LABEL[post.category]}</span>
                  <span className="text-xs text-gray-400">{post.nickname}</span>
                  <span className="text-xs text-gray-300">조회 {post.viewCount}</span>
                </div>
                {isPostOwner && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 shrink-0"
                  >
                    삭제
                  </button>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
              <p className="text-sm text-gray-600">{post.content}</p>

              {/* 정답 데이터 (있을 때만) */}
              {postAnswer && (
                <div className="mt-3 bg-indigo-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-indigo-600 mb-2">
                    정답 공유 — {postAnswer.templateName}
                  </p>
                  {ansFields.length > 0
                    ? ansFields.map(f => (
                      <div key={f.key}>
                        <p className="text-xs font-medium text-indigo-400">{f.label}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{parsedAnswerData[f.key] ?? ''}</p>
                      </div>
                    ))
                    : <p className="text-sm text-gray-700 whitespace-pre-wrap">{postAnswer.data}</p>
                  }
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                <button onClick={() => handleLike(post.id)} className="text-xs text-gray-400 hover:text-indigo-600">
                  ♥ {displayPost.likeCount}
                </button>
                <button
                  onClick={() => handleExpandPost(post.id)}
                  className="text-xs text-gray-400 hover:text-indigo-600"
                >
                  댓글 {isExpanded && full ? full.comments?.length || 0 : post.comments?.length || 0}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {full ? (
                    <>
                      {(full.comments || []).length === 0 && (
                        <p className="text-xs text-gray-400 py-2">첫 댓글을 남겨보세요.</p>
                      )}
                      {(full.comments || []).map(c => (
                        <div key={c.id} className="text-sm text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                          <span className="font-medium text-gray-700 mr-2">{c.nickname}</span>{c.content}
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 py-2">불러오는 중...</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={commentInput[post.id] || ''}
                      onChange={e => setCommentInput(p => ({ ...p, [post.id]: e.target.value }))}
                      placeholder="댓글 작성..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                    />
                    <button onClick={() => handleComment(post.id)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">등록</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
