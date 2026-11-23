// Server-side lexicon loader: LexiconEntry table first, data/lexicon.json as offline fallback.
import { prisma } from '../database/prisma'
import { buildLexicon, Lexicon, LexiconRow } from './lexicon'
import lexiconData from '../../data/lexicon.json'
import { bibleWords } from './bible'

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
      const base = rows.length > 0 ? buildLexicon(rows as LexiconRow[], LEXICON_GROUP_ORDER, 'database') : FALLBACK_LEXICON
      const lexicon = { ...base, attested: await getBibleIndex() }
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

// Words attested in the Agusan Manobo New Testament (BibleVerse table), rebuilt at most once an hour.
const BIBLE_TTL_MS = 60 * 60_000
let bibleCache: { index: Map<string, { ref: string; count: number }>; at: number } | null = null

export async function getBibleIndex(): Promise<Map<string, { ref: string; count: number }>> {
  if (bibleCache && Date.now() - bibleCache.at < BIBLE_TTL_MS) return bibleCache.index
  const index = new Map<string, { ref: string; count: number }>()
  try {
    const verses = await prisma.bibleVerse.findMany({ select: { bookName: true, chapter: true, verse: true, text: true } })
    for (const v of verses) {
      for (const w of bibleWords(v.text)) {
        const hit = index.get(w)
        if (hit) hit.count++
        else index.set(w, { ref: `${v.bookName} ${v.chapter}:${v.verse}`, count: 1 })
      }
    }
  } catch (err: any) {
    console.warn('[Lexicon] Bible attestation index unavailable:', err.message)
  }
  bibleCache = { index, at: Date.now() }
  return index
}

export function invalidateLexiconCache() {
  cached = null
}
