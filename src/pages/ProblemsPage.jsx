import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getMyProblems, createProblem, updateProblemStatus, deleteProblem } from '../api/problems'
import { getTemplates } from '../api/answers'
import Layout from '../components/Layout'

const CATEGORIES = ['DAILY', 'WORK', 'STUDY', 'CREATIVE', 'OTHER']
const CATEGORY_LABEL = { DAILY: '일상', WORK: '업무', STUDY: '학습', CREATIVE: '창의', OTHER: '기타' }
const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }
const STATUS_COLOR = {
  UNSOLVED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  SOLVED: 'bg-green-100 text-green-700',
}

const EMPTY_FORM = { title: '', description: '', hint: '', category: 'DAILY', isPublic: false, defaultTemplateId: '' }

export default function ProblemsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [problems, setProblems] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(location.state?.openForm ?? false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [templates, setTemplates] = useState([])

  const load = async () => {
    try {
      const { data } = await getMyProblems(statusFilter || undefined)
      setProblems(data.data)
    } catch {
      navigate('/login')
    }
  }

  useEffect(() => { load() }, [statusFilter])
  useEffect(() => { getTemplates().then(r => setTemplates(r.data.data || [])) }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createProblem({
      ...form,
      defaultTemplateId: form.defaultTemplateId ? Number(form.defaultTemplateId) : null,
    })
    setShowForm(false)
    setForm(EMPTY_FORM)
    load()
  }

  const handleStatus = async (e, id, status) => {
    e.stopPropagation()
    await updateProblemStatus(id, status)
    load()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('삭제하시겠습니까?')) return
    await deleteProblem(id)
    load()
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {['', 'UNSOLVED', 'IN_PROGRESS', 'SOLVED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === '' ? '전체' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + 등록
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">새 문제 등록</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text" placeholder="제목" value={form.title} required
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="설명 (선택)" value={form.description} rows={3}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <input
                type="text" placeholder="힌트 — '~~~~이지 않을까요?' (선택)" value={form.hint}
                onChange={e => setForm(p => ({ ...p, hint: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3 flex-wrap">
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
                {templates.length > 0 && (
                  <select
                    value={form.defaultTemplateId}
                    onChange={e => setForm(p => ({ ...p, defaultTemplateId: e.target.value }))}
                    className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">기본 정답 양식 없음</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.isPublic}
                  onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600"
                />
                커뮤니티에 공개
              </label>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium">등록</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium">취소</button>
              </div>
            </form>
          </div>
        )}

        {problems.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">등록된 문제가 없습니다.</div>
        )}
        {problems.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/problems/${p.id}`)}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{CATEGORY_LABEL[p.category]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                  {p.isPublic && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 font-medium">공개</span>}
                </div>
                <h3 className="font-medium text-gray-900 truncate">{p.title}</h3>
                {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {p.status !== 'SOLVED' && (
                  <button
                    onClick={e => handleStatus(e, p.id, p.status === 'UNSOLVED' ? 'IN_PROGRESS' : 'SOLVED')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                  >
                    {p.status === 'UNSOLVED' ? '진행' : '해결'}
                  </button>
                )}
                <button
                  onClick={e => handleDelete(e, p.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
