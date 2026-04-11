import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { fetchPosts, deletePost } from '../../api/admin'

export default function AdminPostsPage() {
  const [page, setPage] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetchPosts({ keyword, page: current, size: 20 })
      .then(setPage)
      .catch(e => setError(e.response?.data?.message || '불러오기 실패'))
  }, [keyword, current])

  useEffect(() => { load() }, [load])

  const handleDelete = async (p) => {
    if (!confirm(`"${p.title}" 게시글을 정말 삭제할까?`)) return
    try {
      await deletePost(p.id)
      load()
    } catch (e) {
      alert(e.response?.data?.message || '삭제 실패')
    }
  }

  return (
    <AdminLayout title="게시글 관리">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="제목 검색"
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
              <th className="text-left px-4 py-3">제목</th>
              <th className="text-left px-4 py-3">카테고리</th>
              <th className="text-left px-4 py-3">작성자</th>
              <th className="text-left px-4 py-3">문제</th>
              <th className="text-left px-4 py-3">조회/좋아요</th>
              <th className="text-left px-4 py-3">생성일</th>
              <th className="text-right px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {page?.content?.map(p => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">{p.id}</td>
                <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate">{p.title}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.category}</td>
                <td className="px-4 py-3 text-gray-600">{p.userNickname}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{p.problemTitle}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.viewCount} / {p.likeCount}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(p)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {page?.content?.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-400 text-sm">결과 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {page && page.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={current === 0}
            onClick={() => setCurrent(current - 1)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-xs text-gray-500">{current + 1} / {page.totalPages}</span>
          <button
            disabled={current + 1 >= page.totalPages}
            onClick={() => setCurrent(current + 1)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </AdminLayout>
  )
}
