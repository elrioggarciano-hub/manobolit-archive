import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// GET /api/admin/manual - Retrieve active User Manual metadata
export async function GET() {
  try {
    // 1. Try to fetch from PostgreSQL
    try {
      const record = await prisma.systemManual.findUnique({
        where: { id: 'active-manual' },
      })

      if (record) {
        return NextResponse.json({
          fileName: record.fileName,
          fileSize: record.fileSize,
          fileSizeBytes: record.fileSizeBytes,
          updatedAt: record.updatedAt.toISOString(),
          url: `/api/manual/pdf?v=${new Date(record.updatedAt).getTime()}`,
          title: record.title || 'ManoboLit Archive — Official User Manual',
          subtitle: 'Digital Classification and Retrieval System for Agusan Manobo Oral Literature',
          pageCount: 25,
          authors: 'Elrio G. Garciano & Lorynz W. Dultra',
          institution: 'Agusan del Sur State University (ADSSU) · College of Computing and Information Sciences',
          source: 'DATABASE_STORAGE',
          version: record.version || '1.0',
        })
      }
    } catch (dbErr) {
      console.warn('DB lookup failed, returning default metadata:', dbErr)
    }

    // Default metadata fallback
    return NextResponse.json({
      fileName: 'ManoboLit-Archive-User-Manual.pdf',
      fileSize: 4382300,
      fileSizeBytes: '4.18 MB',
      updatedAt: new Date().toISOString(),
      url: '/api/manual/pdf',
      title: 'ManoboLit Archive — Official User Manual',
      subtitle: 'Digital Classification and Retrieval System for Agusan Manobo Oral Literature',
      pageCount: 25,
      authors: 'Elrio G. Garciano & Lorynz W. Dultra',
      institution: 'Agusan del Sur State University (ADSSU) · College of Computing and Information Sciences',
      source: 'SYSTEM_DEFAULT',
      version: '1.0',
    })
  } catch (err: any) {
    console.error('Error fetching manual metadata:', err)
    return NextResponse.json({ error: 'Failed to retrieve manual info' }, { status: 500 })
  }
}

// POST /api/admin/manual - Upload and replace the User Manual PDF in Supabase PostgreSQL
export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin session
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const isAuthed = await verifySessionToken(sessionCookie)
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 })
    }

    // 2. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const customTitle = (formData.get('title') as string) || 'ManoboLit Archive — Official User Manual'
    const customVersion = (formData.get('version') as string) || '1.0'

    if (!file) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 })
    }

    // 3. Validate file type
    const fileName = file.name || 'manual.pdf'
    if (!fileName.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF documents (.pdf) are permitted' }, { status: 400 })
    }

    // Maximum 25MB limit
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum allowable limit of 25MB' }, { status: 400 })
    }

    // 4. Read file into base64 buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')
    const fileSizeBytes = formatBytes(file.size)

    // 5. Save directly into Supabase PostgreSQL (read-only filesystem safe on Vercel!)
    const saved = await prisma.systemManual.upsert({
      where: { id: 'active-manual' },
      create: {
        id: 'active-manual',
        fileName: fileName,
        fileSizeBytes: fileSizeBytes,
        fileSize: file.size,
        mimeType: 'application/pdf',
        pdfBase64: base64Data,
        title: customTitle,
        version: customVersion,
      },
      update: {
        fileName: fileName,
        fileSizeBytes: fileSizeBytes,
        fileSize: file.size,
        mimeType: 'application/pdf',
        pdfBase64: base64Data,
        title: customTitle,
        version: customVersion,
      },
    })

    const metadata = {
      fileName: saved.fileName,
      fileSize: saved.fileSize,
      fileSizeBytes: saved.fileSizeBytes,
      updatedAt: saved.updatedAt.toISOString(),
      url: `/api/manual/pdf?v=${new Date(saved.updatedAt).getTime()}`,
      title: saved.title,
      subtitle: 'Digital Classification and Retrieval System for Agusan Manobo Oral Literature',
      pageCount: 25,
      authors: 'Elrio G. Garciano & Lorynz W. Dultra',
      institution: 'Agusan del Sur State University (ADSSU) · College of Computing and Information Sciences',
      source: 'DATABASE_STORAGE',
      version: saved.version,
    }

    return NextResponse.json({
      success: true,
      message: 'User Manual PDF uploaded and published to Supabase database successfully!',
      metadata,
    })
  } catch (err: any) {
    console.error('Error uploading manual PDF:', err)
    return NextResponse.json({ error: err.message || 'Failed to save manual PDF' }, { status: 500 })
  }
}
