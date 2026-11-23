// Auto-aligns the transcripts of entries that have audio but no synchronized transcript yet,
// using the same pause-detection algorithm as the admin editor (lib/transcriptSync.ts → alignToPauses).
// Audio is decoded with a local browser's Web Audio API (Puppeteer). Reviewers should still play the
// long entries (songs, folktales) in Admin → Edit → Synchronize transcript and correct any line.
//
// Usage:  npm run sync:auto                      dry run, pause-based (saves nothing)
//         npm run sync:auto -- --ai              dry run, AI listens to each recording (most accurate)
//         npm run sync:auto -- --ai --save       saves timings for entries that are not synchronized yet
//         add --replace to re-align entries that already have timings, and --keep "<title>" to protect one
//         --only "<title>" (repeatable) aligns just those entries, e.g. to retry ones that hit the AI rate limit
// Optional: BROWSER_PATH=<path to chrome.exe or msedge.exe> to choose the browser used for decoding.
import 'dotenv/config'
import fs from 'fs'
import puppeteer from 'puppeteer'
import { prisma } from '../lib/database/prisma'
import { alignToPauses, splitIntoLines, validateSegments, formatClock, snapToOnsets, SyncSegment } from '../lib/transcriptSync'
import { aiAlignTranscript, mimeFor, DailyQuotaError } from '../lib/transcriptSyncAI'

const SAVE = process.argv.includes('--save')
const AI = process.argv.includes('--ai')
const REPLACE = process.argv.includes('--replace')
const argValues = (flag: string) => process.argv.flatMap((a, i, all) => (a === flag && all[i + 1] ? [all[i + 1]] : []))
const KEEP = argValues('--keep')
const ONLY = argValues('--only')
const FRAME = 0.02
const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter((p): p is string => !!p && fs.existsSync(p))

async function main() {
  const entries = await prisma.literatureEntry.findMany({
    where: { audioFile: { not: null } },
    select: { id: true, title: true, genre: true, audioFile: true, transcription: true, transcriptSync: true },
    orderBy: [{ genre: 'asc' }, { title: 'asc' }],
  })
  const browser = await puppeteer.launch({ headless: true, ...(BROWSERS[0] ? { executablePath: BROWSERS[0] } : {}) })
  const page = await browser.newPage()
  await page.goto('about:blank')
  let aligned = 0
  let saved = 0
  for (const e of entries) {
    if (ONLY.length && !ONLY.includes(e.title)) continue
    const lines = splitIntoLines(e.transcription || '')
    if (!lines.length) {
      console.log(`SKIP  ${e.title}: no transcription`)
      continue
    }
    if ((e.transcriptSync && !REPLACE) || KEEP.includes(e.title)) {
      console.log(`KEEP  ${e.title}: already synchronized`)
      continue
    }
    try {
      const env: { duration: number; rms: number[] } = await page.evaluate(async (url: string, frameSec: number) => {
        const buf = await (await fetch(url)).arrayBuffer()
        const ctx = new AudioContext()
        const audio = await ctx.decodeAudioData(buf)
        const n = audio.length
        const mono = new Float32Array(n)
        for (let c = 0; c < audio.numberOfChannels; c++) {
          const ch = audio.getChannelData(c)
          for (let i = 0; i < n; i++) mono[i] += ch[i] / audio.numberOfChannels
        }
        const size = Math.max(1, Math.round(audio.sampleRate * frameSec))
        const rms: number[] = []
        for (let f = 0; f * size < n; f++) {
          let s = 0
          const end = Math.min(n, (f + 1) * size)
          for (let i = f * size; i < end; i++) s += mono[i] * mono[i]
          rms.push(Math.sqrt(s / (end - f * size)))
        }
        await ctx.close()
        return { duration: audio.duration, rms }
      }, e.audioFile!, FRAME)
      let segs: SyncSegment[]
      let how = 'pauses'
      if (AI) {
        const audio = Buffer.from(await (await fetch(e.audioFile!)).arrayBuffer())
        const kind = e.genre === 'SONG' ? 'folk song' : `${e.genre.toLowerCase()} narration`
        const ai = await aiAlignTranscript(audio, mimeFor(e.audioFile!), e.transcription || '', kind, 3)
        segs = snapToOnsets(ai.segments, { frameSec: FRAME, rms: env.rms })
        how = ai.mode === 'phrases' ? 'AI phrases' : 'AI lines'
      } else {
        segs = alignToPauses(lines, { frameSec: FRAME, rms: env.rms })
      }
      const invalid = validateSegments(segs)
      if (invalid) throw new Error(invalid)
      aligned++
      console.log(`${SAVE ? 'SAVE ' : 'DRY  '} ${e.genre.padEnd(8)} ${e.title.slice(0, 30).padEnd(30)} ${formatClock(env.duration).padStart(7)} ${how.padEnd(10)} ${String(segs.length).padStart(2)} lines: ${segs.slice(0, 5).map(s => formatClock(s.start)).join(' ')}${segs.length > 5 ? ' …' : ''}`)
      if (SAVE) {
        await prisma.literatureEntry.update({ where: { id: e.id }, data: { transcriptSync: JSON.stringify(segs) } })
        saved++
      }
    } catch (err: any) {
      console.log(`FAIL  ${e.title}: ${err.message}`)
      if (err instanceof DailyQuotaError) {
        console.log('STOP  the remaining entries keep their current timings; run again tomorrow with --only "<title>"')
        break
      }
    }
  }
  await browser.close()
  console.log(`\nAligned ${aligned} entries${SAVE ? `, saved ${saved}` : ' (dry run — add -- --save to store them)'}.`)
  if (SAVE && saved) console.log('Review the songs and folktales in Admin → Edit → ♪ Synchronize transcript.')
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Auto-sync failed:', err.message)
    process.exit(1)
  })
