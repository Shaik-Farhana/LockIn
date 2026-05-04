import { getBucketName, getOpenAIClient, getSupabaseAdmin } from './_lib/admin.js'
import { toFile } from 'openai'

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function normalizeAnalysis(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      summary: 'Your response has been recorded. Keep practicing concise structure and confident delivery.',
      strengths: [],
      improvements: [],
      drills: [],
      scores: { clarity: 0, structure: 0, delivery: 0, language: 0, overall: 0 },
    }
  }

  const scores = raw.scores || {}
  const numeric = (value) => {
    const num = Number(value)
    if (Number.isNaN(num)) return 0
    return Math.max(0, Math.min(10, Math.round(num * 10) / 10))
  }

  const overall = numeric(
    scores.overall || ((numeric(scores.clarity) + numeric(scores.structure) + numeric(scores.delivery) + numeric(scores.language)) / 4)
  )

  return {
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    strengths: Array.isArray(raw.strengths) ? raw.strengths.slice(0, 4) : [],
    improvements: Array.isArray(raw.improvements) ? raw.improvements.slice(0, 4) : [],
    drills: Array.isArray(raw.drills) ? raw.drills.slice(0, 4) : [],
    scores: {
      clarity: numeric(scores.clarity),
      structure: numeric(scores.structure),
      delivery: numeric(scores.delivery),
      language: numeric(scores.language),
      overall,
    },
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { userId, topic, audioPath, durationSeconds, mimeType = 'audio/webm' } = req.body || {}
    if (!userId || !audioPath || !topic?.title) {
      res.status(400).json({ error: 'userId, topic.title, and audioPath are required' })
      return
    }

    const supabase = getSupabaseAdmin()
    const openai = getOpenAIClient()
    const bucket = getBucketName()

    const { data: audioBlob, error: downloadError } = await supabase.storage.from(bucket).download(audioPath)
    if (downloadError || !audioBlob) {
      res.status(500).json({ error: downloadError?.message || 'Audio download failed' })
      return
    }

    const audioArrayBuffer = await audioBlob.arrayBuffer()
    const filename = audioPath.split('/').pop() || 'session.webm'
    const audioFile = await toFile(Buffer.from(audioArrayBuffer), filename, {
      type: mimeType,
    })

    const transcriptResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe',
    })

    const transcript = transcriptResponse.text || ''

    const feedbackResponse = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You are a speaking coach. Return strict JSON only with keys: summary (string), strengths (string[]), improvements (string[]), drills (string[]), scores ({clarity:number, structure:number, delivery:number, language:number, overall:number}). Score range: 0-10.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Topic: ${topic.title}\nDifficulty: ${topic.difficulty || 'unknown'}\nDuration seconds: ${durationSeconds || 0}\n\nTranscript:\n${transcript}`,
            },
          ],
        },
      ],
    })

    const parsedAnalysis = normalizeAnalysis(safeJsonParse(feedbackResponse.output_text))

    const insertPayload = {
      user_id: userId,
      topic_title: topic.title,
      topic_source: topic.source || 'unknown',
      topic_difficulty: topic.difficulty || 'unknown',
      duration_seconds: Number(durationSeconds) || 0,
      audio_path: audioPath,
      transcript,
      ai_feedback: parsedAnalysis,
      overall_score: parsedAnalysis.scores.overall,
      completed_at: new Date().toISOString(),
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from('practice_sessions')
      .insert(insertPayload)
      .select('id, topic_title, overall_score, completed_at')
      .limit(1)

    if (insertError) {
      res.status(500).json({ error: insertError.message })
      return
    }

    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(audioPath, 60 * 60 * 24 * 7)

    res.status(200).json({
      session: insertedRows?.[0] || null,
      transcript,
      analysis: parsedAnalysis,
      audioUrl: signedData?.signedUrl || null,
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to analyze session' })
  }
}
