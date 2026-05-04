import { getBucketName, getSupabaseAdmin } from './_lib/admin.js'

function computeStreakFromSessions(rows) {
  if (!rows.length) return 0
  const uniqueDays = [...new Set(rows.map((row) => new Date(row.completed_at).toISOString().slice(0, 10)))]
  uniqueDays.sort((a, b) => (a < b ? 1 : -1))

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prev = new Date(`${uniqueDays[i - 1]}T00:00:00.000Z`)
    const curr = new Date(`${uniqueDays[i]}T00:00:00.000Z`)
    const diffDays = Math.round((prev - curr) / (24 * 60 * 60 * 1000))
    if (diffDays === 1) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const userId = req.query.userId
    if (!userId) {
      res.status(400).json({ error: 'userId is required' })
      return
    }

    const supabase = getSupabaseAdmin()
    const bucket = getBucketName()
    const { data: rows, error } = await supabase
      .from('practice_sessions')
      .select('id, topic_title, topic_source, overall_score, duration_seconds, completed_at, transcript, ai_feedback, audio_path')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(30)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    const sessions = rows || []
    const totalSessions = sessions.length
    const scored = sessions.filter((session) => typeof session.overall_score === 'number')
    const avgScore = scored.length
      ? Math.round((scored.reduce((sum, session) => sum + session.overall_score, 0) / scored.length) * 10) / 10
      : 0
    const streak = computeStreakFromSessions(sessions)

    const recent = await Promise.all(
      sessions.slice(0, 8).map(async (session) => {
        let audioUrl = null
        if (session.audio_path) {
          const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(session.audio_path, 60 * 60 * 24)
          audioUrl = signed?.signedUrl || null
        }
        return {
          ...session,
          audio_url: audioUrl,
        }
      })
    )

    res.status(200).json({
      stats: {
        totalSessions,
        avgScore,
        streak,
      },
      recent,
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch sessions' })
  }
}
