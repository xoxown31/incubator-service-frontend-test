import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProblems, createProblem, updateProblemStatus, deleteProblem } from '../api/problems'
import { logout } from '../api/auth'

const CATEGORIES = ['DAILY', 'WORK', 'STUDY', 'CREATIVE', 'OTHER']
const CATEGORY_LABEL = { DAILY: '일상', WORK: '업무', STUDY: '학습', CREATIVE: '창의', OTHER: '기타' }
const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }
const STATUS_COLOR = {
  UNSOLVED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  SOLVED: 'bg-green-100 text-green-700',
}

export default function HomePage() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'DAILY', isPublic: false })

  const load = async () => {
    try {
      const { data } = await getMyProblems(statusFilter || undefined)
      setProblems(data.data)
    } catch {
      navigate('/login')
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createProblem(form)
    setShowForm(false)
    setForm({ title: '', description: '', category: 'DAILY', isPublic: false })
    load()
  }

  const handleStatus = async (id, status) => {
    await updateProblemStatus(id, status)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteProblem(id)
    load()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600">Incubator</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/community')} className="text-sm text-gray-500 hover:text-gray-700">커뮤니티</button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">로그아웃</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + 문제 등록
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">새 문제 등록</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                placeholder="제목"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <textarea
                placeholder="설명 (선택)"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
              />
              <div className="flex gap-3">
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  공개
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  등록
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {problems.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">등록된 문제가 없습니다.</div>
          )}
          {problems.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/problems/${p.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{CATEGORY_LABEL[p.category]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{p.title}</h3>
                  {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                </div>
                <div className="flex gap-1 ml-3" onClick={e => e.stopPropagation()}>
                  {p.status !== 'SOLVED' && (
                    <button
                      onClick={() => handleStatus(p.id, p.status === 'UNSOLVED' ? 'IN_PROGRESS' : 'SOLVED')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                    >
                      {p.status === 'UNSOLVED' ? '진행' : '해결'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
