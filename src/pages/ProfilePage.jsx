import { useState, useEffect } from 'react'
import { getMe, updateMe } from '../api/user'
import { getMyProblems } from '../api/problems'
import Layout from '../components/Layout'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [problems, setProblems] = useState([])
  const [nicknameInput, setNicknameInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [userRes, probRes] = await Promise.all([getMe(), getMyProblems()])
      setUser(userRes.data.data)
      setNicknameInput(userRes.data.data.nickname)
      setProblems(probRes.data.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!nicknameInput.trim()) return
    setSaving(true)
    try {
      await updateMe(nicknameInput.trim())
      localStorage.setItem('nickname', nicknameInput.trim())
      setEditing(false)
      load()
    } catch (e) {
      setError(e.response?.data?.message || '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const solved = problems.filter(p => p.status === 'SOLVED').length
  const inProgress = problems.filter(p => p.status === 'IN_PROGRESS').length
  const unsolved = problems.filter(p => p.status === 'UNSOLVED').length

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">내 프로필</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                닉네임 수정
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">이메일</p>
              <p className="text-sm text-gray-700">{user.email}</p>
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-2">
                <p className="text-xs text-gray-400">닉네임</p>
                <input
                  value={nicknameInput}
                  onChange={e => setNicknameInput(e.target.value)}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50">
                    저장
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setError('') }}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">닉네임</p>
                <p className="text-sm text-gray-700">{user.nickname}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 mb-0.5">권한</p>
              <p className="text-sm text-gray-700">{user.role === 'ADMIN' ? '관리자' : '일반 사용자'}</p>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '전체', value: problems.length, color: 'text-gray-900' },
            { label: '해결됨', value: solved, color: 'text-green-600' },
            { label: '진행중', value: inProgress, color: 'text-yellow-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
