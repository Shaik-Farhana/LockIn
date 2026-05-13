import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import StarryBg from './components/StarryBg'
import TopNav from './components/TopNav'
import Home from './pages/Home'
import Login from './pages/Login'
import TopicPicker from './pages/TopicPicker'
import StudyMode from './pages/StudyMode'
import SpeakMode from './pages/SpeakMode'
import SessionComplete from './pages/SessionComplete'
import Progress from './pages/Progress'

function AuthGuard({ children }) {
  const { user, authLoading } = useApp()
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="font-editorial italic text-gold text-2xl animate-pulse">Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <div className="relative min-h-screen">
      <StarryBg />
      <TopNav />
      <main className="relative z-10">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/topics" element={<AuthGuard><TopicPicker /></AuthGuard>} />
          <Route path="/study" element={<AuthGuard><StudyMode /></AuthGuard>} />
          <Route path="/speak" element={<AuthGuard><SpeakMode /></AuthGuard>} />
          <Route path="/session-complete" element={<AuthGuard><SessionComplete /></AuthGuard>} />
          <Route path="/progress" element={<AuthGuard><Progress /></AuthGuard>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}