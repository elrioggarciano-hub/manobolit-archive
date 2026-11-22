// Synchronized transcription: line timings for an entry's audio recording.
// Timings are set by a reviewer (tap-to-sync while listening, or an estimate that the reviewer adjusts),
// stored on LiteratureEntry.transcriptSync, and used to highlight the current line during playback.

export interface SyncSegment {
  /** start time in seconds; a line lasts until the next line starts */
  start: number
  text: string
}

export const MAX_SEGMENTS = 500

/** Validates segments; returns an error message or null. Times must be non-decreasing. */
export function validateSegments(value: unknown): string | null {
  if (!Array.isArray(value)) return 'Segments must be an array'
  if (value.length === 0) return 'Add at least one line'
  if (value.length > MAX_SEGMENTS) return `At most ${MAX_SEGMENTS} lines are allowed`
  let prev = -1
  for (let i = 0; i < value.length; i++) {
    const s = value[i] as SyncSegment
    if (!s || typeof s.text !== 'string' || !s.text.trim()) return `Line ${i + 1} is empty`
    if (s.text.length > 1000) return `Line ${i + 1} is too long`
    if (typeof s.start !== 'number' || !isFinite(s.start) || s.start < 0) return `Line ${i + 1} needs a start time`
    if (s.start < prev) return `Line ${i + 1} starts before line ${i}`
    prev = s.start
  }
  return null
}

/** Parses the stored JSON; returns [] for missing or invalid data. */
export function parseSegments(raw: string | null | undefined): SyncSegment[] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw)
    return validateSegments(value) ? [] : (value as SyncSegment[]).map(s => ({ start: s.start, text: s.text.trim() }))
  } catch {
    return []
  }
}

/** Index of the line being heard at `time` (−1 before the first line starts). */
export function activeSegmentIndex(segments: SyncSegment[], time: number): number {
  let idx = -1
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].start <= time + 0.05) idx = i
    else break
  }
  return idx
}

/**
 * Suggests lines from a transcription: existing line breaks first, otherwise sentence punctuation,
 * and long pieces are wrapped to about `maxWords` words.
 */
export function splitIntoLines(transcription: string, maxWords = 9): string[] {
  const text = (transcription || '').replace(/\r/g, '').trim()
  if (!text) return []
  const pieces = text.includes('\n')
    ? text.split(/\n+/)
    : text.split(/(?<=[.!?;])\s+/)
  const lines: string[] = []
  for (const piece of pieces.map(p => p.trim()).filter(Boolean)) {
    const words = piece.split(/\s+/)
    if (words.length <= maxWords + 3) {
      lines.push(piece)
      continue
    }
    const chunks = Math.ceil(words.length / maxWords)
    const size = Math.ceil(words.length / chunks)
    for (let i = 0; i < words.length; i += size) lines.push(words.slice(i, i + size).join(' '))
  }
  return lines
}

/**
 * Starting-point estimate: distributes the recording duration across lines in proportion to their length.
 * Reviewers must check it against the audio (tap-to-sync or manual edits) before relying on it.
 */
export function estimateTimings(lines: string[], duration: number, leadIn = 0): SyncSegment[] {
  const weights = lines.map(l => Math.max(1, l.replace(/\s+/g, '').length))
  const total = weights.reduce((a, b) => a + b, 0)
  const span = Math.max(0, duration - leadIn)
  let cursor = leadIn
  return lines.map((text, i) => {
    const seg = { start: Math.round(cursor * 10) / 10, text }
    cursor += (weights[i] / total) * span
    return seg
  })
}

export function formatClock(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00.0'
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}
