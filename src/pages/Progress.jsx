import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import FlowerPot from '../components/FlowerPot'

const MILESTONES = [
  { day: 1, icon: '🌱' },
  { day: 3, icon: '🌿' },
  { day: 7, icon: '🌸' },
  { day: 14, icon: '🌺' },
  { day: 30, icon: '🌻' },
]

function scoreColor(score) {
  if (!score) return '#6C9EB3'
  if (score >= 8) return '#4ade80'
  if (score >= 6) return '#FFC52D'
  return '#f87171'
}

function SkillBar({ label, value }) {
  const pct = value ? Math.round((value / 10) * 100) : 0
  const color = scoreColor(value)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 88, textAlign: 'right', fontSize: 12, color: '#a8d4e8', flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 7, background: 'rgba(108,158,179,0.15)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.7s ease',
        }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, width: 26, textAlign: 'right', color }}>
        {value ? value.toFixed(1) : '—'}
      </div>
    </div>
  )
}

function FillerChip({ word, count }) {
  const hot = count >= 5
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 12,
      padding: '3px 9px',
      borderRadius: 20,
      margin: '3px',
      background: hot ? 'rgba(248,113,113,0.15)' : 'rgba(108,158,179,0.12)',
      border: `1px solid ${hot ? 'rgba(248,113,113,0.3)' : 'rgba(108,158,179,0.2)'}`,
      color: hot ? '#fca5a5' : '#a8d4e8',
    }}>
      {word} × {count}
    </span>
  )
}

