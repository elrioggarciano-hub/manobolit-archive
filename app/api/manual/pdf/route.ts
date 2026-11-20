import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import fs from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'

// GET /api/manual/pdf - Stream the official active User Manual PDF
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isDownload = searchParams.get('download') === '1'

    // 1. Try to fetch the active manual from Supabase PostgreSQL
    try {
      const dbManual = await prisma.systemManual.findUnique({
        where: { id: 'active-manual' },
      })

      if (dbManual && dbManual.pdfBase64) {
        const buffer = Buffer.from(dbManual.pdfBase64, 'base64')
        const disposition = isDownload ? 'attachment' : 'inline'

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${disposition}; filename="${encodeURIComponent(dbManual.fileName)}"`,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        })
      }
    } catch (dbErr) {
      console.warn('Could not read manual from DB, falling back to static asset:', dbErr)
    }

    // 2. Fallback to bundled static asset
    const staticPdfPath = path.join(process.cwd(), 'public', 'manual', 'ManoboLit-Archive-User-Manual.pdf')
    const buffer = await fs.readFile(staticPdfPath)
    const disposition = isDownload ? 'attachment' : 'inline'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="ManoboLit-Archive-User-Manual.pdf"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (err: any) {
    console.error('Error serving manual PDF:', err)
    return NextResponse.json({ error: 'Manual document not found' }, { status: 404 })
  }
}
