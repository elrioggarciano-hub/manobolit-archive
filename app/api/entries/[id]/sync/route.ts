import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { validateSegments } from '@/lib/transcriptSync'

// PUT /api/entries/:id/sync — save (or clear with { segments: null }) the synchronized transcript line timings
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => null)
    const segments = body?.segments ?? null
    if (segments !== null) {
      const invalid = validateSegments(segments)
      if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
    }

    const entry = await prisma.literatureEntry.findUnique({ where: { id: params.id }, select: { id: true, audioFile: true } })
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    if (segments !== null && !entry.audioFile) {
      return NextResponse.json({ error: 'This entry has no audio recording to synchronize with' }, { status: 400 })
    }

    await prisma.literatureEntry.update({
      where: { id: params.id },
      data: {
        transcriptSync:
          segments === null
            ? null
            : JSON.stringify(segments.map((s: { start: number; text: string }) => ({ start: Math.round(s.start * 10) / 10, text: s.text.trim() }))),
      },
    })
    revalidateTag('entries')
    revalidatePath(`/archive/${params.id}`)
    return NextResponse.json({ success: true, lines: segments ? segments.length : 0 })
  } catch (error) {
    console.error('PUT /api/entries/[id]/sync error:', error)
    return NextResponse.json({ error: 'Failed to save transcript timings' }, { status: 500 })
  }
}
