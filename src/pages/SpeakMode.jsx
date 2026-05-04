import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CDPlayer from '../components/CDPlayer'

const SPEAK_DURATION = 5 * 60
const TIPS = [
  'Start with your main argument in 1 sentence',
  'Use a real-world example to support it',
  'Address the strongest counterargument',
  'End with a clear, confident conclusion',
  'Pause after key points — silence is power',
]

export default function SpeakMode() {
  const navigate = useNavigate()
  const { currentTopic, incrementSession } = useApp()
  const [timeLeft, setTimeLeft] = useState(SPEAK_DURATION)
  const [recording, setRecording] = useState(false)
  const [started, setStarted] = useState(false)
  const [bars, setBars] = useState(Array(20).fill(4))
  const [audioURL, setAudioURL] = useState(null)
  const intervalRef = useRef(null)
  const waveRef = useRef(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => { if (!currentTopic) navigate('/topics') }, [currentTopic])

  useEffect(() => {
    if (recording && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
      waveRef.current = setInterval(() => {
        setBars(Array(20).fill(0).map(() => Math.floor(Math.random() * 32) + 4))
      }, 100)
    } else if (timeLeft === 0) stopRecording()
    return () => { clearInterval(intervalRef.current); clearInterval(waveRef.current) }
  }, [recording, timeLeft])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioURL(URL.createObjectURL(blob))
      }
      mr.start()
      mediaRef.current = mr
    } catch {}
    setRecording(true)
    setStarted(true)
  }

  const stopRecording = () => {
    setRecording(false)
    clearInterval(intervalRef.current)
    clearInterval(waveRef.current)
    setBars(Array(20).fill(4))
    try { mediaRef.current?.stop() } catch {}
  }

  const handleFinish = () => { stopRecording(); incrementSession(); navigate('/session-complete') }
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const circumference = 2 * Math.PI * 56
  const isFinished = timeLeft === 0
  if (!currentTopic) return null

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/study')} className="font-sans text-sm text-night-light hover:text-paper transition-colors">← back</button>
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
            {recording && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse block" />}
            <span className={recording ? 'text-red-300' : 'text-night-light'}>{recording ? 'Recording' : 'Speak Mode'}</span>
          </div>
          <div className="w-12" />
        </div>

        {/* Topic pill */}
        <div className="flex justify-center mb-6">
          <div className="glass-light px-5 py-2 rounded-full font-editorial italic text-sm text-gold-soft max-w-xs text-center">
            {currentTopic.title}
          </div>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg width="150" height="150" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(108,158,179,0.2)" strokeWidth="5" />
              <circle cx="65" cy="65" r="56" fill="none"
                stroke={recording ? '#FFC52D' : 'rgba(108,158,179,0.3)'}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - (1 - timeLeft / SPEAK_DURATION))}
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: recording ? 'drop-shadow(0 0 8px rgba(255,197,45,0.5))' : 'none' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-4xl text-paper tracking-widest">{mins}:{secs}</div>
              <div className="font-mono text-xs text-night-light mt-1">speak time</div>
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className="glass rounded-2xl p-5 mb-5">
          <div className="flex items-end justify-center gap-1 h-14 mb-3">
            {bars.map((h, i) => (
              <div key={i} className="rounded-full transition-all"
                style={{
                  width: '5px', height: `${h}px`,
                  background: recording
                    ? `rgba(252, 233, 151, ${0.4 + (h / 36) * 0.6})`
                    : 'rgba(108, 158, 179, 0.2)',
                  transitionDuration: recording ? '100ms' : '300ms',
                  boxShadow: recording ? `0 0 4px rgba(252,233,151,${h/60})` : 'none',
                }}
              />
            ))}
          </div>
          <div className="font-mono text-xs text-center tracking-widest"
            style={{ color: recording ? 'rgba(252,233,151,0.8)' : 'rgba(108,158,179,0.4)' }}>
            {recording ? '● RECORDING IN PROGRESS' : started ? '◻ PAUSED' : '○ READY TO RECORD'}
          </div>
        </div>

        {/* Speaking tips */}
        <div className="paper-card rounded-xl p-5 mb-5">
          <div className="font-mono text-xs text-ink/50 mb-3 uppercase tracking-widest">Speaking Tips —</div>
          <ul className="space-y-2">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                <span className="text-gold-warm mt-0.5 shrink-0">✦</span>{tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CD Player for playback */}
        {audioURL && (
          <div className="mb-5">
            <CDPlayer audioURL={audioURL} sessionName={currentTopic.title} />
          </div>
        )}

        {/* Actions */}
        {!started ? (
          <button onClick={startRecording} className="btn-glass w-full justify-center text-base py-4">
            <span className="w-2.5 h-2.5 rounded-full bg-gold block" />
            Start Recording
          </button>
        ) : isFinished || !recording ? (
          <div className="space-y-3 animate-fade-up">
            {isFinished && <div className="text-center font-editorial italic text-gold-soft text-lg">Speak time complete ✦</div>}
            <button onClick={handleFinish} className="btn-glass w-full justify-center text-base py-4">
              Finish Session →
            </button>
          </div>
        ) : (
          <button onClick={stopRecording}
            className="w-full py-3.5 rounded-full font-sans font-semibold text-base transition-all"
            style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#fca5a5' }}>
            ◼ &nbsp;Stop Recording
          </button>
        )}
      </div>
    </div>
  )
}
