import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { analyzeTranscript } from '../lib/groq'

export default function SessionComplete() {
  const navigate = useNavigate()
  const { streak, sessions, currentTopic, saveSession, incrementSession, user } = useApp()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiError, setAiError] = useState(false)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(null)

  const transcript = sessionStorage.getItem('lockin_transcript') || ''
  const audioBlob = window.__lockin_audio_blob || null

  // Build audio URL for playback
  useEffect(() => {
    if (audioBlob && audioBlob.size > 0) {
      const url = URL.createObjectURL(audioBlob)
      audioUrlRef.current = url
      if (audioRef.current) audioRef.current.src = url
      return () => URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  // Auto-run AI analysis — lower threshold to 10 chars for better coverage
  useEffect(() => {
    const topicTitle = currentTopic?.title || 'Communication practice'
    const textToAnalyze = transcript.trim()

    if (textToAnalyze.length > 10) {
      setAnalyzing(true)
      setAiError(false)
      analyzeTranscript(textToAnalyze, topicTitle)
        .then(result => {
          if (result) {
            setAiResult(result)
          } else {
            setAiError(true)
          }
        })
        .catch(() => setAiError(true))
        .finally(() => setAnalyzing(false))
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (user) {
        await saveSession({
          audioBlob,
          note,
          topicTitle: currentTopic?.title,
          transcript,
          aiResult,
        })
      } else {
        incrementSession()
      }
      // Cleanup
      sessionStorage.removeItem('lockin_transcript')
      sessionStorage.removeItem('lockin_audio_url')
      sessionStorage.removeItem('lockin_has_audio')
      delete window.__lockin_audio_blob
      setSaved(true)
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const scoreColor = (score) => {
    if (!score) return 'text-night-light'
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-gold'
    return 'text-red-400'
  }

  return (
    <div className="relative z-10 flex flex-col items-center px-4 pt-28 pb-12 max-w-xl mx-auto w-full min-h-screen">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="font-editorial italic text-5xl text-gold mb-2" style={{ textShadow: '0 0 40px rgba(255,197,45,0.4)' }}>✦</div>
        <h1 className="font-display text-5xl text-paper tracking-widest mb-2">SESSION DONE</h1>
        <p className="font-editorial italic text-night-light text-lg">You showed up. That's the whole game.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 w-full mb-6">
        <div className="stat-glass">
          <div className="font-display text-4xl text-gold mb-1">{String(streak + 1).padStart(2, '0')}</div>
          <div className="font-mono text-xs text-night-light">day streak 🔥</div>
        </div>
        <div className="stat-glass">
          <div className="font-display text-4xl text-night-blue mb-1">{String(sessions + 1).padStart(2, '0')}</div>
          <div className="font-mono text-xs text-night-light">total sessions</div>
        </div>
      </div>

      {/* Topic */}
      {currentTopic && (
        <div className="paper-card rounded-xl p-5 mb-5 w-full">
          <div className="font-mono text-xs text-ink/40 mb-2 uppercase tracking-widest">Today's Topic —</div>
          <div className="font-editorial italic text-lg text-ink">"{currentTopic.title}"</div>
        </div>
      )}

      {/* Audio Playback */}
      {audioBlob && audioBlob.size > 0 ? (
        <div className="glass rounded-2xl p-5 mb-5 w-full">
          <div className="font-mono text-xs text-night-light tracking-widest mb-3 uppercase">Your Recording —</div>
          <audio
            ref={audioRef}
            controls
            className="w-full"
            style={{
              borderRadius: '10px',
              filter: 'invert(1) hue-rotate(180deg)',
              height: '40px',
            }}
          />
          <div className="font-mono text-xs text-night-light mt-2 text-center">
            {(audioBlob.size / 1024).toFixed(1)} KB recorded
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 mb-5 w-full text-center">
          <div className="font-mono text-xs text-night-light/50 tracking-widest">
            No audio — mic was not available or permission denied
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {analyzing && (
        <div className="glass rounded-2xl p-5 mb-5 w-full text-center">
          <div className="font-mono text-xs text-gold tracking-widest mb-3">ANALYZING YOUR SPEECH —</div>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {aiError && !analyzing && (
        <div className="glass rounded-2xl p-4 mb-5 w-full text-center">
          <div className="font-mono text-xs text-red-400 tracking-widest">
            AI analysis failed — check your GROQ API key or try again
          </div>
        </div>
      )}

      {!transcript && !analyzing && (
        <div className="glass rounded-2xl p-4 mb-5 w-full text-center">
          <div className="font-mono text-xs text-night-light/60 tracking-widest">
            No transcript captured — speech recognition may not be supported in this browser
          </div>
        </div>
      )}

      {aiResult && !analyzing && (
        <div className="glass rounded-2xl p-5 mb-5 w-full">
          <div className="font-mono text-xs text-gold tracking-widest mb-4 uppercase">AI Feedback —</div>

          {/* Score cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Overall', val: aiResult.score },
              { label: 'Clarity', val: aiResult.clarity },
              { label: 'Confidence', val: aiResult.confidence },
            ].map(s => (
              <div key={s.label} className="text-center glass rounded-xl p-3">
                <div className={`font-display text-3xl ${scoreColor(s.val)}`}>{s.val || '—'}</div>
                <div className="font-mono text-xs text-night-light">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Extra scores */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Structure', val: aiResult.structure },
              { label: 'Vocabulary', val: aiResult.vocabulary },
              { label: 'Pacing', val: aiResult.pacing },
            ].map(s => (
              <div key={s.label} className="text-center glass rounded-xl p-3">
                <div className={`font-display text-2xl ${scoreColor(s.val)}`}>{s.val || '—'}</div>
                <div className="font-mono text-xs text-night-light">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filler words */}
          {aiResult.filler_count !== undefined && (
            <div className="font-mono text-xs text-night-light mb-3">
              Filler words detected: <span className={aiResult.filler_count > 10 ? 'text-red-400' : 'text-gold'}>{aiResult.filler_count}</span>
            </div>
          )}

          {/* Feedback */}
          {aiResult.feedback && (
            <p className="font-sans text-sm text-paper/80 leading-relaxed mb-4">{aiResult.feedback}</p>
          )}

          {/* Strengths */}
          {aiResult.strengths?.length > 0 && (
            <div className="mb-3">
              <div className="font-mono text-xs text-green-400 mb-2">STRENGTHS</div>
              {aiResult.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-paper/70 mb-1">
                  <span className="text-green-400 shrink-0">✓</span>{s}
                </div>
              ))}
            </div>
          )}

          {/* Improvements */}
          {aiResult.improvements?.length > 0 && (
            <div>
              <div className="font-mono text-xs text-gold mb-2">IMPROVE</div>
              {aiResult.improvements.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-paper/70 mb-1">
                  <span className="text-gold shrink-0">→</span>{s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transcript preview */}
      {transcript && (
        <div className="glass rounded-xl p-4 mb-5 w-full">
          <div className="font-mono text-xs text-night-light mb-2 tracking-widest">YOUR TRANSCRIPT —</div>
          <p className="font-sans text-xs text-paper/60 leading-relaxed line-clamp-4">{transcript}</p>
        </div>
      )}

      {/* Reflection note */}
      <div className="w-full mb-5">
        <label className="font-mono text-xs text-night-light mb-2 block tracking-widest uppercase">Reflection Note —</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What did you feel? What can improve? Even 1 line..."
          rows={3}
          className="w-full glass rounded-xl p-4 font-sans text-sm text-paper/80 resize-none focus:outline-none placeholder:text-night-light/40"
        />
      </div>

      <div className="w-full space-y-3">
        <button onClick={handleSave} disabled={saving || saved} className="btn-glass w-full justify-center text-base py-4">
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save & Finish'}
        </button>
        <button onClick={() => navigate('/topics')} className="btn-glass-blue w-full justify-center text-base py-4">
          Do Another Session
        </button>
      </div>
    </div>
  )
}