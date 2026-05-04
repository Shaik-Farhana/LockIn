import { getBucketName, getFileExtension, getSupabaseAdmin } from './_lib/admin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { userId, mimeType } = req.body || {}
    if (!userId) {
      res.status(400).json({ error: 'userId is required' })
      return
    }

    const bucket = getBucketName()
    const extension = getFileExtension(mimeType)
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({
      bucket,
      path,
      token: data.token,
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create upload URL' })
  }
}
