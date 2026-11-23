import fs from 'fs'
import assert from 'assert'
import { splitIntoLines, estimateTimings, validateSegments, activeSegmentIndex, parseSegments, formatClock } from '../../lib/transcriptSync'
const data = JSON.parse(fs.readFileSync(__dirname + '/seed-dataset.json', 'utf8')).dataset
for (const e of data.slice(0, 5)) {
  const lines = splitIntoLines(e.transcription)
  const segs = estimateTimings(lines, 25)
  assert.strictEqual(validateSegments(segs), null)
  assert.strictEqual(lines.join(' ').replace(/\s+/g, ' '), e.transcription.trim().replace(/\s+/g, ' '), 'no words lost')
  console.log(`${e.title.slice(0, 30).padEnd(30)} ${lines.length} lines, first: "${lines[0].slice(0, 50)}" @${formatClock(segs[1]?.start ?? 0)}`)
}
const s = [{ start: 0, text: 'a' }, { start: 5, text: 'b' }, { start: 9.5, text: 'c' }]
assert.strictEqual(activeSegmentIndex(s, 0), 0); assert.strictEqual(activeSegmentIndex(s, 4.9), 0)
assert.strictEqual(activeSegmentIndex(s, 5), 1); assert.strictEqual(activeSegmentIndex(s, 100), 2)
assert.ok(validateSegments([{ start: 5, text: 'a' }, { start: 2, text: 'b' }]))
assert.ok(validateSegments([{ start: 0, text: ' ' }]))
assert.deepStrictEqual(parseSegments('not json'), [])
assert.deepStrictEqual(parseSegments(JSON.stringify(s)), s)
console.log('sync helper tests passed')

// pause-aware alignment on a synthetic recording: 4 sung phrases of different lengths separated by 0.6 s breaths
{
  const { alignToPauses } = require('../../lib/transcriptSync')
  const frameSec = 0.02
  const phrases = [[0.5, 4.0], [4.6, 9.8], [10.4, 12.0], [12.6, 18.0]] // [start, end] seconds
  const rms: number[] = []
  for (let t = 0; t < 19; t += frameSec) rms.push(phrases.some(([s, e]) => t >= s && t < e) ? 0.5 : 0.01)
  const segs = alignToPauses(['first line of the song', 'a much longer second line of the song here', 'short', 'the final line of this song'], { frameSec, rms })
  const starts = segs.map((s: any) => s.start)
  console.log('pause-aligned starts:', starts.join(', '), '(true: 0.5, 4.6, 10.4, 12.6)')
  starts.forEach((s: number, i: number) => assert.ok(Math.abs(s - phrases[i][0]) < 0.15, `line ${i + 1} at ${s}`))
  console.log('pause alignment test passed')
}

// onset snapping: approximate AI starts move to the exact moment the sound begins
{
  const { snapToOnsets, transcriptWords } = require('../../lib/transcriptSync')
  const frameSec = 0.02
  const phrases = [[0.5, 4.0], [4.6, 9.8], [10.4, 12.0]]
  const rms: number[] = []
  for (let t = 0; t < 13; t += frameSec) rms.push(phrases.some(([s, e]) => t >= s && t < e) ? 0.5 : 0.01)
  const snapped = snapToOnsets([{ start: 0, text: 'a' }, { start: 5.3, text: 'b' }, { start: 9.9, text: 'c' }], { frameSec, rms })
  console.log('snapped starts:', snapped.map((s: any) => s.start).join(', '), '(true: 0.5, 4.6, 10.4)')
  snapped.forEach((s: any, i: number) => assert.ok(Math.abs(s.start - phrases[i][0]) < 0.05, `line ${i + 1} at ${s.start}`))
  assert.deepStrictEqual(transcriptWords('Tu maintok pad, pig-aling pad!'), ['tu', 'maintok', 'pad', 'pig-aling', 'pad'])
  console.log('onset snapping test passed')
}
