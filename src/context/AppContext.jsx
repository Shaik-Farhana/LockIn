import { createContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

function getOrCreateUserId() {
  const key = 'ds_user_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const created = crypto.randomUUID()
  localStorage.setItem(key, created)
  return created
}

export function AppProvider({ children }) {
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('ds_streak') || '0'))
  const [sessions, setSessions] = useState(() => parseInt(localStorage.getItem('ds_sessions') || '0'))
  const [avgScore, setAvgScore] = useState(() => parseFloat(localStorage.getItem('ds_avg_score') || '0'))
  const [currentTopic, setCurrentTopic] = useState(null)
  const [currentTab, setCurrentTab] = useState('daily')
  const [mode, setMode] = useState(() => localStorage.getItem('ds_mode') || 'night')
  const [userId] = useState(() => getOrCreateUserId())
  const [latestReview, setLatestReview] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [cloudConnected, setCloudConnected] = useState(false)

  const toggleMode = () => {
    const next = mode === 'night' ? 'golden' : 'night'
    setMode(next)
    localStorage.setItem('ds_mode', next)
  }

  const refreshCloudProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`)
      if (!response.ok) return
      const payload = await response.json()
      const stats = payload?.stats
      if (!stats) return

      setCloudConnected(true)
      setRecentSessions(payload.recent || [])
      setSessions(stats.totalSessions || 0)
      setStreak(stats.streak || 0)
      setAvgScore(stats.avgScore || 0)

      localStorage.setItem('ds_sessions', stats.totalSessions || 0)
      localStorage.setItem('ds_streak', stats.streak || 0)
      localStorage.setItem('ds_avg_score', stats.avgScore || 0)
    } catch {
      // Keep local-only mode if backend is not configured yet.
    }
  }, [userId])

  const incrementSession = (score = null) => {
    const newSessions = sessions + 1
    setSessions(newSessions)
    localStorage.setItem('ds_sessions', newSessions)
    const newStreak = streak + 1
    setStreak(newStreak)
    localStorage.setItem('ds_streak', newStreak)
    if (score !== null) {
      const newAvg = avgScore === 0 ? score : ((avgScore * sessions + score) / newSessions)
      const rounded = Math.round(newAvg * 10) / 10
      setAvgScore(rounded)
      localStorage.setItem('ds_avg_score', rounded)
    }
  }

  return (
    <AppContext.Provider
      value={{
        streak,
        sessions,
        avgScore,
        currentTopic,
        setCurrentTopic,
        currentTab,
        setCurrentTab,
        mode,
        toggleMode,
        userId,
        cloudConnected,
        latestReview,
        setLatestReview,
        recentSessions,
        setRecentSessions,
        refreshCloudProgress,
        incrementSession,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export { AppContext }
