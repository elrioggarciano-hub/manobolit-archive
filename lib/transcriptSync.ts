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

/**
 * Loudness envelope of a recording: RMS energy per frame (computed in the browser from the decoded audio).
 */
export interface Envelope {
  frameSec: number
  rms: Float32Array | number[]
}

/** RMS envelope from mono PCM samples. */
export function computeEnvelope(samples: Float32Array, sampleRate: number, frameSec = 0.02): Envelope {
  const size = Math.max(1, Math.round(sampleRate * frameSec))
  const frames = Math.ceil(samples.length / size)
  const rms = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {
    let sum = 0
    const end = Math.min(samples.length, (f + 1) * size)
    for (let i = f * size; i < end; i++) sum += samples[i] * samples[i]
    rms[f] = Math.sqrt(sum / Math.max(1, end - f * size))
  }
  return { frameSec, rms }
}

/**
 * Pause-aware alignment: lines are spread over the VOICED part of the recording in proportion to their
 * length, then each line start is snapped to the nearest detected pause (a stretch of low energy), because
 * singers and narrators usually breathe between lines. The result is a starting point that a reviewer
 * checks by listening; it is never treated as verified timing.
 */
export function alignToPauses(lines: string[], env: Envelope, opts: { minPauseSec?: number; snapWindowSec?: number } = {}): SyncSegment[] {
  const minPause = opts.minPauseSec ?? 0.25
  const snapWindow = opts.snapWindowSec ?? 3
  const rms = Array.from(env.rms)
  if (lines.length === 0 || rms.length === 0) return []
  const sorted = [...rms].sort((a, b) => a - b)
  const noise = sorted[Math.floor(sorted.length * 0.1)]
  const loud = sorted[Math.floor(sorted.length * 0.9)]
  const threshold = noise + (loud - noise) * 0.15
  const voiced = rms.map(v => v > threshold)

  // pause ends = moments where sound resumes after at least minPause of silence
  const pauseEnds: number[] = []
  let silentRun = 0
  for (let f = 0; f < voiced.length; f++) {
    if (!voiced[f]) silentRun++
    else {
      if (silentRun * env.frameSec >= minPause) pauseEnds.push(f * env.frameSec)
      silentRun = 0
    }
  }

  // cumulative voiced time per frame, to map "share of the text" to "position in the recording"
  const voicedTimeline: number[] = []
  for (let f = 0; f < voiced.length; f++) if (voiced[f]) voicedTimeline.push(f * env.frameSec)
  if (voicedTimeline.length === 0) return estimateTimings(lines, rms.length * env.frameSec)

  // expected start of each line: its share of the text mapped onto the voiced timeline
  const weights = lines.map(l => Math.max(1, l.replace(/\s+/g, '').length))
  const total = weights.reduce((a, b) => a + b, 0)
  let cum = 0
  const targets = lines.map((_, i) => {
    const share = cum / total
    cum += weights[i]
    return voicedTimeline[Math.min(voicedTimeline.length - 1, Math.floor(share * voicedTimeline.length))]
  })
  const starts = [...targets]

  // Lines 2..n each take a DIFFERENT pause, in order, choosing the set of pauses that best matches the
  // expected positions overall (monotone dynamic programming), not just the nearest pause per line.
  const first = targets[0]
  const cands = pauseEnds.filter(p => p > first + 0.3)
  const need = targets.length - 1
  if (need > 0 && cands.length >= need) {
    const m = cands.length
    const cost = (i: number, j: number) => Math.abs(cands[j] - targets[i + 1])
    const dp: Float64Array[] = Array.from({ length: need }, () => new Float64Array(m).fill(Infinity))
    const back: Int32Array[] = Array.from({ length: need }, () => new Int32Array(m).fill(-1))
    for (let j = 0; j < m; j++) dp[0][j] = cost(0, j)
    for (let i = 1; i < need; i++) {
      let best = Infinity
      let bestK = -1
      for (let j = i; j < m; j++) {
        if (dp[i - 1][j - 1] < best) {
          best = dp[i - 1][j - 1]
          bestK = j - 1
        }
        if (bestK >= 0) {
          dp[i][j] = best + cost(i, j)
          back[i][j] = bestK
        }
      }
    }
    let j = 0
    for (let k = 1; k < m; k++) if (dp[need - 1][k] < dp[need - 1][j]) j = k
    for (let i = need - 1; i >= 0; i--) {
      // only snap when the chosen pause is reasonably close to where the line is expected
      if (Math.abs(cands[j] - targets[i + 1]) <= snapWindow * 2) starts[i + 1] = cands[j]
      j = back[i][j]
    }
  } else {
    // fewer pauses than lines: snap each line to the nearest unused pause within the window
    let prevPause = first
    for (let i = 1; i < targets.length; i++) {
      const near = pauseEnds.filter(p => p > prevPause + 0.5 && Math.abs(p - targets[i]) <= snapWindow)
      if (near.length) {
        starts[i] = near.reduce((best, p) => (Math.abs(p - targets[i]) < Math.abs(best - targets[i]) ? p : best))
        prevPause = starts[i]
      }
    }
  }

  const segments: SyncSegment[] = []
  let prev = -1
  lines.forEach((text, i) => {
    const t = Math.max(starts[i], prev + 0.1)
    prev = t
    segments.push({ start: Math.round(t * 10) / 10, text })
  })
  return segments
}

export function formatClock(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00.0'
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}
