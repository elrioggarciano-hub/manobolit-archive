// Text cleaning and descriptor stripping for ManoboLit Classification Module
// Enforces academic honesty by separating oral text from editorial formatting and metadata.

/**
 * Strips editorial riddle answers ('Answer: ...' or Bisaya 'Tubag: ...') from text.
 */
export function stripRiddleAnswer(text: string): string {
  if (!text) return ''
  return text.replace(/\b(?:Answer|Tubag)\s*:[^\n\r]*/gi, ' ').trim()
}

// Without 'g' flag for reliable .test()
const DESCRIPTOR_TEST_REGEX = /\b(riddles?|tigmo|proverbs?|panultihon|folk\s*songs?|epics?|myths?|legends?|chants?|maravilla|catipay|curato)\b/i
const DESCRIPTOR_REPLACE_REGEX = /\b(riddles?|tigmo|proverbs?|panultihon|folk\s*songs?|epics?|myths?|legends?|chants?|maravilla|catipay|curato)\b(?:\s*\(\d{4}\))?/gi

/**
 * Strips sentences or clauses containing genre taxonomy names and researcher citations.
 * Applied identically at training time and prediction time.
 */
export function stripGenreDescriptors(text: string): string {
  if (!text) return ''

  // 1. Strip genre prefixes like "Panultihon:" or "Tigmo:"
  const processed = text.replace(/\b(?:panultihon|tigmo|proverbs?|riddles?|folk\s*songs?)\s*:\s*/gi, '')

  // 2. Split into sentences using punctuation boundaries
  const rawSentences = processed.split(/(?<=[.!?\n])\s+/)
  const cleanSentences: string[] = []

  for (const s of rawSentences) {
    const trimmed = s.trim()
    if (!trimmed) continue

    if (DESCRIPTOR_TEST_REGEX.test(trimmed)) {
      continue
    }

    cleanSentences.push(trimmed)
  }

  // 3. Fallback to inline term replacement if all sentences matched
  let result = cleanSentences.join(' ')
  if (!result && processed) {
    result = processed.replace(DESCRIPTOR_REPLACE_REGEX, ' ').trim()
  } else {
    result = result.replace(DESCRIPTOR_REPLACE_REGEX, ' ')
  }

  return result.replace(/\s+/g, ' ').replace(/^[:;,.\s]+/, '').trim()
}

/**
 * Master classification text cleaning pipeline:
 * 1. Strips riddle answers
 * 2. Strips genre descriptors and citations
 * 3. Normalizes whitespace
 */
export function cleanClassificationText(text: string): string {
  if (!text) return ''
  const noAnswer = stripRiddleAnswer(text)
  const noDescriptors = stripGenreDescriptors(noAnswer)
  return noDescriptors
}

export interface MinimalClassifiableEntry {
  transcription?: string | null
  translation?: string | null
}

/**
 * Extracts the honest classification input text:
 * transcription + translation ONLY (excluding title, content commentary, and metadata).
 */
export function getCleanClassificationInput(entry: MinimalClassifiableEntry): string {
  const parts = [
    entry.transcription ? entry.transcription.trim() : '',
    entry.translation ? entry.translation.trim() : '',
  ].filter(Boolean)

  const combined = parts.join(' ')
  return cleanClassificationText(combined)
}
