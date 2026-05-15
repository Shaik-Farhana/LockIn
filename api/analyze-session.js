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
      score: 0,
      clarity: 0,
      confidence: 0,
      structure: 0,
      vocabulary: 0,
      pacing: 0,
      filler_count: 0,
      feedback: 'Your response has been recorded. Keep practicing concise structure and confident delivery.',
      strengths: [],
      improvements: [],
    }
  }

  const numeric = (value) => {
    const num = Number(value)
    if (Number.isNaN(num)) return 0
    return Math.max(0, Math.min(10, Math.round(num * 10) / 10))
  }

  return {
    score: numeric(raw.score),
    clarity: numeric(raw.clarity),
    confidence: numeric(raw.confidence),
    structure: numeric(raw.structure),
    vocabulary: numeric(raw.vocabulary),
    pacing: numeric(raw.pacing),
    filler_count: Math.max(0, Math.round(Number(raw.filler_count) || 0)),
    feedback: typeof raw.feedback === 'string' ? raw.feedback : '',
    strengths: Array.isArray(raw.strengths) ? raw.strengths.slice(0, 4) : [],
    improvements: Array.isArray(raw.improvements) ? raw.improvements.slice(0, 4) : [],
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
              text: 'You are a speaking coach. Return strict JSON only with keys: score, clarity, confidence, structure, vocabulary, pacing, filler_count, feedback, strengths, improvements. All scores use a 0-10 scale.',
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

    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(audioPath, 60 * 60 * 24 * 7)

    res.status(200).json({
      transcript,
      analysis: parsedAnalysis,
      audioUrl: signedData?.signedUrl || null,
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to analyze session' })
  }
}
