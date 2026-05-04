import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopics } from '../hooks/useTopics'
import { useApp } from '../context/AppContext'
import { interviewTopics, vocabTopics, dailyTopicCategories } from '../data/topics'
import { randomCategories, randomStructures, randomTopicsData } from '../data/randomTopics'

const TABS = [
  { id: 'daily', label: 'Daily Topic' },
  { id: 'interview', label: 'Interview' },
  { id: 'vocab', label: 'Vocab' },
  { id: 'random', label: 'Random' },
]

const getRandomIndex = (length) => Math.floor(Math.random() * length)

export default function TopicPicker() {
  const navigate = useNavigate()
  const { currentTab, setCurrentTab, setCurrentTopic, streak, sessions, avgScore } = useApp()
  const { topic: dailyTopic, loading, fetchTopic } = useTopics()
  const [selectedCategory, setSelectedCategory] = useState(dailyTopicCategories[0])
  const [interviewIdx, setInterviewIdx] = useState(() => getRandomIndex(interviewTopics.length))
  const [vocabIdx, setVocabIdx] = useState(() => getRandomIndex(vocabTopics.length))
  const [randomCategory, setRandomCategory] = useState('general')
  const [randomIdx, setRandomIdx] = useState(() => getRandomIndex(randomTopicsData.general.length))

  useEffect(() => {
    if (currentTab === 'daily' && !dailyTopic) fetchTopic(selectedCategory)
  }, [currentTab, dailyTopic, fetchTopic, selectedCategory])

  const handleRespin = () => {
    if (currentTab === 'daily') fetchTopic(selectedCategory)
    if (currentTab === 'interview') setInterviewIdx(getRandomIndex(interviewTopics.length))
    if (currentTab === 'vocab') setVocabIdx(getRandomIndex(vocabTopics.length))
    if (currentTab === 'random') setRandomIdx(getRandomIndex(randomTopicsData[randomCategory].length))
  }

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    fetchTopic(cat)
  }

  const handleRandomCategoryChange = (cat) => {
    setRandomCategory(cat)
    setRandomIdx(getRandomIndex(randomTopicsData[cat].length))
  }

  const getActiveTopic = () => {
    if (currentTab === 'daily') return dailyTopic
    if (currentTab === 'interview') {
      const t = interviewTopics[interviewIdx]
      return {
        title: t.title,
        summary: t.hint,
        difficulty: t.difficulty,
        source: 'interview',
        readTime: '~2 min prep',
      }
    }
    if (currentTab === 'vocab') {
      const t = vocabTopics[vocabIdx]
      return {
        title: t.title,
        summary: `${t.definition}\n\nExample: "${t.example}"`,
        difficulty: t.difficulty,
        source: 'vocab',
        readTime: '~1 min read',
      }
    }
    if (currentTab === 'random') {
      const t = randomTopicsData[randomCategory][randomIdx]
      return {
        title: t.title,
        summary: randomStructures[randomCategory],
        difficulty: t.difficulty,
        source: randomCategory,
        readTime: '~2 min fun',
      }
    }
    return null
  }

  const handleStartStudy = () => {
    const topic = getActiveTopic()
    if (!topic) return
    setCurrentTopic(topic)
    navigate('/study')
  }

  const activeTopic = getActiveTopic()

  const getHintContent = () => {
    if (currentTab === 'interview') return interviewTopics[interviewIdx].hint
    if (currentTab === 'vocab') {
      const t = vocabTopics[vocabIdx]
      return `${t.definition}\n\nExample: "${t.example}"`
    }
    if (currentTab === 'random') return randomStructures[randomCategory]
    return dailyTopic?.summary
  }

  const sourceColor = {
    wikipedia: '#6C9EB3',
    curated: '#FCE997',
    interview: '#a8d4e8',
    vocab: '#c4a8e8',
    general: '#FFC52D',
    finance: '#4ecca3',
    roast: '#e85d20',
    pitch: '#a8d4e8',
    conspiracy: '#c4a8e8',
    genz: '#ff9e6b',
  }

  const renderPill = ({ key, label, active, color, onClick }) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200"
      style={active ? {
        background: 'rgba(255,197,45,0.2)',
        border: '1px solid rgba(255,197,45,0.4)',
        color: '#FFC52D',
      } : {
        background: `${color}1A`,
        border: `1px solid ${color}33`,
        color,
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 animate-fade-up">
          <div className="font-mono text-xs text-night-light tracking-widest mb-2 uppercase">- Screen 02</div>
          <h1 className="font-display text-6xl text-paper tracking-widest">TOPIC PICKER</h1>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => renderPill({
            key: tab.id,
            label: tab.label,
            active: currentTab === tab.id,
            color: '#6C9EB3',
            onClick: () => setCurrentTab(tab.id),
          }))}
        </div>

        {currentTab === 'daily' && (
          <div className="flex gap-2 mb-5 flex-wrap animate-fade-up">
            {dailyTopicCategories.map(cat => renderPill({
              key: cat,
              label: cat.charAt(0).toUpperCase() + cat.slice(1),
              active: selectedCategory === cat,
              color: '#6C9EB3',
              onClick: () => handleCategoryChange(cat),
            }))}
          </div>
        )}

        {currentTab === 'random' && (
          <div className="flex gap-2 mb-5 flex-wrap animate-fade-up">
            {randomCategories.map(cat => renderPill({
              key: cat.id,
              label: cat.label,
              active: randomCategory === cat.id,
              color: '#ff9e6b',
              onClick: () => handleRandomCategoryChange(cat.id),
            }))}
          </div>
        )}

        <div className="paper-card rounded-xl p-6 mb-5 animate-fade-up relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-5 rounded-sm opacity-50"
            style={{ background: 'rgba(200,180,140,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
          />

          {activeTopic && !loading && (
            <div className="flex items-center gap-2 mb-3">
              <div
                className="font-mono text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: `${sourceColor[activeTopic.source] || '#6C9EB3'}20`,
                  border: `1px solid ${sourceColor[activeTopic.source] || '#6C9EB3'}50`,
                  color: sourceColor[activeTopic.source] || '#6C9EB3',
                }}
              >
                {activeTopic.source}
              </div>
              {activeTopic.author && (
                <span className="font-mono text-xs text-ink/40">by {activeTopic.author}</span>
              )}
              <span className="font-mono text-xs text-ink/30 ml-auto">{activeTopic.readTime}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 py-2">
              <div className="h-5 bg-ink/10 rounded animate-pulse w-3/4" />
              <div className="h-5 bg-ink/10 rounded animate-pulse w-1/2" />
            </div>
          ) : (
            <h2 className="font-editorial text-2xl font-semibold text-ink leading-snug mb-3">
              "{activeTopic?.title || '...'}"
            </h2>
          )}

          {activeTopic?.difficulty && !loading && (
            <span
              className="font-mono text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,105,20,0.15)', color: '#8B6914', border: '1px solid rgba(139,105,20,0.3)' }}
            >
              {activeTopic.difficulty}
            </span>
          )}
        </div>

        <div className="flex gap-3 mb-5">
          <button
            onClick={handleStartStudy}
            disabled={loading || !activeTopic}
            className="flex-1 btn-glass py-3.5 text-base justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Play &nbsp;Start Study (5 min)
          </button>
          <button
            onClick={handleRespin}
            disabled={loading}
            className="btn-glass-blue w-14 justify-center text-xl disabled:opacity-40"
            title="Get new topic"
          >
            {loading ? (
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
            ) : '↻'}
          </button>
        </div>

        {getHintContent() && !loading && (
          <div className="glass rounded-2xl p-5 mb-5 animate-fade-up">
            <div className="font-mono text-xs text-gold tracking-widest mb-3 uppercase">
              {currentTab === 'vocab' ? 'Definition -' : currentTab === 'interview' ? 'Speaking Tip -' : currentTab === 'random' ? 'Speaking Framework -' : 'Topic Notes -'}
            </div>
            <p className="font-sans text-sm text-paper/80 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
              {getHintContent()}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { val: String(streak).padStart(2, '0'), label: 'streak', color: '#FFC52D' },
            { val: String(sessions).padStart(2, '0'), label: 'sessions', color: '#6C9EB3' },
            { val: avgScore > 0 ? avgScore.toFixed(1) : '-', label: 'avg score', color: '#FCE997' },
          ].map(s => (
            <div key={s.label} className="stat-glass">
              <div className="font-display text-3xl leading-none mb-1" style={{ color: s.color }}>{s.val}</div>
              <div className="font-mono text-xs text-night-light">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
