import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ProblemsPage from './pages/ProblemsPage'
import ProblemDetailPage from './pages/ProblemDetailPage'
import CommunityPage from './pages/CommunityPage'
import MinigamePage from './pages/MinigamePage'

function PrivateRoute({ children }) {
  return localStorage.getItem('accessToken') ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/problems/:id" element={<PrivateRoute><ProblemDetailPage /></PrivateRoute>} />
        <Route path="/problems" element={<PrivateRoute><ProblemsPage /></PrivateRoute>} />
        <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
        <Route path="/minigame" element={<PrivateRoute><MinigamePage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
