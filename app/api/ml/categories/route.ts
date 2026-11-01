import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function GET() {
  try {
    const categories = await prisma.categoryDefinition.findMany({
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    })
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('GET /api/ml/categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthed = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, type, title, framework, description, isDraft } = body

    if (!code || !type || !title || !description) {
      return NextResponse.json({ error: 'Missing required category fields' }, { status: 400 })
    }

    const category = await prisma.categoryDefinition.upsert({
      where: { code: code.toUpperCase() },
      update: {
        title,
        framework: framework || 'EUGENIO_1993',
        description,
        isDraft: Boolean(isDraft),
        approvedBy: isDraft ? null : 'admin',
        approvedAt: isDraft ? null : new Date(),
      },
      create: {
        code: code.toUpperCase(),
        type,
        title,
        framework: framework || 'EUGENIO_1993',
        description,
        isDraft: Boolean(isDraft),
        approvedBy: isDraft ? null : 'admin',
        approvedAt: isDraft ? null : new Date(),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('POST /api/ml/categories error:', error)
    return NextResponse.json({ error: 'Failed to save category definition' }, { status: 500 })
  }
}
