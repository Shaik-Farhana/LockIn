import { useEffect } from 'react'
import { useApp } from '../context/useApp'
import FlowerPot from '../components/FlowerPot'

const MILESTONES = [
  { day: 1, label: 'First word', icon: '*' },
  { day: 3, label: 'Sprouting', icon: '*' },
  { day: 7, label: 'First bloom', icon: '*' },
  { day: 14, label: 'Full flower', icon: '*' },
  { day: 30, label: 'Garden', icon: '*' },
]

export default function Progress() {
  const { streak, sessions, avgScore, recentSessions, cloudConnected, refreshCloudProgress } = useApp()

  useEffect(() => {
    refreshCloudProgress()
  }, [refreshCloudProgress])

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="font-mono text-xs text-night-light tracking-widest mb-2 uppercase">- Screen 06</div>
          <h1 className="font-display text-6xl text-paper tracking-widest">PROGRESS</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 flex flex-col items-center">
            <div className="font-mono text-xs text-night-light tracking-widest mb-5 uppercase">Your Garden</div>
            <FlowerPot streak={streak} sessions={sessions} />
            <div className="mt-5 w-full">
              <div className="font-mono text-xs text-night-light mb-2 uppercase tracking-widest">Journey</div>
              <div className="flex justify-between">
                {MILESTONES.map((m) => (
                  <div key={m.day} className="flex flex-col items-center gap-1">
                    <div className="text-lg" style={{ opacity: streak >= m.day ? 1 : 0.25 }}>{m.icon}</div>
                    <div className="font-mono text-xs text-night-light" style={{ opacity: streak >= m.day ? 0.9 : 0.3 }}>
                      {m.day}d
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-1.5 rounded-full" style={{ background: 'rgba(108,158,179,0.2)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (streak / 30) * 100)}%`,
                    background: 'linear-gradient(90deg, #6C9EB3, #FFC52D)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="font-mono text-xs text-night-light tracking-widest mb-4 uppercase">Stats</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: streak, label: 'streak', color: '#FFC52D' },
                  { val: sessions, label: 'sessions', color: '#6C9EB3' },
                  { val: avgScore > 0 ? avgScore.toFixed(1) : '-', label: 'avg score', color: '#FCE997' },
                ].map((s) => (
                  <div key={s.label} className="stat-glass">
                    <div className="font-display text-3xl leading-none mb-1" style={{ color: s.color }}>{s.val}</div>
                    <div className="font-mono text-xs text-night-light">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="font-mono text-[10px] text-night-light mt-3 uppercase tracking-widest">
                {cloudConnected ? 'Cloud sync active' : 'Local mode only'}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="font-mono text-xs text-night-light tracking-widest mb-3 uppercase">Recent Sessions</div>
              {recentSessions.length === 0 ? (
                <div className="font-sans text-sm text-paper/60">No synced sessions yet. Complete one recorded session to populate this list.</div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="border border-night-light/20 rounded-xl p-3">
                      <div className="font-sans text-sm text-paper/90 mb-1">{session.topic_title}</div>
                      <div className="font-mono text-xs text-night-light mb-1">
                        Score: {Number(session.overall_score || 0).toFixed(1)} / 10
                      </div>
                      <div className="font-sans text-xs text-paper/65">
                        {session.ai_feedback?.summary || 'Session stored successfully.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
