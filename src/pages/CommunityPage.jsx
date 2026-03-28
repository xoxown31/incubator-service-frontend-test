import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicProblems } from '../api/community'
import Layout from '../components/Layout'

const CATEGORY_LABEL = { DAILY: '일상', WORK: '업무', STUDY: '학습', CREATIVE: '창의', OTHER: '기타' }
const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }
const STATUS_COLOR = {
  UNSOLVED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  SOLVED: 'bg-green-100 text-green-700',
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])
  const [keyword, setKeyword] = useState('')
  const [input, setInput] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getPublicProblems(keyword, page)
      setProblems(data.data.content)
      setTotalPages(data.data.totalPages)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [keyword, page])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setKeyword(input.trim())
  }

  const fmt = (dt) => new Date(dt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

  return (
    <Layout>
      <div>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="문제 검색..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            검색
          </button>
          {keyword && (
            <button type="button" onClick={() => { setKeyword(''); setInput(''); setPage(0) }} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
              초기화
            </button>
          )}
        </form>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">공개된 문제가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {problems.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/problems/${p.id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{CATEGORY_LABEL[p.category] ?? p.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{p.title}</h3>
                    {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{fmt(p.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              이전
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
