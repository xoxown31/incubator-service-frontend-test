import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { fetchMiniGames, createMiniGame, updateMiniGame, deleteMiniGame } from '../../api/admin'

const DIFFICULTY_LABEL = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' }
const DIFFICULTIES = ['EASY', 'NORMAL', 'HARD']

const EMPTY = { name: '', description: '', difficulty: 'NORMAL', avgDuration: '' }

export default function AdminMinigamesPage() {
  const [games, setGames] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null) // game id being edited
  const [error, setError] = useState('')

  const load = () => {
    fetchMiniGames()
      .then(setGames)
      .catch(e => setError(e.response?.data?.message || '불러오기 실패'))
  }

  useEffect(() => { load() }, [])

  const resetForm = () => { setForm(EMPTY); setEditing(null) }

  const handleEdit = (g) => {
    setEditing(g.id)
    setForm({ name: g.name, description: g.description || '', difficulty: g.difficulty, avgDuration: g.avgDuration ?? '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      description: form.description || null,
      difficulty: form.difficulty,
      avgDuration: form.avgDuration !== '' ? Number(form.avgDuration) : null,
    }
    try {
      if (editing) {
        await updateMiniGame(editing, payload)
      } else {
        await createMiniGame(payload)
      }
      resetForm()
      load()
    } catch (e) {
      setError(e.response?.data?.message || '저장 실패')
    }
  }

  const handleDelete = async (g) => {
    if (!confirm(`"${g.name}" 게임을 삭제할까? (기록도 모두 삭제됩니다)`)) return
    try {
      await deleteMiniGame(g.id)
      load()
    } catch (e) {
      setError(e.response?.data?.message || '삭제 실패')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">미니게임 관리</h1>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* 등록/수정 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">{editing ? '게임 수정' : '게임 등록'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="게임 이름"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <select
              value={form.difficulty}
              onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {DIFFICULTIES.map(d => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}
            </select>
          </div>
          <input
            placeholder="설명 (선택)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="number"
            min="1"
            placeholder="평균 소요 시간(초, 선택)"
            value={form.avgDuration}
            onChange={e => setForm(f => ({ ...f, avgDuration: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium">
              {editing ? '수정 완료' : '등록'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200">
                취소
              </button>
            )}
          </div>
        </form>

        {/* 게임 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">이름</th>
                <th className="px-4 py-3 text-left">난이도</th>
                <th className="px-4 py-3 text-left">평균시간</th>
                <th className="px-4 py-3 text-left">설명</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {games.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">등록된 게임이 없습니다.</td></tr>
              )}
              {games.map(g => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                  <td className="px-4 py-3 text-gray-600">{DIFFICULTY_LABEL[g.difficulty]}</td>
                  <td className="px-4 py-3 text-gray-500">{g.avgDuration ? `${g.avgDuration}초` : '-'}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{g.description || '-'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => handleEdit(g)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium mr-3">수정</button>
                    <button onClick={() => handleDelete(g)} className="text-red-500 hover:text-red-700 text-xs font-medium">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
