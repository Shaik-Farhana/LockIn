import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

export function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function assertCoreEnv() {
  for (const envName of requiredEnv) {
    getRequiredEnv(envName)
  }
}

export function getBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'session-audio'
}

export function getSupabaseAdmin() {
  assertCoreEnv()
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export function getOpenAIClient() {
  return new OpenAI({ apiKey: getRequiredEnv('OPENAI_API_KEY') })
}

export function getFileExtension(mimeType = 'audio/webm') {
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3'
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}