function TrendChart({ sessions }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!sessions || sessions.length < 2) return

    const loadChart = () => {
      if (!window.Chart) {
        setTimeout(loadChart, 200)
        return
      }
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }

      const scored = [...sessions]
        .filter(s => s.ai_score)
        .reverse()
        .slice(-15)

      if (scored.length < 2) return

      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: scored.map((s, i) => `#${i + 1}`),
          datasets: [{
            label: 'Overall score',
            data: scored.map(s => s.ai_score),
            borderColor: '#4ecca3',
            backgroundColor: 'rgba(78,204,163,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: scored.map(s => scoreColor(s.ai_score)),
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` Score: ${ctx.parsed.y}`,
                title: (items) => {
                  const s = scored[items[0].dataIndex]
                  return s?.topic ? s.topic.slice(0, 30) + (s.topic.length > 30 ? '…' : '') : ''
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#6C9EB3' } },
            y: {
              min: 0, max: 10,
              ticks: { font: { size: 11 }, color: '#6C9EB3', stepSize: 2 },
              grid: { color: 'rgba(108,158,179,0.1)' },
            },
          },
        },
      })
    }

    if (!document.getElementById('chartjs-cdn')) {
      const script = document.createElement('script')
      script.id = 'chartjs-cdn'
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
      script.onload = loadChart
      document.head.appendChild(script)
    } else {
      loadChart()
    }

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [sessions])

  const scored = sessions?.filter(s => s.ai_score) || []
  if (scored.length < 2) return null

  const first = scored[scored.length - 1]?.ai_score || 0
  const last = scored[0]?.ai_score || 0
  const diff = (last - first).toFixed(1)
  const trending = diff > 0 ? `+${diff} points` : `${diff} points`

  return (
    <div className="glass rounded-2xl p-5 mb-5">
      <div className="font-mono text-xs text-night-light tracking-widest mb-1 uppercase">Score over time</div>
      <div className="font-sans text-xs mb-4" style={{ color: last >= first ? '#4ade80' : '#f87171' }}>
        {trending} across {scored.length} sessions
      </div>
      <div style={{ position: 'relative', width: '100%', height: 160 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

function LatestFeedback({ session }) {
  if (!session) return null

  // Parse filler words from ai_feedback text if ai_filler_count exists
  const fillers = [
    session.ai_filler_um && { word: 'um', count: session.ai_filler_um },
    session.ai_filler_like && { word: 'like', count: session.ai_filler_like },
    session.ai_filler_basically && { word: 'basically', count: session.ai_filler_basically },
    session.ai_filler_youknow && { word: 'you know', count: session.ai_filler_youknow },
  ].filter(Boolean)

  return (
    <div className="glass rounded-2xl p-5 mb-5">
      <div className="font-mono text-xs text-gold tracking-widest mb-4 uppercase">
        Latest session · AI Feedback
      </div>

      {/* Topic */}
      <div className="paper-card rounded-lg px-4 py-2 mb-4 inline-block">
        <span className="font-editorial italic text-sm text-ink">"{session.topic}"</span>
      </div>

      {/* 4 score cards */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Overall', val: session.ai_score },
          { label: 'Clarity', val: session.ai_clarity },
          { label: 'Confidence', val: session.ai_confidence },
          { label: 'Fillers', val: session.ai_filler_count, invert: true },
        ].map(({ label, val, invert }) => (
          <div key={label} className="stat-glass">
            <div className="font-display text-2xl leading-none mb-1"
              style={{ color: invert ? (val > 10 ? '#f87171' : '#4ade80') : scoreColor(val) }}>
              {val ?? '—'}
            </div>
            <div className="font-mono text-xs text-night-light">{label}</div>
          </div>
        ))}
      </div>

      {/* Skill bars */}
      <div className="mb-4">
        <div className="font-mono text-xs text-night-light tracking-widest mb-3 uppercase">Skill breakdown</div>
        <SkillBar label="Structure" value={session.ai_structure} />
        <SkillBar label="Vocabulary" value={session.ai_vocabulary} />
        <SkillBar label="Pacing" value={session.ai_pacing} />
        <SkillBar label="Clarity" value={session.ai_clarity} />
        <SkillBar label="Confidence" value={session.ai_confidence} />
      </div>

      {/* Strengths + Improvements */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {session.ai_strengths?.length > 0 && (
          <div className="glass rounded-xl p-3">
            <div className="font-mono text-xs tracking-widest mb-2" style={{ color: '#4ade80' }}>STRENGTHS</div>
            {session.ai_strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-paper/70 mb-1.5">
                <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>{s}
              </div>
            ))}
          </div>
        )}
        {session.ai_improvements?.length > 0 && (
          <div className="glass rounded-xl p-3">
            <div className="font-mono text-xs text-gold tracking-widest mb-2">IMPROVE</div>
            {session.ai_improvements.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-paper/70 mb-1.5">
                <span className="text-gold" style={{ flexShrink: 0 }}>→</span>{s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filler word chips */}
      {session.ai_filler_count > 0 && (
        <div className="mb-4">
          <div className="font-mono text-xs text-night-light tracking-widest mb-2 uppercase">Filler words</div>
          {fillers.length > 0
            ? fillers.map(f => <FillerChip key={f.word} word={f.word} count={f.count} />)
            : (
              <span className="font-sans text-sm text-paper/60">
                {session.ai_filler_count} total detected
              </span>
            )}
          {session.ai_filler_count > 10 && (
            <div className="font-sans text-xs mt-2" style={{ color: '#fca5a5' }}>
              Target: under 5 per session. Pause instead of filling silence.
            </div>
          )}
        </div>
      )}

      {/* AI written feedback */}
      {session.ai_feedback && (
        <div>
          <div className="font-mono text-xs text-night-light tracking-widest mb-2 uppercase">AI Summary</div>
          <p className="font-sans text-sm text-paper/80 leading-relaxed">{session.ai_feedback}</p>
        </div>
      )}
    </div>
  )
}

export default function Progress() {
  const navigate = useNavigate()
  const { streak, sessions, avgScore, sessionHistory, user } = useApp()
  const [selectedSession, setSelectedSession] = useState(null)

  // Default to showing latest session feedback
  const latestWithAI = sessionHistory?.find(s => s.ai_score)

  useEffect(() => {
    if (latestWithAI && !selectedSession) setSelectedSession(latestWithAI)
  }, [latestWithAI])

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="font-mono text-xs text-night-light tracking-widest mb-2 uppercase">— Progress</div>
          <h1 className="font-display text-6xl text-paper tracking-widest">YOUR JOURNEY</h1>
        </div>

        {/* Top grid: flower + stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Flower pot + milestones */}
          <div className="glass rounded-2xl p-6 flex flex-col items-center">
            <div className="font-mono text-xs text-night-light tracking-widest mb-4 uppercase">Your Garden</div>
            <FlowerPot streak={streak} sessions={sessions} />
            <div className="flex justify-between w-full mt-5">
              {MILESTONES.map(m => (
                <div key={m.day} className="flex flex-col items-center gap-1">
                  <div className="text-lg" style={{ opacity: streak >= m.day ? 1 : 0.2 }}>{m.icon}</div>
                  <div className="font-mono text-xs text-night-light" style={{ opacity: streak >= m.day ? 0.9 : 0.3 }}>
                    {m.day}d
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 rounded-full w-full" style={{ background: 'rgba(108,158,179,0.2)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (streak / 30) * 100)}%`,
                  background: 'linear-gradient(90deg, #6C9EB3, #FFC52D)',
                }} />
            </div>
          </div>

          {/* Stats + sign-in prompt */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="font-mono text-xs text-night-light tracking-widest mb-4 uppercase">Overview</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: String(streak).padStart(2, '0'), label: 'streak', color: '#FFC52D' },
                  { val: String(sessions).padStart(2, '0'), label: 'sessions', color: '#6C9EB3' },
                  { val: avgScore > 0 ? avgScore.toFixed(1) : '—', label: 'avg score', color: '#FCE997' },
                ].map(s => (
                  <div key={s.label} className="stat-glass">
                    <div className="font-display text-3xl leading-none mb-1" style={{ color: s.color }}>
                      {s.val}
                    </div>
                    <div className="font-mono text-xs text-night-light">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {!user && (
              <div className="glass rounded-2xl p-5 text-center">
                <div className="font-editorial italic text-gold-soft mb-1 text-sm">
                  Sign in to save your progress
                </div>
                <p className="font-sans text-xs text-night-light mb-3">
                  Your sessions, AI feedback and streak sync across devices.
                </p>
                <button onClick={() => navigate('/login')} className="btn-glass text-sm py-2 px-5">
                  Sign In
                </button>
              </div>
            )}

            {user && sessions === 0 && (
              <div className="glass rounded-2xl p-5 text-center">
                <div className="font-editorial italic text-gold-soft mb-2">No sessions yet</div>
                <p className="font-sans text-xs text-night-light mb-3">
                  Complete your first session to see AI feedback here.
                </p>
                <button onClick={() => navigate('/topics')} className="btn-glass text-sm py-2 px-5">
                  Start First Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Score trend chart */}
        {sessionHistory?.length >= 2 && <TrendChart sessions={sessionHistory} />}

        {/* Latest session AI feedback */}
        {selectedSession && <LatestFeedback session={selectedSession} />}

        {/* Session history list */}
        {sessionHistory?.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="font-mono text-xs text-night-light tracking-widest mb-5 uppercase">
              All sessions
            </div>
            <div className="space-y-0">
              {sessionHistory.map((s, i) => (
                <button
                  key={s.id || i}
                  onClick={() => setSelectedSession(s)}
                  className="w-full text-left"
                >
                  <div
                    className="flex items-start justify-between gap-4 py-3 transition-all duration-150"
                    style={{
                      borderBottom: i < sessionHistory.length - 1 ? '1px solid rgba(108,158,179,0.12)' : 'none',
                      background: selectedSession?.id === s.id ? 'rgba(255,197,45,0.05)' : 'transparent',
                      borderRadius: 8,
                      padding: '10px 8px',
                    }}
                  >
                    {/* Dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      marginTop: 5, background: scoreColor(s.ai_score),
                    }} />

                    {/* Topic + date */}
                    <div className="flex-1 min-w-0">
                      <div className="font-editorial italic text-paper text-sm truncate mb-0.5">
                        {s.topic || 'Untitled session'}
                      </div>
                      <div className="font-mono text-xs text-night-light">
                        {new Date(s.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {s.ai_filler_count != null && ` · ${s.ai_filler_count} fillers`}
                      </div>
                      {s.ai_improvements?.[0] && (
                        <div className="font-sans text-xs mt-1" style={{ color: '#FFC52D' }}>
                          → {s.ai_improvements[0]}
                        </div>
                      )}
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      {s.ai_score ? (
                        <>
                          <div className="font-display text-2xl leading-none"
                            style={{ color: scoreColor(s.ai_score) }}>
                            {s.ai_score.toFixed(1)}
                          </div>
                          <div className="font-mono text-xs text-night-light mt-0.5">score</div>
                        </>
                      ) : (
                        <div className="font-mono text-xs text-night-light">no score</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}