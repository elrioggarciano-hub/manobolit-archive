import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

const BUCKET = 'audio'
// Kept comfortably under Vercel's ~4.5MB request body ceiling for
// serverless Route Handlers — anything larger is rejected by the platform
// itself before this code ever runs, as a non-JSON error page.
const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']

// POST /api/upload-audio — uploads a recording to Supabase Storage and
// returns its public URL, so entries can reference real audio instead of
// a hand-typed local path.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 4MB.' }, { status: 413 })
    }

    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload an MP3, WAV, OGG, or M4A file.' }, { status: 415 })
    }

    const bytes = await file.arrayBuffer()
    const ext = (file.name.split('.').pop() || 'mp3').toLowerCase()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type || 'audio/mpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed. Make sure the "audio" storage bucket exists in Supabase.' }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    console.error('POST /api/upload-audio error:', error)
    return NextResponse.json({ error: 'Failed to upload audio file.' }, { status: 500 })
  }
}
