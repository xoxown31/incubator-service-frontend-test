import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProblems } from '../api/problems'
import Layout from '../components/Layout'

const STATUS_LABEL = { UNSOLVED: '미해결', IN_PROGRESS: '진행중', SOLVED: '해결됨' }
const STATUS_COLOR = {
  UNSOLVED: 'text-gray-500',
  IN_PROGRESS: 'text-yellow-600',
  SOLVED: 'text-green-600',
}

export default function HomePage() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])

  useEffect(() => {
    getMyProblems().then(r => setProblems(r.data.data)).catch(() => navigate('/login'))
  }, [])

  const counts = {
    total: problems.length,
    unsolved: problems.filter(p => p.status === 'UNSOLVED').length,
    inProgress: problems.filter(p => p.status === 'IN_PROGRESS').length,
    solved: problems.filter(p => p.status === 'SOLVED').length,
  }

  const recent = problems.slice(0, 5)

  return (
    <Layout>
      <div className="space-y-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '전체', value: counts.total, color: 'text-gray-900' },
            { label: '미해결', value: counts.unsolved, color: 'text-gray-500' },
            { label: '진행중', value: counts.inProgress, color: 'text-yellow-600' },
            { label: '해결됨', value: counts.solved, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 바로가기 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '문제 등록', icon: '＋', path: '/problems', state: { openForm: true } },
            { label: '커뮤니티', icon: '🌐', path: '/community' },
            { label: '타자 게임', icon: '⌨', path: '/minigame' },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => navigate(s.path, s.state ? { state: s.state } : undefined)}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center hover:shadow-md transition-shadow"
            >
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-xs font-medium text-gray-600">{s.label}</p>
            </button>
          ))}
        </div>

        {/* 최근 문제 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">최근 문제</h2>
            <button onClick={() => navigate('/problems')} className="text-xs text-indigo-600 hover:underline">
              전체보기
            </button>
          </div>
          {recent.length === 0
            ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                <p className="text-gray-400 text-sm">아직 등록한 문제가 없습니다.</p>
                <button
                  onClick={() => navigate('/problems', { state: { openForm: true } })}
                  className="mt-3 text-sm text-indigo-600 font-medium hover:underline"
                >
                  첫 문제 등록하기
                </button>
              </div>
            )
            : (
              <div className="space-y-2">
                {recent.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/problems/${p.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <span className="text-sm font-medium text-gray-800 truncate mr-3">{p.title}</span>
                    <span className={`text-xs font-medium shrink-0 ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </Layout>
  )
}
