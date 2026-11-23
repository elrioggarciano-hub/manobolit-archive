// Barangay coordinates for the regional map. Coordinates are data, not code: they live in the
// BarangayLocation table (managed in Admin → Dataset & Taxonomies → Barangay locations), with
// data/barangay-coordinates.json as the seed/fallback. Locations without verified coordinates are
// reported as "not mapped" instead of being placed at a guessed position.
import fallbackGazetteer from '../data/barangay-coordinates.json'

export interface GazetteerEntry {
  barangay: string
  aliases?: string[]
  municipality: string
  province: string
  lat: number
  lng: number
  url?: string | null
}

export const FALLBACK_GAZETTEER: GazetteerEntry[] = (fallbackGazetteer as { barangays: GazetteerEntry[] }).barangays

export const normPlace = (s: string | null | undefined) =>
  (s || '').toLowerCase().replace(/\b(brgy|barangay)\.?\s*/g, '').replace(/\./g, '').replace(/\s+/g, ' ').trim()

function buildIndex(gazetteer: GazetteerEntry[]) {
  const index = new Map<string, GazetteerEntry>()
  for (const g of gazetteer) {
    for (const name of [g.barangay, ...(g.aliases || [])]) index.set(`${normPlace(name)}|${normPlace(g.municipality)}`, g)
  }
  return index
}

/** Canonical barangay entry for a recorded barangay + municipality, or null if not in the gazetteer. */
export function lookupBarangay(
  barangay: string | null | undefined,
  municipality: string | null | undefined,
  gazetteer: GazetteerEntry[] = FALLBACK_GAZETTEER
): GazetteerEntry | null {
  return buildIndex(gazetteer).get(`${normPlace(barangay)}|${normPlace(municipality)}`) ?? null
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
  source?: string | null
}

/** Counts entries per barangay (not per free-text sitio), with verified coordinates attached. */
export function aggregateLocations(
  entries: { barangay?: string | null; communityLocation?: string | null; municipality: string; province: string }[],
  gazetteer: GazetteerEntry[] = FALLBACK_GAZETTEER
): LocationStat[] {
  const index = buildIndex(gazetteer)
  const groups = new Map<string, LocationStat>()
  for (const e of entries) {
    const g = index.get(`${normPlace(e.barangay)}|${normPlace(e.municipality)}`) ?? null
    const barangay = g?.barangay || (e.barangay || '').trim() || (e.communityLocation || '').trim() || 'Unspecified'
    const key = `${normPlace(barangay)}|${normPlace(e.municipality)}`
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
