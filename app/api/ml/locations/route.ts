import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { getGazetteer, validateLocationInput } from '@/lib/geoStore'
import { aggregateLocations } from '@/lib/geo'

export const dynamic = 'force-dynamic'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

const aliasList = (v: unknown) =>
  Array.isArray(v) ? v.map(String) : typeof v === 'string' ? v.split(',') : []

// GET /api/ml/locations — barangay coordinates + archive barangays that are not mapped yet (admin)
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [rows, entries, gazetteer] = await Promise.all([
      prisma.barangayLocation.findMany({ orderBy: [{ municipality: 'asc' }, { barangay: 'asc' }] }),
      prisma.literatureEntry.findMany({ select: { barangay: true, communityLocation: true, municipality: true, province: true } }),
      getGazetteer(),
    ])
    const unmapped = aggregateLocations(entries, gazetteer).filter(l => !l.coords)
    return NextResponse.json({ locations: rows.map(r => ({ ...r, aliases: JSON.parse(r.aliases || '[]') })), unmapped })
  } catch (error) {
    console.error('GET /api/ml/locations error:', error)
    return NextResponse.json(
      { error: 'Could not load barangay locations. Has the migration been applied and the table seeded (npm run seed:locations)?' },
      { status: 500 }
    )
  }
}

// POST /api/ml/locations — add a barangay with verified coordinates (admin)
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const invalid = validateLocationInput(body)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
    const exists = await prisma.barangayLocation.findUnique({
      where: { barangay_municipality: { barangay: body.barangay.trim(), municipality: body.municipality.trim() } },
    })
    if (exists) return NextResponse.json({ error: 'This barangay is already listed — edit it instead' }, { status: 409 })
    const location = await prisma.barangayLocation.create({
      data: {
        barangay: body.barangay.trim(),
        aliases: JSON.stringify(aliasList(body.aliases).map(a => a.trim()).filter(Boolean)),
        municipality: body.municipality.trim(),
        province: body.province.trim(),
        lat: Number(body.lat),
        lng: Number(body.lng),
        sourceUrl: body.sourceUrl?.trim() || null,
      },
    })
    revalidateTag('entries') // refresh dashboard and entry maps
    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('POST /api/ml/locations error:', error)
    return NextResponse.json({ error: 'Failed to add location' }, { status: 500 })
  }
}
