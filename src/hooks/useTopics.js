import { useState, useCallback } from 'react'

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1/page/random/summary'

const BAD_PATTERNS = [
  /\b(compound|enzyme|protein|chromosome|genus|species|taxon|isomer|peptide|nucleotide|alkaloid|fungal|bacterium|bacteria|phylum|amino acid|chemical formula|CAS number|IUPAC)\b/i,
  /\b(discography|filmography|bibliography|list of|index of)\b/i,
  /^\d{4}s?\s/,
  /\b(municipality|commune|canton|arrondissement|oblast|raion)\b/i,
  /\(disambiguation\)/i,
]

function isGoodTopic(data) {
  if (!data.extract || data.extract.length < 200) return false
  if (data.type === 'disambiguation') return false
  const text = data.title + ' ' + data.extract
  return !BAD_PATTERNS.some(pattern => pattern.test(text))
}

function getSearchTerm(difficulty) {
  const searchTerms = {
    easy: ['communication skills', 'motivation', 'education', 'health', 'creativity'],
    medium: ['technology ethics', 'social change', 'leadership', 'economics', 'psychology'],
    hard: ['artificial intelligence ethics', 'climate policy', 'philosophy', 'political economy', 'systems thinking'],
  }
  const terms = searchTerms[difficulty] || searchTerms.easy
  return terms[Math.floor(Math.random() * terms.length)]
}

function buildSpeakingBrief(title, extract) {
  const cleanExtract = extract.replace(/\s+/g, ' ').trim()
  const words = cleanExtract.split(' ')
  const base = words.slice(0, Math.max(95, Math.min(words.length, 150))).join(' ')

  if (base.split(' ').length >= 100) return base

  return `${base} For a five-minute speaking round, start by defining what "${title}" means in simple language, then explain why people should care about it today. Add one real-world example, compare two sides of the issue, and finish with your own opinion. Try to sound curious instead of rushed: what is the problem, who is affected, what trade-off exists, and what lesson can the listener take away?`
}

function estimateReadTime(text) {
  const words = text.split(' ').length
  const mins = Math.max(1, Math.round(words / 200))
  return `~${mins} min read`
}

async function fetchRandomWikiTopic(attempt = 0) {
  if (attempt > 8) throw new Error('max retries')
  const res = await fetch(WIKI_API)
  if (!res.ok) throw new Error('fetch failed')
  const data = await res.json()
  if (!isGoodTopic(data)) return fetchRandomWikiTopic(attempt + 1)
  return data
}

const FALLBACK_TOPICS = [
  {
    title: 'The Art of Active Listening',
    summary: 'Active listening is one of the most underrated communication skills because it changes the quality of every conversation. It means giving full attention, noticing tone and body language, asking clarifying questions, and reflecting back the main idea before responding. Most people listen only long enough to prepare their next sentence, which makes discussions feel rushed and shallow. In a five-minute explanation, you can describe why active listening builds trust, reduces conflict, and helps teams solve problems faster. Use a personal example, then explain one practical habit: pause before replying, summarize what you heard, and ask whether you understood correctly.',
    difficulty: 'easy',
    readTime: '~2 min read',
  },
  {
    title: 'Why Storytelling Matters in Business',
    summary: 'Data can inform people, but stories often persuade them. In business communication, a strong story turns abstract numbers into a clear human situation: a problem, a decision, a journey, and a result. Leaders use storytelling to make strategy memorable, explain change, and help teams understand why their work matters. For a five-minute speaking round, compare a plain statistic with a short story about a customer or team member affected by that statistic. Then explain the structure of a useful business story: context, conflict, action, outcome, and lesson. The goal is not drama; it is clarity, emotional connection, and better recall.',
    difficulty: 'medium',
    readTime: '~3 min read',
  },
  {
    title: 'The Science of First Impressions',
    summary: 'First impressions form quickly because people use small signals to make fast judgments about confidence, warmth, and competence. Voice tone, posture, eye contact, facial expression, and word choice all influence how someone reads you before they know your full story. The useful point is that first impressions are not magic; they can be improved with preparation and awareness. In a five-minute explanation, discuss both sides: quick judgments can be unfair, but they also help people navigate social situations. Add practical advice such as opening with calm energy, speaking clearly, listening well, and matching your body language to your message.',
    difficulty: 'easy',
    readTime: '~2 min read',
  },
  {
    title: 'How to Disagree Without Being Disagreeable',
    summary: 'Disagreement is inevitable in teams, classrooms, interviews, and friendships, but the way we disagree decides whether the conversation becomes useful or tense. A good disagreement starts by acknowledging the other person\'s point before challenging it. This shows respect and lowers defensiveness. Then focus on the idea, not the person, and explain your reasoning with examples instead of insults or vague opinions. For a five-minute speaking round, describe a workplace or study situation where disagreement improved the final decision. End with a simple framework: listen, validate, question, explain, and invite a better solution together.',
    difficulty: 'medium',
    readTime: '~2 min read',
  },
  {
    title: 'The Power of Silence in Communication',
    summary: 'Silence can feel uncomfortable, but skilled speakers use it as a tool. A pause gives listeners time to process an important idea, makes a sentence feel more confident, and prevents filler words from weakening the message. In conversations, silence can also invite the other person to share more instead of feeling interrupted. For a five-minute speaking round, explain why people often rush to fill quiet moments and how that habit can make them sound less certain. Then give examples from interviews, presentations, and difficult conversations. The key lesson is simple: silence is not empty; it can create emphasis, control, and trust.',
    difficulty: 'easy',
    readTime: '~2 min read',
  },
]

export function useTopics() {
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('wikipedia')

  const fetchTopic = useCallback(async (difficulty = 'easy') => {
    setLoading(true)
    setError(null)

    try {
      const searchTerm = getSearchTerm(difficulty)
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&utf8=&format=json&origin=*`)
      if (!searchRes.ok) throw new Error('Search failed')
      const searchData = await searchRes.json()

      let titleToFetch = null
      if (searchData.query?.search?.length > 0) {
        const topResults = searchData.query.search.slice(0, 10)
        const randomResult = topResults[Math.floor(Math.random() * topResults.length)]
        titleToFetch = randomResult.title
      }

      const fetchUrl = titleToFetch
        ? `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleToFetch)}`
        : WIKI_API

      const res = await fetch(fetchUrl)
      if (!res.ok) throw new Error('fetch failed')
      let data = await res.json()

      if (!isGoodTopic(data)) data = await fetchRandomWikiTopic()

      const summary = buildSpeakingBrief(data.title, data.extract)
      setTopic({
        title: data.title,
        summary,
        url: data.content_urls?.desktop?.page || '',
        source: 'wikipedia',
        difficulty,
        readTime: estimateReadTime(summary),
        type: 'daily',
      })
      setSource('wikipedia')
    } catch (err) {
      const matchingFallbacks = FALLBACK_TOPICS.filter(topic => topic.difficulty === difficulty)
      const pool = matchingFallbacks.length > 0 ? matchingFallbacks : FALLBACK_TOPICS
      const fallback = pool[Math.floor(Math.random() * pool.length)]
      setTopic({ ...fallback, source: 'curated', type: 'daily' })
      setSource('curated')
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { topic, loading, error, source, fetchTopic }
}
