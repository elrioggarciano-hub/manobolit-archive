// Writes the 22 seed entries in the same shape as GET /api/ml/dataset (offline testing only).
import fs from 'fs'
import { classifyHybrid } from '../../lib/classification/hybrid'
import { extractEntryText } from '../../lib/classification/evaluation'
import path from 'path'

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'prisma', 'seed.ts'), 'utf8')
const start = src.indexOf('const entries = [') + 'const entries = '.length
let depth = 0, end = start
for (let i = start; i < src.length; i++) {
  if (src[i] === '[') depth++
  else if (src[i] === ']') { if (--depth === 0) { end = i + 1; break } }
}
const entries = new Function(`return ${src.slice(start, end)}`)()
const dataset = entries.map((e: any, i: number) => ({
  id: `seed-${i}`,
  title: e.title,
  transcription: e.transcription,
  translation: e.translation,
  bisayaTranslation: e.bisayaTranslation,
  verifiedGenre: e.genre,
  verifiedThemes: JSON.parse(e.themes || '[]'),
  ruleScores: Object.fromEntries(classifyHybrid(extractEntryText(e, 'both', true), 'ALL', 'RULE_BASED', { rulesProfile: 'framework-only' }).genre.allScores.map(s => [s.genre, s.confidence])),
}))
fs.writeFileSync(path.join(__dirname, 'seed-dataset.json'), JSON.stringify({ count: dataset.length, dataset }, null, 2))
console.log('wrote', dataset.length)
