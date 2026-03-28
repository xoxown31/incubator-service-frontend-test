import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProblem } from '../api/problems'
import { getPosts, createPost, likePost, addComment } from '../api/board'
import { getAnswers, getTemplates, submitAnswer } from '../api/answers'

const CATEGORY_LABEL = { SOLUTION: '풀이', DISCUSSION: '토론', QUESTION: '질문', TIP: '팁' }
const POST_CATEGORIES = ['SOLUTION', 'DISCUSSION', 'QUESTION', 'TIP']

function parseSchema(template) {
  if (!template?.schema) return []
  try {
    return JSON.parse(template.schema).fields ?? []
  } catch {
    return []
  }
}

function DynamicAnswerForm({ templates, onSubmit, onCancel }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [fieldValues, setFieldValues] = useState({})

  const selectedTemplate = templates.find(t => t.id === Number(templateId))
  const fields = parseSchema(selectedTemplate)

  const handleTemplateChange = (id) => {
    setTemplateId(id)
    setFieldValues({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = JSON.stringify(
      Object.fromEntries(fields.map(f => [f.key, fieldValues[f.key] ?? '']))
    )
    onSubmit(Number(templateId), data)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={templateId}
          onChange={e => handleTemplateChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {selectedTemplate?.description && (
          <p className="text-xs text-gray-400">{selectedTemplate.description}</p>
        )}

        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <textarea
              value={fieldValues[f.key] ?? ''}
              onChange={e => setFieldValues(v => ({ ...v, [f.key]: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              required
            />
          </div>
        ))}

        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium">제출</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium">취소</button>
        </div>
      </form>
    </div>
  )
}

function AnswerCard({ answer, templates }) {
  const template = templates.find(t => t.id === answer.templateId)
  const fields = parseSchema(template)

  let parsed = {}
  try { parsed = JSON.parse(answer.data) } catch { /* raw fallback */ }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">{answer.templateName}</span>
        <span className="text-xs text-gray-400">{answer.userNickname}</span>
      </div>
      {fields.length > 0
        ? fields.map(f => (
          <div key={f.key} className="mb-3 last:mb-0">
            <p className="text-xs font-medium text-gray-500 mb-1">{f.label}</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{parsed[f.key] ?? ''}</p>
          </div>
        ))
        : <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{answer.data}</pre>
      }
    </div>
  )
}

export default function ProblemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [answers, setAnswers] = useState([])
  const [templates, setTemplates] = useState([])
  const [showPostForm, setShowPostForm] = useState(false)
  const [showAnswerForm, setShowAnswerForm] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', content: '', category: 'DISCUSSION' })
  const [expandedPost, setExpandedPost] = useState(null)
  const [commentInput, setCommentInput] = useState({})

  useEffect(() => { loadAll() }, [id])

  const loadAll = async () => {
    try {
      const [probRes, postsRes, answersRes, templatesRes] = await Promise.all([
        getProblem(id),
        getPosts(id),
        getAnswers(id),
        getTemplates(),
      ])
      setProblem(probRes.data.data)
      setPosts(postsRes.data.data.content || [])
      setAnswers(answersRes.data.data.content || [])
      setTemplates(templatesRes.data.data || [])
    } catch {
      navigate('/login')
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    await createPost(id, postForm)
    setShowPostForm(false)
    setPostForm({ title: '', content: '', category: 'DISCUSSION' })
    loadAll()
  }

  const handleSubmitAnswer = async (templateId, data) => {
    await submitAnswer(id, templateId, data)
    setShowAnswerForm(false)
    loadAll()
  }

  const handleLike = async (postId) => {
    await likePost(id, postId)
    loadAll()
  }

  const handleComment = async (postId) => {
    const content = commentInput[postId]
    if (!content?.trim()) return
    await addComment(id, postId, content)
    setCommentInput(p => ({ ...p, [postId]: '' }))
    loadAll()
  }

  if (!problem) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">로딩 중...</div>

  const STATUS_COLOR = { UNSOLVED: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-yellow-100 text-yellow-700', SOLVED: 'bg-green-100 text-green-700' }
  const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm">← 돌아가기</button>
        <h1 className="text-xl font-bold text-indigo-600">Incubator</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[problem.status]}`}>
              {STATUS_LABEL[problem.status]}
            </span>
            {problem.isPublic && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">공개</span>}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{problem.title}</h2>
          {problem.description && <p className="text-gray-600 text-sm">{problem.description}</p>}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('posts')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'posts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            게시글 {posts.length}
          </button>
          <button
            onClick={() => setTab('answers')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'answers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            정답 공유 {answers.length}
          </button>
        </div>

        {tab === 'posts' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowPostForm(v => !v)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                + 글쓰기
              </button>
            </div>

            {showPostForm && (
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
                    type="text"
                    placeholder="제목"
                    value={postForm.title}
                    onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <textarea
                    placeholder="내용"
                    value={postForm.content}
                    onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={4}
                    required
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium">등록</button>
                    <button type="button" onClick={() => setShowPostForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium">취소</button>
                  </div>
                </form>
              </div>
            )}

            {posts.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">아직 게시글이 없습니다.</div>}
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{CATEGORY_LABEL[post.category]}</span>
                  <span className="text-xs text-gray-400">조회 {post.viewCount}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{post.content}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleLike(post.id)} className="text-xs text-gray-500 hover:text-indigo-600">
                    ♥ {post.likeCount}
                  </button>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="text-xs text-gray-500 hover:text-indigo-600"
                  >
                    댓글 {post.comments?.length || 0}
                  </button>
                </div>

                {expandedPost === post.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {(post.comments || []).map(c => (
                      <div key={c.id} className="text-sm text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="font-medium text-gray-700 mr-2">{c.nickname}</span>{c.content}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={commentInput[post.id] || ''}
                        onChange={e => setCommentInput(p => ({ ...p, [post.id]: e.target.value }))}
                        placeholder="댓글 작성..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                      />
                      <button onClick={() => handleComment(post.id)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">등록</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'answers' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAnswerForm(v => !v)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                + 정답 공유
              </button>
            </div>

            {showAnswerForm && (
              templates.length === 0
                ? <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-sm text-gray-400">등록된 양식이 없습니다.</div>
                : <DynamicAnswerForm
                    templates={templates}
                    onSubmit={handleSubmitAnswer}
                    onCancel={() => setShowAnswerForm(false)}
                  />
            )}

            {answers.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">아직 공유된 정답이 없습니다.</div>}
            {answers.map(a => (
              <AnswerCard key={a.id} answer={a} templates={templates} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
