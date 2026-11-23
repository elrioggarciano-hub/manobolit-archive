// Agusan Manobo New Testament ("Kasuyatan to Diyus") — used as a lexical validation reference.
// The text is imported unchanged (format conversion only, as the license permits) into the BibleVerse
// table by `npm run import:bible`, and words are validated by checking whether they are attested in it.

export const BIBLE_TITLE = 'Kasuyatan to Diyus (Agusan Manobo New Testament)'
export const BIBLE_ATTRIBUTION =
  'Kasuyatan to Diyus — The New Testament in Agusan Manobo © 1999 Wycliffe Bible Translators, Inc. ' +
  'Used under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 license, via eBible.org (msmNT).'
export const BIBLE_SOURCE_URL = 'https://ebible.org/find/details.php?id=msmNT'
export const BIBLE_USFM_URL = 'https://eBible.org/Scriptures/msmNT_usfm.zip'

export interface ParsedVerse {
  id: string // e.g. "MAT.5.3"
  book: string // USFM book code, e.g. "MAT"
  bookName: string // e.g. "Mateo"
  chapter: number
  verse: number
  text: string
}

/**
 * Converts one USFM book to verses. Only markup is removed (headings, cross-references, footnotes and
 * paragraph/poetry markers); the words and punctuation of the verse text are kept exactly as published.
 */
export function parseUsfmBook(usfm: string): ParsedVerse[] {
  const src = usfm.replace(/^﻿/, '').replace(/\r/g, '')
  const book = (src.match(/^\\id\s+([A-Z0-9]{3})/m) || [])[1]
  if (!book) return []
  const bookName = ((src.match(/^\\h\s+(.+)$/m) || [])[1] || book).trim()

  const out: ParsedVerse[] = []
  let chapter = 0
  let current: { verse: number; parts: string[] } | null = null
  const flush = () => {
    if (current && chapter > 0) {
      const text = current.parts.join(' ').replace(/\s+/g, ' ').trim()
      if (text) out.push({ id: `${book}.${chapter}.${current.verse}`, book, bookName, chapter, verse: current.verse, text })
    }
    current = null
  }

  // footnotes and cross-reference notes are not Scripture text
  const body = src.replace(/\\f\s[\s\S]*?\\f\*/g, ' ').replace(/\\x\s[\s\S]*?\\x\*/g, ' ')
  for (const line of body.split('\n')) {
    const m = line.match(/^\\([a-z]+[0-9]*)\s?(.*)$/)
    if (!m) {
      if (current && line.trim()) current.parts.push(line.trim())
      continue
    }
    const [, marker, rest] = m
    if (marker === 'c') {
      flush()
      chapter = parseInt(rest, 10) || chapter
    } else if (marker === 'v') {
      flush()
      const vm = rest.match(/^(\d+)[a-z-]*\s*(.*)$/)
      if (vm) current = { verse: parseInt(vm[1], 10), parts: vm[2] ? [vm[2]] : [] }
    } else if (/^(p|m|q\d*|b|nb|pi\d*|li\d*|pm|pmo|mi)$/.test(marker)) {
      // paragraph / poetry markers: the text after them continues the current verse
      if (current && rest.trim()) current.parts.push(rest.trim())
    }
    // headings (\s1, \mt, \h, \toc, \id, \r ...) are skipped
  }
  flush()
  return out
}

/** Words of a text, lowercased, for attestation lookup. */
export function bibleWords(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}]+(?:['-][\p{L}]+)*/gu) || []
}
