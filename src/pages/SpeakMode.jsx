import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import CDPlayer from '../components/CDPlayer'
import { hasSupabaseClient, supabase } from '../lib/supabaseClient'

const SPEAK_DURATION = 5 * 60
const TIPS = [
  'Start with your main argument in one sentence',
  'Use a real-world example to support it',
  'Address the strongest counterargument',
  'Pause after key points; silence creates confidence',
  'End with a clear conclusion',
]

function playFinishSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const notes = [520, 740, 980]

  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = ctx.currentTime + index * 0.14

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.15)
  })
}

export default function SpeakMode() {
  const navigate = useNavigate()
  const { currentTopic, incrementSession, userId, setLatestReview, refreshCloudProgress } = useApp()
  const [timeLeft, setTimeLeft] = useState(SPEAK_DURATION)
  const [recording, setRecording] = useState(false)
  const [started, setStarted] = useState(false)
  const [bars, setBars] = useState(Array(20).fill(4))
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const intervalRef = useRef(null)
  const waveRef = useRef(null)
  const mediaRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const soundPlayedRef = useRef(false)

  useEffect(() => {
    if (!currentTopic) navigate('/topics')
  }, [currentTopic, navigate])

  const stopRecording = useCallback(() => {
    setRecording(false)
    clearInterval(intervalRef.current)
    clearInterval(waveRef.current)
    setBars(Array(20).fill(4))

    try {
      if (mediaRef.current?.state !== 'inactive') mediaRef.current?.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
    } catch {
      // Recorder may already be stopped.
    }
  }, [])

  useEffect(() => {
    if (recording && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000)
      waveRef.current = setInterval(() => {
        setBars(Array(20).fill(0).map(() => Math.floor(Math.random() * 32) + 4))
      }, 100)
    }

    if (timeLeft === 0 && !soundPlayedRef.current) {
      soundPlayedRef.current = true
      stopRecording()
      playFinishSound()
    }

    return () => {
      clearInterval(intervalRef.current)
      clearInterval(waveRef.current)
    }
  }, [recording, timeLeft, stopRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      streamRef.current = stream

      recorder.ondataavailable = (event) => chunksRef.current.push(event.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioURL(URL.createObjectURL(blob))
      }

      recorder.start()
      mediaRef.current = recorder
      soundPlayedRef.current = false
      setSaveError('')
      setRecording(true)
      setStarted(true)
    } catch {
      setRecording(false)
      setStarted(false)
    }
  }

  const uploadAndAnalyze = async (blob) => {
    if (!hasSupabaseClient()) {
      throw new Error('Supabase client is not configured.')
    }

    const uploadRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        mimeType: blob.type || 'audio/webm',
      }),
    })

    if (!uploadRes.ok) {
      const payload = await uploadRes.json().catch(() => ({}))
      throw new Error(payload.error || 'Failed to create upload URL.')
    }

    const uploadPayload = await uploadRes.json()
    const { error: uploadError } = await supabase.storage
      .from(uploadPayload.bucket)
      .uploadToSignedUrl(
        uploadPayload.path,
        uploadPayload.token,
        blob,
        { contentType: blob.type || 'audio/webm' }
      )

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const analyzeRes = await fetch('/api/analyze-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        topic: currentTopic,
        audioPath: uploadPayload.path,
        mimeType: blob.type || 'audio/webm',
        durationSeconds: SPEAK_DURATION - timeLeft,
      }),
    })

    if (!analyzeRes.ok) {
      const payload = await analyzeRes.json().catch(() => ({}))
      throw new Error(payload.error || 'Failed to analyze recording.')
    }

    return analyzeRes.json()
  }

  const handleFinish = async () => {
    if (saving) return
    stopRecording()
    setSaving(true)
    setSaveError('')

    try {
      let score = null
      if (audioBlob) {
        const result = await uploadAndAnalyze(audioBlob)
        if (result?.analysis) {
          setLatestReview({
            ...result.analysis,
            transcript: result.transcript || '',
            audioUrl: result.audioUrl || null,
            topicTitle: currentTopic?.title || '',
          })
          score = Number(result.analysis?.scores?.overall || 0)
        }
      } else {
        setLatestReview(null)
      }

      incrementSession(score || null)
      await refreshCloudProgress()
      navigate('/session-complete')
    } catch (error) {
      setSaveError(error.message || 'Could not save this recording to cloud.')
      incrementSession()
      navigate('/session-complete')
    } finally {
      setSaving(false)
    }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const progress = 1 - timeLeft / SPEAK_DURATION
  const circumference = 2 * Math.PI * 86
  const isFinished = timeLeft === 0

  if (!currentTopic) return null

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/study')} className="font-sans text-sm text-night-light hover:text-paper transition-colors">
            Back
          </button>
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
            {recording && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse block" />}
            <span className={recording ? 'text-red-300' : 'text-night-light'}>{recording ? 'Recording' : 'Speak Mode'}</span>
          </div>
          <div className="w-12" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] items-start">
          <aside className="glass rounded-3xl p-6 md:p-8 lg:sticky lg:top-28">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <svg width="250" height="250" viewBox="0 0 210 210" className="max-w-full">
                  <circle cx="105" cy="105" r="86" fill="none" stroke="rgba(108,158,179,0.2)" strokeWidth="8" />
                  <circle
                    cx="105"
                    cy="105"
                    r="86"
                    fill="none"
                    stroke={recording ? '#FFC52D' : 'rgba(108,158,179,0.35)'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    transform="rotate(-90 105 105)"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: recording ? 'drop-shadow(0 0 10px rgba(255,197,45,0.55))' : 'none' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-7xl text-paper tracking-widest leading-none">{mins}:{secs}</div>
                  <div className="font-mono text-xs text-night-light mt-3 uppercase tracking-widest">speak time</div>
                </div>
              </div>

              <div className="w-full glass-light rounded-2xl p-4 mb-5">
                <div className="flex items-end justify-center gap-1 h-16 mb-3">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all"
                      style={{
                        width: '5px',
                        height: `${h}px`,
                        background: recording
                          ? `rgba(252, 233, 151, ${0.4 + (h / 36) * 0.6})`
                          : 'rgba(108, 158, 179, 0.25)',
                        transitionDuration: recording ? '100ms' : '300ms',
                        boxShadow: recording ? `0 0 4px rgba(252,233,151,${h / 60})` : 'none',
                      }}
                    />
                  ))}
                </div>
                <div
                  className="font-mono text-xs text-center tracking-widest"
                  style={{ color: recording ? 'rgba(252,233,151,0.8)' : 'rgba(108,158,179,0.55)' }}
                >
                  {recording ? 'RECORDING IN PROGRESS' : started ? 'PAUSED' : 'READY TO RECORD'}
                </div>
              </div>

              {!started ? (
                <button onClick={startRecording} className="btn-glass w-full justify-center text-base py-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold block" />
                  Start Recording
                </button>
              ) : isFinished || !recording ? (
                <div className="w-full space-y-3 animate-fade-up">
                  {isFinished && <div className="text-center font-editorial italic text-gold-soft text-lg">Speak time complete</div>}
                  <button onClick={handleFinish} disabled={saving} className="btn-glass w-full justify-center text-base py-4 disabled:opacity-50">
                    {saving ? 'Saving Session...' : 'Finish Session'}
                  </button>
                  {saveError && <div className="font-mono text-xs text-red-300">{saveError}</div>}
                </div>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full py-3.5 rounded-full font-sans font-semibold text-base transition-all"
                  style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#fca5a5' }}
                >
                  Stop Recording
                </button>
              )}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="glass-light px-5 py-3 rounded-2xl font-editorial italic text-xl text-gold-soft">
              "{currentTopic.title}"
            </div>

            <div className="paper-card rounded-xl p-6 md:p-8">
              <div className="font-mono text-xs text-ink/50 mb-4 uppercase tracking-widest">Speaking Tips -</div>
              <ul className="space-y-3">
                {TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-ink/80 leading-relaxed">
                    <span className="text-gold-warm mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {audioURL && (
              <div>
                <CDPlayer audioURL={audioURL} sessionName={currentTopic.title} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
