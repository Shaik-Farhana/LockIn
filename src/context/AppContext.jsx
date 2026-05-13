import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [sessions, setSessions] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [sessionHistory, setSessionHistory] = useState([])
  const [currentTopic, setCurrentTopic] = useState(null)
  const [currentTab, setCurrentTab] = useState('daily')
  const [mode, setMode] = useState(() => localStorage.getItem('lockin_mode') || 'night')

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data when user changes
  useEffect(() => {
    if (user) loadUserData(user.id)
    else {
      setStreak(0); setSessions(0); setAvgScore(0); setSessionHistory([])
    }
  }, [user])

  const loadUserData = async (userId) => {
    // Load stats
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (stats) {
      setStreak(stats.streak || 0)
      setSessions(stats.sessions || 0)
      setAvgScore(stats.avg_score || 0)
    } else if (error?.code === 'PGRST116') {
      // First time user — create row
      await supabase.from('user_stats').insert({
        user_id: userId, streak: 0, sessions: 0, avg_score: 0
      })
    }

    // Load session history
    const { data: history } = await supabase
      .from('sessions')
      .select('id, topic, created_at, ai_score, ai_clarity, ai_confidence, ai_filler_count, ai_feedback, ai_strengths, ai_improvements, audio_url, note')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (history) setSessionHistory(history)
  }

  const toggleMode = () => {
    const next = mode === 'night' ? 'golden' : 'night'
    setMode(next)
    localStorage.setItem('lockin_mode', next)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUpWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Called from SessionComplete with full session data
  const saveSession = async ({ audioBlob, note, topicTitle, aiResult, transcript }) => {
    if (!user) return null

    let audioUrl = null

    // Upload audio to Supabase Storage
    if (audioBlob) {
      const fileName = `${user.id}/${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('session-audio')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('session-audio')
          .getPublicUrl(fileName)
        audioUrl = urlData.publicUrl
      }
    }

    // Save session record
    const { data: sessionData } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        topic: topicTitle,
        note: note || null,
        audio_url: audioUrl,
        transcript: transcript || null,
        ai_score: aiResult?.score || null,
        ai_clarity: aiResult?.clarity || null,
        ai_confidence: aiResult?.confidence || null,
        ai_filler_count: aiResult?.filler_count || null,
        ai_feedback: aiResult?.feedback || null,
        ai_strengths: aiResult?.strengths || null,
        ai_improvements: aiResult?.improvements || null,
        ai_structure: aiResult?.structure || null,
        ai_vocabulary: aiResult?.vocabulary || null,
        ai_pacing: aiResult?.pacing || null,
      })
      .select()
      .single()

    // Update stats
    const newSessions = sessions + 1
    const newStreak = streak + 1
    const newAvg = aiResult?.score
      ? avgScore === 0 ? aiResult.score : ((avgScore * sessions + aiResult.score) / newSessions)
      : avgScore
    const roundedAvg = Math.round(newAvg * 10) / 10

    setSessions(newSessions)
    setStreak(newStreak)
    setAvgScore(roundedAvg)

    await supabase.from('user_stats').update({
      sessions: newSessions,
      streak: newStreak,
      avg_score: roundedAvg,
      last_session: new Date().toISOString(),
    }).eq('user_id', user.id)

    await loadUserData(user.id)
    return sessionData?.id
  }

  // Offline fallback (no auth)
  const incrementSession = () => {
    setSessions(s => s + 1)
    setStreak(s => s + 1)
  }

  return (
    <AppContext.Provider value={{
      user, authLoading,
      streak, sessions, avgScore, sessionHistory,
      currentTopic, setCurrentTopic,
      currentTab, setCurrentTab,
      mode, toggleMode,
      signInWithGoogle, signInWithEmail, signUpWithEmail, signOut,
      saveSession, incrementSession,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)