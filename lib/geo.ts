// Barangay coordinates for the regional map. The coordinates are data (data/barangay-coordinates.json,
// verified against PhilAtlas barangay profiles), not code. Locations without verified coordinates are
// reported as "not mapped" instead of being placed at a guessed position.
import gazetteer from '../data/barangay-coordinates.json'

interface GazetteerEntry {
  barangay: string
  aliases?: string[]
  municipality: string
  province: string
  lat: number
  lng: number
  url: string
}

const norm = (s: string | null | undefined) =>
  (s || '').toLowerCase().replace(/\b(brgy|barangay)\.?\s*/g, '').replace(/\./g, '').replace(/\s+/g, ' ').trim()

const INDEX = new Map<string, GazetteerEntry>()
for (const g of (gazetteer as { barangays: GazetteerEntry[] }).barangays) {
  for (const name of [g.barangay, ...(g.aliases || [])]) INDEX.set(`${norm(name)}|${norm(g.municipality)}`, g)
}

/** Canonical barangay entry for a recorded barangay + municipality, or null if not in the gazetteer. */
export function lookupBarangay(barangay: string | null | undefined, municipality: string | null | undefined): GazetteerEntry | null {
  return INDEX.get(`${norm(barangay)}|${norm(municipality)}`) ?? null
}

export interface LocationStat {
  /** display label, e.g. "Brgy. Tudela, Trento" */
  location: string
  barangay: string
  municipality: string
  province: string
  count: number
  /** verified coordinates, or null when the barangay is not in the gazetteer */
  coords: [number, number] | null
  source?: string
}

/** Counts entries per barangay (not per free-text sitio), with verified coordinates attached. */
export function aggregateLocations(
  entries: { barangay?: string | null; communityLocation?: string | null; municipality: string; province: string }[]
): LocationStat[] {
  const groups = new Map<string, LocationStat>()
  for (const e of entries) {
    const g = lookupBarangay(e.barangay, e.municipality)
    const barangay = g?.barangay || (e.barangay || '').trim() || (e.communityLocation || '').trim() || 'Unspecified'
    const key = `${norm(barangay)}|${norm(e.municipality)}`
    const stat = groups.get(key) ?? {
      location: `Brgy. ${barangay}, ${e.municipality}`,
      barangay,
      municipality: e.municipality,
      province: e.province,
      count: 0,
      coords: g ? ([g.lat, g.lng] as [number, number]) : null,
      source: g?.url,
    }
    stat.count++
    groups.set(key, stat)
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count)
}
