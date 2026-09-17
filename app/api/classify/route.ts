import { NextRequest, NextResponse } from 'next/server'
import { classifyEntry } from '@/lib/classification'
import { prisma } from '@/lib/database/prisma'

// POST /api/classify
// Body: { entryId?: string, text: string, additionalContext?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, additionalContext, entryId } = body

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const result = classifyEntry(text, additionalContext || '')

    // If entryId provided, persist classification result
    if (entryId) {
      await prisma.classification.create({
        data: {
          entryId,
          classifiedGenre: result.genre.value,
          classifiedThemes: JSON.stringify(result.themes.map(t => t.value)),
          confidenceScore: result.overallConfidence,
          rulesApplied: JSON.stringify(result.rulesApplied),
        },
      })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('POST /api/classify error:', error)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}
