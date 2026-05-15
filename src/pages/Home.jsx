import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import FlowerPot from '../components/FlowerPot'

export default function Home() {
  const navigate = useNavigate()
  const { streak, sessions, avgScore } = useApp()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Hero greeting */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="font-mono text-xs text-night-light tracking-widest mb-3 uppercase">
            {greeting}, LockIn —
          </div>
          <h1 className="font-display text-7xl md:text-9xl text-paper tracking-widest leading-none mb-2">
            READY TO
          </h1>
          <h1 className="font-editorial italic text-6xl md:text-8xl font-light leading-none"
            style={{ color: '#FFC52D', textShadow: '0 0 40px rgba(255,197,45,0.3)' }}>
            speak today?
          </h1>
          <p className="font-sans text-night-light text-sm mt-4 max-w-sm mx-auto leading-relaxed">
            {streak > 0
              ? `Your ${streak}-day streak is glowing. Keep it alive.`
              : 'Every great communicator started with day one.'}
          </p>
        </div>

        {/* Main CTA */}
        <div className="flex justify-center mb-12">
          <button onClick={() => navigate('/topics')} className="btn-glass text-base px-10 py-4 text-lg">
            ▶ &nbsp;Start Today's Session
          </button>
        </div>

        {/* Stats + Flower grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {/* Stats */}
          <div className="glass rounded-2xl p-6 md:col-span-2">
            <div className="font-mono text-xs text-night-light tracking-widest mb-5 uppercase">
              Your Progress
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { val: String(streak).padStart(2,'0'), label: 'day streak', color: '#FFC52D' },
                { val: String(sessions).padStart(2,'0'), label: 'sessions', color: '#6C9EB3' },
                { val: avgScore > 0 ? avgScore.toFixed(1) : '—', label: 'avg score', color: '#FCE997' },
              ].map(s => (
                <div key={s.label} className="stat-glass">
                  <div className="font-display text-4xl leading-none mb-1" style={{ color: s.color }}>{s.val}</div>
                  <div className="font-mono text-xs text-night-light tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent sessions placeholder */}
            <div className="font-mono text-xs text-night-light tracking-widest mb-3 uppercase">Recent</div>
            <div className="space-y-2">
              {[{ t: 'REST vs GraphQL', s: 4.5 }, { t: 'Idempotency', s: 4.8 }].map((r, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-night-mid/30">
                  <span className="font-sans text-sm text-paper/80">{r.t}</span>
                  <span className="font-mono text-xs text-gold">{r.s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flower pot */}
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="font-mono text-xs text-night-light tracking-widest mb-4 uppercase">Your Garden</div>
            <FlowerPot streak={streak} sessions={sessions} />
          </div>
        </div>
      </div>
    </div>
  )
}
