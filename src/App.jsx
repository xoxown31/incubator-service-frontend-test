import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ProblemsPage from './pages/ProblemsPage'
import ProblemDetailPage from './pages/ProblemDetailPage'
import CommunityPage from './pages/CommunityPage'
import MinigamePage from './pages/MinigamePage'
import PostDetailPage from './pages/PostDetailPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminProblemsPage from './pages/admin/AdminProblemsPage'
import AdminPostsPage from './pages/admin/AdminPostsPage'
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage'
import AdminMinigamesPage from './pages/admin/AdminMinigamesPage'

function PrivateRoute({ children }) {
  return localStorage.getItem('accessToken') ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('accessToken')
  const role  = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  if (role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/problems/:id" element={<PrivateRoute><ProblemDetailPage /></PrivateRoute>} />
        <Route path="/problems/:id/posts/:postId" element={<PrivateRoute><PostDetailPage /></PrivateRoute>} />
        <Route path="/problems" element={<PrivateRoute><ProblemsPage /></PrivateRoute>} />
        <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
        <Route path="/minigame" element={<PrivateRoute><MinigamePage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin"                  element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users"            element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/problems"         element={<AdminRoute><AdminProblemsPage /></AdminRoute>} />
        <Route path="/admin/posts"            element={<AdminRoute><AdminPostsPage /></AdminRoute>} />
        <Route path="/admin/answer-templates" element={<AdminRoute><AdminTemplatesPage /></AdminRoute>} />
        <Route path="/admin/minigames"        element={<AdminRoute><AdminMinigamesPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
