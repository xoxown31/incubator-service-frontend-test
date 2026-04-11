import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { fetchUsers, updateUserRole, deleteUser } from '../../api/admin'

export default function AdminUsersPage() {
  const [page, setPage] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetchUsers({ keyword, page: current, size: 20 })
      .then(setPage)
      .catch(e => setError(e.response?.data?.message || '불러오기 실패'))
  }, [keyword, current])

  useEffect(() => { load() }, [load])

  const handleRoleToggle = async (u) => {
    const next = u.role === 'ADMIN' ? 'USER' : 'ADMIN'
    if (!confirm(`${u.nickname}의 권한을 ${next}로 변경할까?`)) return
    try {
      await updateUserRole(u.id, next)
      load()
    } catch (e) {
      alert(e.response?.data?.message || '변경 실패')
    }
  }

  const handleDelete = async (u) => {
    if (!confirm(`${u.nickname} 사용자를 정말 삭제할까? (되돌릴 수 없음)`)) return
    try {
      await deleteUser(u.id)
      load()
    } catch (e) {
      alert(e.response?.data?.message || '삭제 실패')
    }
  }

  return (
    <AdminLayout title="사용자 관리">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="이메일/닉네임 검색"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (setCurrent(0), load())}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => { setCurrent(0); load() }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
        >
          검색
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">이메일</th>
              <th className="text-left px-4 py-3">닉네임</th>
              <th className="text-left px-4 py-3">권한</th>
              <th className="text-left px-4 py-3">FCM</th>
              <th className="text-left px-4 py-3">가입일</th>
              <th className="text-right px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {page?.content?.map(u => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">{u.id}</td>
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-900">{u.nickname}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.hasFcmToken ? '등록됨' : '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => handleRoleToggle(u)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    권한 변경
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {page?.content?.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400 text-sm">결과 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {page && page.totalPages > 1 && (
        <Pagination page={page} current={current} onChange={setCurrent} />
      )}
    </AdminLayout>
  )
}

function Pagination({ page, current, onChange }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        disabled={current === 0}
        onClick={() => onChange(current - 1)}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded disabled:opacity-40"
      >
        이전
      </button>
      <span className="text-xs text-gray-500">
        {current + 1} / {page.totalPages}
      </span>
      <button
        disabled={current + 1 >= page.totalPages}
        onClick={() => onChange(current + 1)}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded disabled:opacity-40"
      >
        다음
      </button>
    </div>
  )
}
