import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const STUDY_DURATION = 5 * 60

export default function StudyMode() {
  const navigate = useNavigate()
  const { currentTopic } = useApp()
  const [timeLeft, setTimeLeft] = useState(STUDY_DURATION)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => { if (!currentTopic) navigate('/topics') }, [currentTopic])

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0) setRunning(false)
    return () => clearInterval(intervalRef.current)
  }, [running, timeLeft])

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const progress = 1 - timeLeft / STUDY_DURATION
  const circumference = 2 * Math.PI * 56
  const isFinished = timeLeft === 0
  if (!currentTopic) return null

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/topics')} className="font-sans text-sm text-night-light hover:text-paper transition-colors">
            ← back
          </button>
          <div className="font-mono text-xs text-night-light tracking-widest uppercase">Study Mode</div>
          <button onClick={() => setRunning(r => !r)} disabled={!started || isFinished}
            className="font-sans text-xs text-night-light hover:text-paper transition-colors disabled:opacity-30">
            {running ? 'pause' : started ? 'resume' : ''}
          </button>
        </div>

        {/* Category chip */}
        <div className="flex justify-center mb-8">
          <div className="glass-light px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse block" />
            <span className="font-mono text-xs text-gold-soft tracking-widest uppercase">
              Study · {(currentTopic.source || 'Topic').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Circular timer */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg width="150" height="150" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(108,158,179,0.2)" strokeWidth="5" />
              <circle cx="65" cy="65" r="56" fill="none"
                stroke="#FFC52D" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 8px rgba(255,197,45,0.5))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-4xl text-paper tracking-widest">{mins}:{secs}</div>
              <div className="font-mono text-xs text-night-light mt-1">remaining</div>
            </div>
          </div>
        </div>

        {/* Topic title */}
        <h2 className="font-editorial italic text-3xl font-light text-paper text-center mb-6 leading-snug px-4"
          style={{ textShadow: '0 0 30px rgba(252,233,151,0.2)' }}>
          "{currentTopic.title}"
        </h2>

        {/* Paper notes card */}
        {currentTopic.summary && (
          <div className="paper-card rounded-xl p-6 mb-8 animate-fade-up">
            <div className="font-mono text-xs text-ink/50 mb-3 uppercase tracking-widest">Topic Notes —</div>
            <p className="font-sans text-sm text-ink leading-relaxed">{currentTopic.summary}</p>
          </div>
        )}

        {/* CTA */}
        {!started ? (
          <button onClick={() => { setRunning(true); setStarted(true) }}
            className="btn-glass w-full justify-center text-base py-4">
            ▶ &nbsp;Start Reading Timer
          </button>
        ) : isFinished ? (
          <div className="space-y-3 animate-fade-up">
            <div className="text-center font-editorial italic text-gold-soft text-lg">Study time complete ✦</div>
            <button onClick={() => navigate('/speak')} className="btn-glass w-full justify-center text-base py-4">
              Continue to Speak Mode →
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/speak')} className="btn-glass-blue w-full justify-center text-base py-4">
            Skip to Speak Mode →
          </button>
        )}
      </div>
    </div>
  )
}
