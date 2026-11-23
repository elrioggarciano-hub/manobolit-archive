import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { aiAlignTranscript, mimeFor } from '@/lib/transcriptSyncAI'

export const maxDuration = 60

// POST /api/entries/:id/sync/ai — Gemini listens to the recording and proposes line timings (not saved).
// The editor then snaps them to the exact acoustic onsets and a reviewer confirms before saving.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const entry = await prisma.literatureEntry.findUnique({
      where: { id: params.id },
      select: { audioFile: true, transcription: true, genre: true, type: true },
    })
    if (!entry?.audioFile) return NextResponse.json({ error: 'This entry has no audio recording' }, { status: 400 })
    if (!entry.transcription?.trim()) return NextResponse.json({ error: 'This entry has no transcription' }, { status: 400 })

    const audioUrl = entry.audioFile.startsWith('http') ? entry.audioFile : new URL(entry.audioFile, request.url).toString()
    const res = await fetch(audioUrl)
    if (!res.ok) return NextResponse.json({ error: `Could not load the recording (HTTP ${res.status})` }, { status: 502 })
    const audio = Buffer.from(await res.arrayBuffer())
    if (audio.length > 18 * 1024 * 1024) return NextResponse.json({ error: 'Recording is too large for AI alignment (max 18 MB)' }, { status: 413 })

    const kind = entry.genre === 'SONG' || entry.type === 'FOLK_SONG' ? 'folk song' : `${entry.genre.toLowerCase()} narration`
    const result = await aiAlignTranscript(audio, mimeFor(entry.audioFile), entry.transcription, kind)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('POST /api/entries/[id]/sync/ai error:', error)
    return NextResponse.json({ error: error.message || 'AI alignment failed' }, { status: 500 })
  }
}
