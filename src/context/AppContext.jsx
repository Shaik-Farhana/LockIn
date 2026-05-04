import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('ds_streak') || '0'))
  const [sessions, setSessions] = useState(() => parseInt(localStorage.getItem('ds_sessions') || '0'))
  const [avgScore, setAvgScore] = useState(() => parseFloat(localStorage.getItem('ds_avg_score') || '0'))
  const [currentTopic, setCurrentTopic] = useState(null)
  const [currentTab, setCurrentTab] = useState('daily')
  const [mode, setMode] = useState(() => localStorage.getItem('ds_mode') || 'night')

  const toggleMode = () => {
    const next = mode === 'night' ? 'golden' : 'night'
    setMode(next)
    localStorage.setItem('ds_mode', next)
  }

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
    <AppContext.Provider value={{
      streak, sessions, avgScore,
      currentTopic, setCurrentTopic,
      currentTab, setCurrentTab,
      mode, toggleMode,
      incrementSession,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
