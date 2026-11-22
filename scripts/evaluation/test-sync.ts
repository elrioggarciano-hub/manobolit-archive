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
