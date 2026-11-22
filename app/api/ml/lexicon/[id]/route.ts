import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { validateLexiconRowInput, lexiconDataFromBody } from '@/lib/translation/lexicon'
import { invalidateLexiconCache } from '@/lib/translation/lexiconStore'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

// PUT /api/ml/lexicon/:id — edit a row, or toggle { isActive } (admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const existing = await prisma.lexiconEntry.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Lexicon entry not found' }, { status: 404 })

    const body = await request.json()
    const onlyToggle = Object.keys(body).length === 1 && 'isActive' in body
    if (onlyToggle) {
      const row = await prisma.lexiconEntry.update({ where: { id: params.id }, data: { isActive: Boolean(body.isActive) } })
      invalidateLexiconCache()
      return NextResponse.json({ row })
    }

    const merged = { ...existing, ...body }
    const invalid = validateLexiconRowInput(merged)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const row = await prisma.lexiconEntry.update({
      where: { id: params.id },
      data: {
        ...lexiconDataFromBody(merged),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    })
    invalidateLexiconCache()
    return NextResponse.json({ row })
  } catch (error) {
    console.error('PUT /api/ml/lexicon/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update lexicon entry' }, { status: 500 })
  }
}

// DELETE /api/ml/lexicon/:id — permanently remove a row (admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.lexiconEntry.delete({ where: { id: params.id } })
    invalidateLexiconCache()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/ml/lexicon/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete lexicon entry' }, { status: 500 })
  }
}
