import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'

const STUDY_DURATION = 5 * 60

function playFinishSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const notes = [660, 880, 990]

  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = ctx.currentTime + index * 0.16

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.16)
  })
}

export default function StudyMode() {
  const navigate = useNavigate()
  const { currentTopic } = useApp()
  const [timeLeft, setTimeLeft] = useState(STUDY_DURATION)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const intervalRef = useRef(null)
  const soundPlayedRef = useRef(false)

  useEffect(() => {
    if (!currentTopic) navigate('/topics')
  }, [currentTopic, navigate])

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    }

    if (timeLeft === 0 && !soundPlayedRef.current) {
      setRunning(false)
      soundPlayedRef.current = true
      playFinishSound()
    }

    return () => clearInterval(intervalRef.current)
  }, [running, timeLeft])

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const progress = 1 - timeLeft / STUDY_DURATION
  const circumference = 2 * Math.PI * 86
  const isFinished = timeLeft === 0

  if (!currentTopic) return null

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/topics')} className="font-sans text-sm text-night-light hover:text-paper transition-colors">
            Back
          </button>
          <div className="font-mono text-xs text-night-light tracking-widest uppercase">Study Mode</div>
          <button
            onClick={() => setRunning(r => !r)}
            disabled={!started || isFinished}
            className="font-sans text-xs text-night-light hover:text-paper transition-colors disabled:opacity-30"
          >
            {running ? 'Pause' : started ? 'Resume' : ''}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <section className="space-y-5">
            <div className="glass-light inline-flex px-4 py-1.5 rounded-full items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse block" />
              <span className="font-mono text-xs text-gold-soft tracking-widest uppercase">
                Study - {(currentTopic.source || 'Topic').toUpperCase()}
              </span>
            </div>

            <h1
              className="font-editorial italic text-4xl md:text-5xl font-light text-paper leading-tight"
              style={{ textShadow: '0 0 30px rgba(252,233,151,0.2)' }}
            >
              "{currentTopic.title}"
            </h1>

            {currentTopic.summary && (
              <div className="paper-card rounded-xl p-6 md:p-8 animate-fade-up">
                <div className="font-mono text-xs text-ink/50 mb-4 uppercase tracking-widest">Topic Notes -</div>
                <p className="font-sans text-base text-ink leading-8">{currentTopic.summary}</p>
              </div>
            )}
          </section>

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
                    stroke="#FFC52D"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    transform="rotate(-90 105 105)"
                    style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 10px rgba(255,197,45,0.55))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-7xl text-paper tracking-widest leading-none">{mins}:{secs}</div>
                  <div className="font-mono text-xs text-night-light mt-3 uppercase tracking-widest">reading time</div>
                </div>
              </div>

              {!started ? (
                <button onClick={() => { setRunning(true); setStarted(true) }} className="btn-glass w-full justify-center text-base py-4">
                  Start Reading Timer
                </button>
              ) : isFinished ? (
                <div className="w-full space-y-3 animate-fade-up">
                  <div className="text-center font-editorial italic text-gold-soft text-lg">Study time complete</div>
                  <button onClick={() => navigate('/speak')} className="btn-glass w-full justify-center text-base py-4">
                    Continue to Speak Mode
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate('/speak')} className="btn-glass-blue w-full justify-center text-base py-4">
                  Skip to Speak Mode
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
