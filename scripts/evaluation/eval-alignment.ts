// Held-out evaluation of the in-app IBM Model 1 learner: hide 1/3 of the dictionary words that occur in the
// literature, train on the archive texts + remaining dictionary, and check whether the hidden words are recovered.
import fs from 'fs'
import { buildAlignmentModels, alignmentTokens, learnedTranslation, LEARNED_MIN_PROBABILITY } from '../../lib/translation/alignment'
import { FALLBACK_LEXICON as lex } from '../../lib/translation/lexiconStore'

const data = JSON.parse(fs.readFileSync(__dirname + '/seed-dataset.json', 'utf8')).dataset
const seeds = [...lex.words, ...lex.webonary]
const single = (s?: string) => { const f = (s || '').toLowerCase().split(' / ')[0].split(' (')[0].trim(); return f && !/\s/.test(f) ? f : null }

for (const [lang, field, textField] of [['ceb', 'bisaya', 'bisayaTranslation'], ['en', 'english', 'translation']] as const) {
  const seen = new Set<string>(data.flatMap((e: any) => alignmentTokens(e.transcription)))
  const gold = new Map<string, string>()
  for (const s of seeds) { const m = single(s.manobo), t = single((s as any)[field]); if (m && t && seen.has(m)) gold.set(m, t) }
  const testable = Array.from(gold)
  // deterministic shuffle
  let x = 7; const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648)
  testable.sort(() => rnd() - 0.5)
  const held = testable.slice(0, Math.floor(testable.length / 3))
  const heldSet = new Set(held.map(([m]) => m))
  const t0 = Date.now()
  const models = buildAlignmentModels(data, seeds.filter(s => !heldSet.has((s.manobo || '').toLowerCase())))
  const ms = Date.now() - t0
  let recovered = 0, used = 0, usedCorrect = 0
  for (const [m, t] of held) {
    const best = models.tables[`msm->${lang}` as const].get(m)?.[0]
    if (best?.target === t) recovered++
    const l = learnedTranslation(models, "msm", lang, m) ?? (() => { const b = models.tables[`msm->${lang}` as const].get(m)?.[0]; return b && b.probability >= LEARNED_MIN_PROBABILITY ? b : null })()
    if (l) { used++; if (l.target === t) usedCorrect++ }
  }
  console.log(`msm->${lang}: recovered ${recovered}/${held.length} hidden words (top-1); ` +
    `used in translation (p>=${LEARNED_MIN_PROBABILITY}): ${used}, correct ${usedCorrect} (${used ? Math.round(100 * usedCorrect / used) : 0}%); training ${ms} ms`)
  void textField
}

{
  const seen = new Set<string>(data.flatMap((e: any) => alignmentTokens(e.transcription)))
  const gold = new Map<string, string>()
  for (const s of seeds) { const m = single(s.manobo), t = single(s.bisaya); if (m && t && seen.has(m)) gold.set(m, t) }
  // all folds: hide each third in turn so every testable word is evaluated once
  const words = Array.from(gold)
  const res: Record<string, [number, number]> = {}
  for (let fold = 0; fold < 3; fold++) {
    const held = words.filter((_, i) => i % 3 === fold)
    const hs = new Set(held.map(([m]) => m))
    const models = buildAlignmentModels(data, seeds.filter(s => !hs.has((s.manobo || '').toLowerCase())))
    for (const tau of [0.3, 0.4, 0.5, 0.6]) {
      const r = (res[tau] ??= [0, 0])
      for (const [m, t] of held) { const b = models.tables['msm->ceb'].get(m)?.[0]; if (b && b.probability >= tau) { r[0]++; if (b.target === t) r[1]++ } }
    }
  }
  console.log('msm->ceb 3-fold, all testable words:', Object.entries(res).map(([t, [n, c]]) => `p>=${t}: ${c}/${n} correct`).join(' | '))
}
