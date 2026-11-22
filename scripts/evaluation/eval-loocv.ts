// Offline LOOCV on the 22 seed entries (no DB access).
import fs from 'fs'
import path from 'path'
import { runLOOCV } from '../../lib/classification/evaluation'

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'prisma', 'seed.ts'), 'utf8')
const start = src.indexOf('const entries = [') + 'const entries = '.length
let depth = 0, end = start
for (let i = start; i < src.length; i++) {
  if (src[i] === '[') depth++
  else if (src[i] === ']') { depth--; if (depth === 0) { end = i + 1; break } }
}
// eslint-disable-next-line no-new-func
const entries = new Function(`return ${src.slice(start, end)}`)()
  .map((e: any, i: number) => ({ ...e, id: `seed-${i}`, themes: JSON.parse(e.themes || '[]') }))

const r = runLOOCV(entries)
console.log(`N=${r.sampleSize}  majority=${r.majorityBaseline.genre} ${(r.majorityBaseline.proportion*100).toFixed(1)}%`)
for (const [k, m] of Object.entries(r.modes) as any) {
  console.log(`${k.padEnd(20)} acc=${(m.accuracy*100).toFixed(1).padStart(5)}%  macroF1=${m.macroF1.toFixed(3)}  cov=${(m.coverage*100).toFixed(0)}%`)
}
console.log('winner:', r.winner)

import { runThemeLOOCV } from '../../lib/classification/evaluation'
const th = runThemeLOOCV(entries)
console.log(`THEMES (micro, LOOCV) rules only F1=${th.keywordRulesBaseline.f1} | k-NN only F1=${th.learnedKnn.f1} | rules + k-NN (system) P=${th.rulesPlusKnn.precision} R=${th.rulesPlusKnn.recall} F1=${th.rulesPlusKnn.f1}`)
