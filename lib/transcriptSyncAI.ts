// Speech-aware transcript alignment (server side).
// Gemini LISTENS to the recording and splits the transcript into the phrases as they are actually sung or
// spoken, with the approximate start of each. Guard: the words must be exactly the transcript's words, in
// order (nothing added, removed or changed) — otherwise the transcript's own lines are kept and Gemini only
// gives their start times. The browser (or the sync script) then snaps each start to the exact acoustic
// onset (snapToOnsets). A reviewer still listens and confirms before relying on the timings.
import { SyncSegment, splitIntoLines, transcriptWords, validateSegments } from './transcriptSync'

const MODEL = 'gemini-3.5-flash'

/** The Gemini API key's daily request quota is used up (it resets the next day). */
export class DailyQuotaError extends Error {
  constructor() {
    super('The daily Gemini quota for this API key is used up — try again tomorrow, or use "Auto-align" / "Start tapping"')
    this.name = 'DailyQuotaError'
  }
}

async function isDailyQuota(res: Response): Promise<boolean> {
  try {
    return /PerDay/i.test(await res.clone().text())
  } catch {
    return false
  }
}

async function callGemini(audio: Buffer, mime: string, prompt: string, retriesOn429 = 0): Promise<any | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not configured')
  const send = () =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mime, data: audio.toString('base64') } }, { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
      signal: AbortSignal.timeout(110_000),
    })
  let res = await send()
  // Rate limited: a per-minute limit is worth waiting for; a used-up DAILY quota is not.
  for (let attempt = 1; res.status === 429 && attempt <= retriesOn429; attempt++) {
    if (await isDailyQuota(res)) throw new DailyQuotaError()
    await new Promise(r => setTimeout(r, 30_000 * attempt))
    res = await send()
  }
  if (res.status === 429) {
    if (await isDailyQuota(res)) throw new DailyQuotaError()
    throw new Error('Gemini rate limit reached — wait a minute and try again')
  }
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
  const raw = (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) return null
  return JSON.parse(String(raw).replace(/^```json|```$/g, '').trim())
}

export function mimeFor(url: string): string {
  const u = url.toLowerCase().split('?')[0]
  if (u.endsWith('.m4a') || u.endsWith('.mp4') || u.endsWith('.aac')) return 'audio/mp4'
  if (u.endsWith('.wav')) return 'audio/wav'
  if (u.endsWith('.ogg')) return 'audio/ogg'
  return 'audio/mpeg'
}

export interface AiAlignResult {
  segments: SyncSegment[]
  /** 'phrases' = Gemini re-split the transcript into performed phrases; 'lines' = existing lines kept */
  mode: 'phrases' | 'lines'
}

export async function aiAlignTranscript(
  audio: Buffer,
  mime: string,
  transcription: string,
  kind = 'oral literature recording',
  retriesOn429 = 0
): Promise<AiAlignResult> {
  const words = transcriptWords(transcription)
  if (!words.length) throw new Error('No transcription to align')

  // 1) Re-segment into performed phrases with start times
  const phrasePrompt = `Listen to this Agusan Manobo ${kind}. Split the TRANSCRIPT below into the lines exactly as they are sung or spoken in the recording (one line per phrase or breath, usually 3 to 12 words).
Rules: use the transcript's words exactly and in the same order — do not add, remove, translate or correct any word (punctuation may move). Give each line's start time in seconds with one decimal, when its first word begins. Times must increase. Ignore instrumental parts.
Return JSON: {"lines": [{"start": number, "text": string}, ...]}
TRANSCRIPT:
${transcription}`
  try {
    const out = await callGemini(audio, mime, phrasePrompt, retriesOn429)
    const lines = Array.isArray(out?.lines) ? out.lines : []
    const segs: SyncSegment[] = lines.map((l: any) => ({ start: Number(l.start), text: String(l.text || '').trim() })).filter((s: SyncSegment) => s.text)
    const sameWords = transcriptWords(segs.map(s => s.text).join(' ')).join(' ') === words.join(' ')
    if (segs.length && sameWords && !validateSegments(segs)) return { segments: segs, mode: 'phrases' }
  } catch (err) {
    if (err instanceof DailyQuotaError) throw err
    // otherwise fall through to fixed lines
  }

  // 2) Fallback: keep the transcript's own lines; Gemini gives their start times only
  const fixed = splitIntoLines(transcription)
  const linesPrompt = `Listen to this Agusan Manobo ${kind}. Below is its transcript split into numbered lines, in order.
For EACH line, give the time in seconds (one decimal) when that line starts being sung or spoken. Times must increase. Ignore instrumental parts.
Return JSON: {"starts": [number, ...]} with exactly ${fixed.length} numbers.
${fixed.map((l, i) => `${i + 1}. ${l}`).join('\n')}`
  const out = await callGemini(audio, mime, linesPrompt, retriesOn429)
  const starts: number[] = Array.isArray(out?.starts) ? out.starts.map(Number) : []
  if (starts.length !== fixed.length) throw new Error('The AI did not return a start time for every line')
  const segs = fixed.map((text, i) => ({ start: Math.max(0, starts[i]), text }))
  const invalid = validateSegments(segs)
  if (invalid) throw new Error(invalid)
  return { segments: segs, mode: 'lines' }
}
