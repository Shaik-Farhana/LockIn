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

  const uploadSessionAudio = async (audioBlob) => {
    if (!audioBlob || !user) return { audioPath: null, audioUrl: null }

    const audioPath = `${user.id}/${Date.now()}.webm`
    const { error: uploadError } = await supabase.storage
      .from('session-audio')
      .upload(audioPath, audioBlob, { contentType: audioBlob.type || 'audio/webm', upsert: false })

    if (uploadError) {
      console.warn('Audio upload failed:', uploadError)
      return { audioPath: null, audioUrl: null }
    }

    const { data: urlData } = supabase.storage
      .from('session-audio')
      .getPublicUrl(audioPath)

    return {
      audioPath,
      audioUrl: urlData?.publicUrl || null,
    }
  }

  // Called from SessionComplete with full session data
  const saveSession = async ({ audioBlob, note, topic, topicTitle, aiResult, transcript, durationSeconds = 300 }) => {
    if (!user) return null

    const resolvedTopicTitle = topic?.title || topicTitle || 'Communication practice'
    let audioUrl = null
    let audioPath = null
    let resolvedTranscript = transcript || ''
    let resolvedAnalysis = aiResult || null

    if (audioBlob) {
      const uploaded = await uploadSessionAudio(audioBlob)
      audioPath = uploaded.audioPath
      audioUrl = uploaded.audioUrl

      if (audioPath) {
        try {
        const response = await fetch('/api/analyze-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            topic: {
              title: resolvedTopicTitle,
              difficulty: topic?.difficulty || 'unknown',
            },
            audioPath,
            durationSeconds,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        })

        if (response.ok) {
          const payload = await response.json()
          if (payload?.transcript) resolvedTranscript = payload.transcript
          if (payload?.analysis) resolvedAnalysis = payload.analysis
          if (payload?.audioUrl) audioUrl = payload.audioUrl
        }
        } catch (err) {
          console.warn('Server analysis unavailable, using local session data:', err)
        }
      }
    }

    // Save session record
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        topic: resolvedTopicTitle,
        note: note || null,
        audio_url: audioUrl,
        transcript: resolvedTranscript || null,
        ai_score: resolvedAnalysis?.score || null,
        ai_clarity: resolvedAnalysis?.clarity || null,
        ai_confidence: resolvedAnalysis?.confidence || null,
        ai_filler_count: resolvedAnalysis?.filler_count || null,
        ai_feedback: resolvedAnalysis?.feedback || null,
        ai_strengths: resolvedAnalysis?.strengths || null,
        ai_improvements: resolvedAnalysis?.improvements || null,
        ai_structure: resolvedAnalysis?.structure || null,
        ai_vocabulary: resolvedAnalysis?.vocabulary || null,
        ai_pacing: resolvedAnalysis?.pacing || null,
      })
      .select()
      .single()

    if (sessionError) {
      throw sessionError
    }

    // Update stats
    const newSessions = sessions + 1
    const newStreak = streak + 1
    const newAvg = resolvedAnalysis?.score != null
      ? avgScore === 0 ? resolvedAnalysis.score : ((avgScore * sessions + resolvedAnalysis.score) / newSessions)
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
    return {
      id: sessionData?.id || null,
      transcript: resolvedTranscript,
      analysis: resolvedAnalysis,
      audioUrl,
      audioPath,
    }
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
