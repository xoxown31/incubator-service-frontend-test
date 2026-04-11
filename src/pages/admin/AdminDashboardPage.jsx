import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { fetchStats } from '../../api/admin'

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(e => setError(e.response?.data?.message || '통계를 불러오지 못했습니다.'))
  }, [])

  return (
    <AdminLayout title="대시보드">
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {!stats ? (
        <p className="text-gray-400 text-sm">불러오는 중…</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="전체 사용자"     value={stats.totalUsers} />
          <StatCard label="전체 문제"       value={stats.totalProblems} />
          <StatCard label="전체 게시글"     value={stats.totalPosts} />
          <StatCard label="정답 양식"       value={stats.totalAnswerTemplates} />
          <StatCard label="UNSOLVED"       value={stats.unsolvedProblems}   accent="text-gray-600" />
          <StatCard label="IN_PROGRESS"    value={stats.inProgressProblems} accent="text-amber-600" />
          <StatCard label="SOLVED"         value={stats.solvedProblems}     accent="text-emerald-600" />
        </div>
      )}
    </AdminLayout>
  )
}
