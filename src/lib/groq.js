const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

export async function analyzeTranscript(transcript, topic) {
    if (!transcript || transcript.trim().length < 30) return null

    const prompt = `You are a communication coach analyzing a 5-minute speaking session.

Topic the speaker was given: "${topic}"

Transcript of what they said:
"${transcript}"

Respond ONLY with valid JSON in exactly this format, no extra text:
{
  "score": <number 1-10>,
  "clarity": <number 1-10>,
  "confidence": <number 1-10>,
  "structure": <number 1-10>,
  "vocabulary": <number 1-10>,
  "pacing": <number 1-10>,
  "filler_count": <total count of um/uh/like/basically/you know>,
  "feedback": "<2-3 sentence coaching summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"]
}`

    try {
        const res = await fetch(GROQ_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 400,
            }),
        })

        if (!res.ok) throw new Error('Groq API failed')
        const data = await res.json()
        const text = data.choices[0]?.message?.content || ''

        // Extract JSON safely
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON in response')
        return JSON.parse(jsonMatch[0])
    } catch (err) {
        console.error('AI analysis failed:', err)
        return null
    }
}