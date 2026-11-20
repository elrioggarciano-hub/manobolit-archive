import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

const MANUAL_META_PATH = path.join(process.cwd(), 'public', 'manual', 'manual-meta.json')
const MANUAL_PDF_PATH = path.join(process.cwd(), 'public', 'manual', 'ManoboLit-Archive-User-Manual.pdf')

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
    let metadata = {
      fileName: 'ManoboLit-Archive-User-Manual.pdf',
      fileSize: 4382300,
      fileSizeBytes: '4.18 MB',
      updatedAt: new Date().toISOString(),
      url: '/manual/ManoboLit-Archive-User-Manual.pdf',
      title: 'ManoboLit Archive — Official User Manual',
      subtitle: 'Digital Classification and Retrieval System for Agusan Manobo Oral Literature',
      pageCount: 25,
      authors: 'Elrio G. Garciano & Lorynz W. Dultra',
      institution: 'Agusan del Sur State University (ADSSU) · College of Computing and Information Sciences',
      source: 'SYSTEM_DEFAULT',
      version: '1.0',
    }

    try {
      const data = await fs.readFile(MANUAL_META_PATH, 'utf-8')
      metadata = { ...metadata, ...JSON.parse(data) }
    } catch {
      // Default fallback
    }

    // Verify if PDF file actually exists on disk and get exact size
    try {
      const stats = await fs.stat(MANUAL_PDF_PATH)
      metadata.fileSize = stats.size
      metadata.fileSizeBytes = formatBytes(stats.size)
    } catch {
      // PDF not yet created or missing
    }

    return NextResponse.json(metadata)
  } catch (err: any) {
    console.error('Error fetching manual metadata:', err)
    return NextResponse.json({ error: 'Failed to retrieve manual info' }, { status: 500 })
  }
}

// POST /api/admin/manual - Upload and replace the User Manual PDF
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

    // 4. Ensure directory exists
    const dir = path.dirname(MANUAL_PDF_PATH)
    await fs.mkdir(dir, { recursive: true })

    // 5. Write the uploaded file to public/manual/ManoboLit-Archive-User-Manual.pdf
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(MANUAL_PDF_PATH, buffer)

    // 6. Update metadata JSON
    const metadata = {
      fileName: fileName,
      fileSize: file.size,
      fileSizeBytes: formatBytes(file.size),
      updatedAt: new Date().toISOString(),
      url: `/manual/ManoboLit-Archive-User-Manual.pdf?v=${Date.now()}`,
      title: customTitle,
      subtitle: 'Digital Classification and Retrieval System for Agusan Manobo Oral Literature',
      pageCount: 25,
      authors: 'Elrio G. Garciano & Lorynz W. Dultra',
      institution: 'Agusan del Sur State University (ADSSU) · College of Computing and Information Sciences',
      source: 'CUSTOM_UPLOAD',
      version: customVersion,
    }

    await fs.writeFile(MANUAL_META_PATH, JSON.stringify(metadata, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'User Manual PDF updated successfully!',
      metadata,
    })
  } catch (err: any) {
    console.error('Error uploading manual PDF:', err)
    return NextResponse.json({ error: err.message || 'Failed to save manual PDF' }, { status: 500 })
  }
}
