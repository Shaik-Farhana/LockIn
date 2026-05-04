import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function SessionComplete() {
  const navigate = useNavigate()
  const { streak, sessions, currentTopic } = useApp()
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem(`ds_note_${Date.now()}`, JSON.stringify({ topic: currentTopic?.title, note, date: new Date().toISOString() }))
    setSaved(true)
    setTimeout(() => navigate('/'), 1200)
  }

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10 animate-fade-up">
          <div className="font-editorial italic text-6xl text-gold mb-2" style={{ textShadow: '0 0 40px rgba(255,197,45,0.4)' }}>
            ✦
          </div>
          <h1 className="font-display text-5xl text-paper tracking-widest mb-2">SESSION DONE</h1>
          <p className="font-editorial italic text-night-light text-lg">You showed up. That's the whole game.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-up">
          <div className="stat-glass">
            <div className="font-display text-4xl text-gold mb-1">{String(streak).padStart(2,'0')}</div>
            <div className="font-mono text-xs text-night-light">day streak 🔥</div>
          </div>
          <div className="stat-glass">
            <div className="font-display text-4xl text-night-blue mb-1">{String(sessions).padStart(2,'0')}</div>
            <div className="font-mono text-xs text-night-light">total sessions</div>
          </div>
        </div>

        {currentTopic && (
          <div className="paper-card rounded-xl p-5 mb-5 animate-fade-up">
            <div className="font-mono text-xs text-ink/40 mb-2 uppercase tracking-widest">Today's Topic —</div>
            <div className="font-editorial italic text-lg text-ink">"{currentTopic.title}"</div>
          </div>
        )}

        <div className="mb-5 animate-fade-up">
          <label className="font-mono text-xs text-night-light mb-2 block tracking-widest uppercase">Reflection Note —</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What did you feel? What can improve? Even 1 line..."
            rows={4}
            className="w-full glass rounded-xl p-4 font-sans text-sm text-paper/80 resize-none focus:outline-none placeholder:text-night-light/40"
            style={{ background: 'rgba(24,50,130,0.2)', border: '1px solid rgba(108,158,179,0.25)' }}
          />
        </div>

        <div className="space-y-3">
          <button onClick={handleSave} disabled={saved} className="btn-glass w-full justify-center text-base py-4">
            {saved ? '✓ Saved — going home...' : 'Save & Finish'}
          </button>
          <button onClick={() => navigate('/topics')} className="btn-glass-blue w-full justify-center text-base py-4">
            Do Another Session
          </button>
        </div>
      </div>
    </div>
  )
}
