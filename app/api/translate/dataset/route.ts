import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// GET /api/translate/dataset
// Exports live dynamic parallel corpus for Google Colab and ML training
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const records = await prisma.parallelTranslation.findMany({
      where: { isVerified: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        english: true,
        manobo: true,
        bisaya: true,
        category: true,
        context: true,
        sourceRef: true,
        createdAt: true,
      },
    })

    const summary = {
      totalPairs: records.length,
      phrasesCount: records.filter((r) => r.category === 'PHRASE').length,
      lexiconCount: records.filter((r) => r.category === 'LEXICON').length,
      sentencesCount: records.filter((r) => r.category === 'SENTENCE').length,
      exportedAt: new Date().toISOString(),
      languagePair: 'Agusan Manobo (msm) <-> English (en) <-> Bisaya (ceb)',
    }

    if (format === 'csv') {
      const header = 'id,english,manobo,bisaya,category,sourceRef\n'
      const rows = records
        .map((r) => {
          const escapeCsv = (str: string | null) => `"${(str || '').replace(/"/g, '""')}"`
          return [
            escapeCsv(r.id),
            escapeCsv(r.english),
            escapeCsv(r.manobo),
            escapeCsv(r.bisaya),
            escapeCsv(r.category),
            escapeCsv(r.sourceRef),
          ].join(',')
        })
        .join('\n')

      return new NextResponse(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="manobolit_parallel_corpus.csv"',
        },
      })
    }

    return NextResponse.json({
      summary,
      dataset: records,
    })
  } catch (error) {
    console.error('GET /api/translate/dataset error:', error)
    return NextResponse.json({ error: 'Failed to export parallel dataset' }, { status: 500 })
  }
}

// POST /api/translate/dataset
// Add new parallel translation pair
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { english, manobo, bisaya, category, context, sourceRef } = body

    if (!english || !manobo) {
      return NextResponse.json({ error: 'English and Manobo texts are required' }, { status: 400 })
    }

    const created = await prisma.parallelTranslation.create({
      data: {
        english: english.toLowerCase().trim(),
        manobo: manobo.toLowerCase().trim(),
        bisaya: (bisaya || '').toLowerCase().trim(),
        category: category || 'PHRASE',
        context: context || 'User Submission',
        sourceRef: sourceRef || 'Manual Entry',
        isVerified: true,
      },
    })

    return NextResponse.json({ success: true, entry: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/translate/dataset error:', error)
    return NextResponse.json({ error: 'Failed to add parallel translation' }, { status: 500 })
  }
}
