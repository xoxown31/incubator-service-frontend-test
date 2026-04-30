import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicProblems, getPopularProblems, getTopUsers } from '../api/community'
import Layout from '../components/Layout'

const CATEGORY_LABEL = { DAILY: '일상', WORK: '업무', STUDY: '학습', CREATIVE: '창의', OTHER: '기타' }
const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }
const STATUS_COLOR = {
  UNSOLVED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  SOLVED: 'bg-green-100 text-green-700',
}
const RANK_COLOR = ['text-yellow-500', 'text-gray-400', 'text-amber-600']

export default function CommunityPage() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])
  const [keyword, setKeyword] = useState('')
  const [input, setInput] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [popular, setPopular] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [tab, setTab] = useState('feed') // feed | popular | users

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getPublicProblems(keyword, page)
      setProblems(data.data.content)
      setTotalPages(data.data.totalPages)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [keyword, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getPopularProblems().then(r => setPopular(r.data.data || [])).catch(() => {})
    getTopUsers().then(r => setTopUsers(r.data.data || [])).catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setKeyword(input.trim())
  }

  const fmt = (dt) => new Date(dt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

  return (
    <Layout>
      <div className="space-y-4">
        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[['feed', '전체 피드'], ['popular', '🔥 이번 주 인기'], ['users', '🏆 유명 사용자']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 전체 피드 */}
        {tab === 'feed' && (
          <>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="문제 검색..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                검색
              </button>
              {keyword && (
                <button type="button" onClick={() => { setKeyword(''); setInput(''); setPage(0) }}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
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
                  <div key={p.id} onClick={() => navigate(`/problems/${p.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
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
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">{fmt(p.createdAt)}</p>
                        {p.likeCount > 0 && <p className="text-xs text-indigo-500 mt-0.5">♥ {p.likeCount}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  이전
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600">{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {/* 이번 주 인기 */}
        {tab === 'popular' && (
          <div className="space-y-3">
            {popular.length === 0
              ? <div className="text-center py-16 text-gray-400 text-sm">이번 주 활동이 없습니다.</div>
              : popular.map((p, i) => (
                <div key={p.id} onClick={() => navigate(`/problems/${p.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
                >
                  <span className={`text-lg font-bold w-6 text-center ${RANK_COLOR[i] ?? 'text-gray-300'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-gray-400">{CATEGORY_LABEL[p.category]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{p.title}</p>
                  </div>
                  {p.likeCount > 0 && <span className="text-xs text-indigo-500 shrink-0">♥ {p.likeCount}</span>}
                </div>
              ))
            }
          </div>
        )}

        {/* 유명 사용자 */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {topUsers.length === 0
              ? <div className="text-center py-16 text-gray-400 text-sm">데이터가 없습니다.</div>
              : topUsers.map((u, i) => (
                <div key={u.userId} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0">
                  <span className={`text-base font-bold w-6 text-center ${RANK_COLOR[i] ?? 'text-gray-300'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{u.nickname}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      해결 {u.solvedCount}문제 · 받은 좋아요 {u.totalPostLikes}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{u.score}점</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </Layout>
  )
}
