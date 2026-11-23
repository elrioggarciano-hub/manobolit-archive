// Server-side gazetteer loader: BarangayLocation table first, data/barangay-coordinates.json as fallback.
import { prisma } from './database/prisma'
import { FALLBACK_GAZETTEER, GazetteerEntry } from './geo'

export function locationRowToEntry(row: any): GazetteerEntry {
  let aliases: string[] = []
  try {
    aliases = JSON.parse(row.aliases || '[]')
  } catch {
    aliases = []
  }
  return { barangay: row.barangay, aliases, municipality: row.municipality, province: row.province, lat: row.lat, lng: row.lng, url: row.sourceUrl }
}

export async function getGazetteer(): Promise<GazetteerEntry[]> {
  try {
    const rows = await prisma.barangayLocation.findMany()
    if (rows.length > 0) return rows.map(locationRowToEntry)
  } catch (err: any) {
    console.warn('[Geo] BarangayLocation table unavailable; using data/barangay-coordinates.json:', err.message)
  }
  return FALLBACK_GAZETTEER
}

/** Validates admin input for a barangay location. Returns an error message or null. */
export function validateLocationInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body'
  if (!body.barangay?.trim()) return 'Barangay is required'
  if (!body.municipality?.trim()) return 'Municipality is required'
  if (!body.province?.trim()) return 'Province is required'
  const lat = Number(body.lat)
  const lng = Number(body.lng)
  // The Philippines lies roughly within 4°–22° N and 116°–127° E
  if (!isFinite(lat) || lat < 4 || lat > 22) return 'Latitude must be a decimal number within the Philippines (about 4 to 22)'
  if (!isFinite(lng) || lng < 116 || lng > 127.5) return 'Longitude must be a decimal number within the Philippines (about 116 to 127.5)'
  if (body.sourceUrl && !/^https?:\/\//i.test(body.sourceUrl)) return 'Source must be a web address (https://…)'
  return null
}
