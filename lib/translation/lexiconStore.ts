// Server-side lexicon loader: LexiconEntry table first, data/lexicon.json as offline fallback.
import { prisma } from '../database/prisma'
import { buildLexicon, Lexicon, LexiconRow } from './lexicon'
import lexiconData from '../../data/lexicon.json'

const fallbackData = lexiconData as { groupOrder: string[]; entries: LexiconRow[] }
export const FALLBACK_LEXICON: Lexicon = buildLexicon(fallbackData.entries, fallbackData.groupOrder, 'fallback-json')
export const LEXICON_GROUP_ORDER = fallbackData.groupOrder

const CACHE_TTL_MS = 60_000
let cached: { lexicon: Lexicon; at: number } | null = null
let inflight: Promise<Lexicon> | null = null

/** Active lexicon from the database (cached for a minute); falls back to the bundled JSON. */
export async function getLexicon(): Promise<Lexicon> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.lexicon
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const rows = await prisma.lexiconEntry.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
      const lexicon = rows.length > 0 ? buildLexicon(rows as LexiconRow[], LEXICON_GROUP_ORDER, 'database') : FALLBACK_LEXICON
      cached = { lexicon, at: Date.now() }
      return lexicon
    } catch (err: any) {
      console.warn('[Lexicon] Database lexicon unavailable; using data/lexicon.json:', err.message)
      return cached?.lexicon ?? FALLBACK_LEXICON
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function invalidateLexiconCache() {
  cached = null
}
