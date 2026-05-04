import { useState, useRef } from 'react'

export default function CDPlayer({ audioURL, sessionName }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  const toggle = () => {
    if (!audioURL) return
    if (playing) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }
    setPlaying(p => !p)
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    const p = audioRef.current.currentTime / audioRef.current.duration
    setProgress(isNaN(p) ? 0 : p)
  }

  const onEnded = () => setPlaying(false)

  if (!audioURL) return null

  const circumference = 2 * Math.PI * 38
  const strokeOffset = circumference * (1 - progress)

  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-5">
      {/* Vinyl disc */}
      <div className="relative flex-shrink-0">
        {/* Outer record */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center ${playing ? 'animate-spin-slow' : ''}`}
          style={{
            background: 'conic-gradient(from 0deg, #1a1a1a 0%, #2a2a2a 25%, #111 50%, #222 75%, #1a1a1a 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,197,45,0.2)" strokeWidth="3" />
            <circle
              cx="44" cy="44" r="38" fill="none"
              stroke="#FFC52D" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          {/* Center label */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono"
            style={{
              background: 'linear-gradient(135deg, #f0e6c8 0%, #d4c9a0 100%)',
              color: '#2a1f0e',
              fontSize: '7px',
              textAlign: 'center',
              lineHeight: 1.2,
              fontWeight: 700,
            }}
          >
            Ltd<br/>Ed.
          </div>
        </div>
      </div>

      {/* Info + controls */}
      <div className="flex-1 min-w-0">
        <div className="font-editorial italic text-gold-soft text-sm mb-1 truncate">
          {sessionName || 'Session Recording'}
        </div>
        <div className="font-mono text-xs text-night-light mb-3">Dev_Speaks · Personal</div>

        <button onClick={toggle} className="btn-glass text-sm py-2 px-5">
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      {audioURL && (
        <audio
          ref={audioRef}
          src={audioURL}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}
