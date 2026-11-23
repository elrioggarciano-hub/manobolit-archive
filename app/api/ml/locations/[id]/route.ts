import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { validateLocationInput } from '@/lib/geoStore'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

const aliasList = (v: unknown) =>
  Array.isArray(v) ? v.map(String) : typeof v === 'string' ? v.split(',') : []

// PUT /api/ml/locations/:id — edit a barangay location (admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const existing = await prisma.barangayLocation.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    const body = await request.json()
    const merged = { ...existing, ...body }
    const invalid = validateLocationInput(merged)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
    const location = await prisma.barangayLocation.update({
      where: { id: params.id },
      data: {
        barangay: String(merged.barangay).trim(),
        aliases: JSON.stringify(
          body.aliases !== undefined ? aliasList(body.aliases).map(a => a.trim()).filter(Boolean) : JSON.parse(existing.aliases || '[]')
        ),
        municipality: String(merged.municipality).trim(),
        province: String(merged.province).trim(),
        lat: Number(merged.lat),
        lng: Number(merged.lng),
        sourceUrl: merged.sourceUrl ? String(merged.sourceUrl).trim() : null,
      },
    })
    revalidateTag('entries')
    return NextResponse.json({ location })
  } catch (error) {
    console.error('PUT /api/ml/locations/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

// DELETE /api/ml/locations/:id (admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.barangayLocation.delete({ where: { id: params.id } })
    revalidateTag('entries')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/ml/locations/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}
