// Prequential (test-then-train) simulation: entries arrive one by one; each is classified
// with models trained on base corpus + previously "verified" entries, then added to training.
import fs from 'fs'
import path from 'path'
import { TRAINING_CORPUS } from '../../lib/classification/trainingCorpus'
import { ARCHIVE_OVERLAPPING_DOC_IDS, extractEntryText } from '../../lib/classification/evaluation'
import { buildModels, verifiedRecordsToTrainingDocs } from '../../lib/classification/retrain'
import { classifyHybrid } from '../../lib/classification/hybrid'

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'prisma', 'seed.ts'), 'utf8')
const start = src.indexOf('const entries = [') + 'const entries = '.length
let depth = 0, end = start
for (let i = start; i < src.length; i++) { if (src[i] === '[') depth++; else if (src[i] === ']') { if (--depth === 0) { end = i + 1; break } } }
const all = new Function(`return ${src.slice(start, end)}`)().map((e: any, i: number) => ({ ...e, id: `seed-${i}` }))

const base = TRAINING_CORPUS.filter(d => !ARCHIVE_OVERLAPPING_DOC_IDS.has(d.id))
function rng(seed: number) { return () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) }
const modes = ['NAIVE_BAYES_ML', 'TF_IDF_VSM', 'CHAR_NGRAM', 'KNN_MEMORY', 'HYBRID_ENSEMBLE'] as const
const RUNS = 20
const half = Math.floor(all.length / 2)
const acc: Record<string, { first: number; second: number }> = {}
for (const m of modes) acc[m] = { first: 0, second: 0 }

for (let r = 0; r < RUNS; r++) {
  const rand = rng(r + 1)
  const order = [...all].sort(() => rand() - 0.5)
  for (let i = 0; i < order.length; i++) {
    const models = { ...buildModels([...base, ...verifiedRecordsToTrainingDocs(order.slice(0, i))]), rulesProfile: 'framework-only' as const }
    const text = extractEntryText(order[i], 'both', true)
    for (const m of modes) {
      const ok = classifyHybrid(text, 'ALL', m, models).genre.value === order[i].genre ? 1 : 0
      if (i < half) acc[m].first += ok; else acc[m].second += ok
    }
  }
}
console.log(`Prequential, ${RUNS} random orders, N=${all.length}`)
console.log('mode'.padEnd(18), 'first 11 arrivals', ' last 11 arrivals')
for (const m of modes) {
  const f = acc[m].first / (RUNS * half) * 100, s = acc[m].second / (RUNS * (all.length - half)) * 100
  console.log(m.padEnd(18), `${f.toFixed(1)}%`.padStart(17), `${s.toFixed(1)}%`.padStart(17))
}
