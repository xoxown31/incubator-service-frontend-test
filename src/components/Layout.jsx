import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api/auth'

const NAV = [
  { path: '/',          label: '홈' },
  { path: '/problems',  label: '내 문제' },
  { path: '/community', label: '커뮤니티' },
  { path: '/minigame',  label: '타자 게임' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isAdmin = localStorage.getItem('role') === 'ADMIN'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="text-lg font-bold text-indigo-600">
              Incubator
            </button>
            <nav className="hidden sm:flex items-center gap-1">
              {NAV.map(n => (
                <button
                  key={n.path}
                  onClick={() => navigate(n.path)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === n.path
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100"
              >
                관리자
              </button>
            )}
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 하단 탭바 */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10">
        <div className="flex">
          {NAV.map(n => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                pathname === n.path ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-20 sm:pb-6">
        {children}
      </main>
    </div>
  )
}
