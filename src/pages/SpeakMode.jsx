import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const SPEAK_DURATION = 5 * 60

const SPEAKING_TIPS = [
  'Start with your main argument in 1 sentence',
  'Use a real-world example to support it',
  'Address the strongest counterargument',
  'End with a clear, confident conclusion',
  'Pause after key points — silence is powerful',
]

export default function SpeakMode() {
  const navigate = useNavigate()
  const { currentTopic } = useApp()
  const [timeLeft, setTimeLeft] = useState(SPEAK_DURATION)
  const [recording, setRecording] = useState(false)
  const [started, setStarted] = useState(false)
  const [bars, setBars] = useState(Array(18).fill(3))
  const [transcript, setTranscript] = useState('')
  const intervalRef = useRef(null)
  const waveRef = useRef(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const audioBlobRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const stopResolveRef = useRef(null)

  useEffect(() => {
    if (!currentTopic) navigate('/topics')
  }, [currentTopic])

  useEffect(() => {
    if (recording && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
      waveRef.current = setInterval(() => {
        setBars(Array(18).fill(0).map(() => Math.floor(Math.random() * 28) + 4))
      }, 120)
    } else if (timeLeft === 0) {
      void stopRecording()
    }
    return () => { clearInterval(intervalRef.current); clearInterval(waveRef.current) }
  }, [recording, timeLeft])

  const startRecording = async () => {
    try {
      // Audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        audioBlobRef.current = blob
        if (stopResolveRef.current) {
          stopResolveRef.current()
          stopResolveRef.current = null
        }
      }
      mr.start()
      mediaRef.current = mr

      // Web Speech API for real-time transcript
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.onresult = (event) => {
          let text = ''
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i]
            const part = result[0]?.transcript || ''
            if (part) text += `${part} `
          }
          transcriptRef.current = text.trim()
          setTranscript(transcriptRef.current)
        }
        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err) {
      console.warn('Mic not available:', err)
    }
    setRecording(true)
    setStarted(true)
  }

  const stopRecording = () => {
    setRecording(false)
    clearInterval(intervalRef.current)
    clearInterval(waveRef.current)
    setBars(Array(18).fill(3))

    return new Promise((resolve) => {
      stopResolveRef.current = resolve

      const recorder = mediaRef.current
      if (recorder && recorder.state === 'recording') {
        try {
          recorder.stop()
        } catch {
          if (stopResolveRef.current) {
            stopResolveRef.current()
            stopResolveRef.current = null
          }
        }
      } else if (stopResolveRef.current) {
        stopResolveRef.current()
        stopResolveRef.current = null
      }

      try { recognitionRef.current?.stop() } catch { }
    })
  }

  const handleFinish = async () => {
    await stopRecording()
    // Pass blob and transcript to session complete via sessionStorage
    if (audioBlobRef.current) {
      const url = URL.createObjectURL(audioBlobRef.current)
      sessionStorage.setItem('lockin_audio_url', url)
      sessionStorage.setItem('lockin_has_audio', 'true')
    }
    sessionStorage.setItem('lockin_transcript', transcriptRef.current || transcript)
    // Store blob reference in window for SessionComplete to access
    window.__lockin_audio_blob = audioBlobRef.current
    navigate('/session-complete')
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const circumference = 2 * Math.PI * 52
  const isFinished = timeLeft === 0

  if (!currentTopic) return null

  return (
    <div className="relative z-10 flex flex-col items-center px-4 pt-28 pb-12 max-w-xl mx-auto w-full min-h-screen">
      <div className="w-full flex items-center justify-between mb-6">
        <button onClick={() => navigate('/study')} className="font-sans text-sm text-night-light hover:text-paper transition-colors">← back</button>
        <div className="flex items-center gap-2 font-mono text-xs tracking-widest">
          {recording && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse block" />}
          <span className={recording ? 'text-red-300' : 'text-night-light'}>{recording ? 'REC' : 'SPEAK MODE'}</span>
        </div>
        <div className="w-12" />
      </div>

      {/* Topic pill */}
      <div className="mb-6 max-w-xs">
        <div className="glass-light px-4 py-1.5 rounded-full font-editorial italic text-sm text-gold-soft text-center truncate">
          {currentTopic.title}
        </div>
      </div>

      {/* Timer */}
      <div className="relative mb-6">
        <svg width="130" height="130" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(108,158,179,0.2)" strokeWidth="6" />
          <circle cx="60" cy="60" r="52" fill="none"
            stroke={recording ? '#FFC52D' : 'rgba(108,158,179,0.3)'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (timeLeft / SPEAK_DURATION)}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: recording ? 'drop-shadow(0 0 8px rgba(255,197,45,0.5))' : 'none' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-3xl text-paper tracking-widest">{mins}:{secs}</div>
          <div className="font-mono text-xs text-night-light mt-1">speak time</div>
        </div>
      </div>

      {/* Waveform */}
      <div className="w-full glass rounded-2xl p-5 mb-5">
        <div className="flex items-end justify-center gap-1 h-12 mb-3">
          {bars.map((h, i) => (
            <div key={i} className="rounded-full transition-all"
              style={{
                width: '5px', height: `${h}px`,
                background: recording ? `rgba(252,233,151,${0.4 + (h / 36) * 0.6})` : 'rgba(108,158,179,0.2)',
                transitionDuration: recording ? '100ms' : '300ms',
              }}
            />
          ))}
        </div>
        <div className="font-mono text-xs text-center tracking-widest"
          style={{ color: recording ? 'rgba(252,233,151,0.8)' : 'rgba(108,158,179,0.4)' }}>
          {recording ? '● RECORDING IN PROGRESS' : started ? '◻ PAUSED' : '○ READY TO RECORD'}
        </div>
      </div>

      {/* Live transcript preview */}
      {transcript && (
        <div className="w-full glass rounded-xl p-4 mb-4">
          <div className="font-mono text-xs text-gold mb-2 tracking-widest">LIVE TRANSCRIPT —</div>
          <p className="font-sans text-xs text-paper/70 leading-relaxed line-clamp-3">{transcript}</p>
        </div>
      )}

      {/* Speaking tips */}
      <div className="paper-card rounded-xl p-5 mb-5 w-full">
        <div className="font-mono text-xs text-ink/50 mb-3 uppercase tracking-widest">Speaking Tips —</div>
        <ul className="space-y-2">
          {SPEAKING_TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
              <span className="text-gold-warm mt-0.5 shrink-0">✦</span>{tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      {!started ? (
        <button onClick={startRecording} className="btn-glass w-full justify-center text-base py-4">
          <span className="w-2.5 h-2.5 rounded-full bg-gold block" />
          Start Recording
        </button>
      ) : isFinished || !recording ? (
        <div className="w-full space-y-3">
          {isFinished && <div className="text-center font-editorial italic text-gold-soft text-lg">Speak time complete ✦</div>}
          <button onClick={handleFinish} className="btn-glass w-full justify-center text-base py-4">
            Finish Session →
          </button>
        </div>
      ) : (
        <button onClick={stopRecording} className="w-full py-3.5 rounded-full font-sans font-semibold text-base transition-all"
          style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#fca5a5' }}>
          ◼ Stop Recording
        </button>
      )}
    </div>
  )
}
