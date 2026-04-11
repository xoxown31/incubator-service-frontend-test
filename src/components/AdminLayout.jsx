import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api/auth'

const ADMIN_NAV = [
  { path: '/admin',                  label: '대시보드' },
  { path: '/admin/users',            label: '사용자' },
  { path: '/admin/problems',         label: '문제' },
  { path: '/admin/posts',            label: '게시글' },
  { path: '/admin/answer-templates', label: '정답 양식' },
]

export default function AdminLayout({ children, title }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const nickname = localStorage.getItem('nickname') || ''

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <span className="text-lg font-bold text-indigo-600">Synapse Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_NAV.map(n => {
            const active = n.path === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(n.path)
            return (
              <button
                key={n.path}
                onClick={() => navigate(n.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {n.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-gray-100 p-3 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
          >
            ← 서비스로 돌아가기
          </button>
          <div className="px-3 py-2 text-xs text-gray-400">
            로그인: <span className="text-gray-600 font-medium">{nickname}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6">
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
