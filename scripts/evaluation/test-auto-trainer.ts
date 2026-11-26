// Checks the in-app trainer (lib/classification/genreTrainer.ts) against the Colab notebook:
// trains on the same exported dataset and compares with the scikit-learn artifact trained on it.
// Usage: npm run test:auto-trainer [dataset.json] [colab-model.json]

import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { trainGenreModel, DEFAULT_TRAINER_CONFIG } from '../../lib/classification/genreTrainer'
import { compileArtifact, predictWithCompiled, runParityTests } from '../../lib/classification/trainedModel'

const outDir = path.join(__dirname, 'output')
const datasetPath = process.argv[2] || path.join(outDir, 'live-dataset.json')
const colabPath =
  process.argv[3] ||
  path.join(outDir, fs.readdirSync(outDir).find(f => f.startsWith('manobolit-genre-model-colab-')) || '')

const payload = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
const colab = JSON.parse(fs.readFileSync(colabPath, 'utf8'))
const rows = (payload.dataset || payload).map((r: any) => ({
  id: r.id,
  title: r.title,
  transcription: r.transcription,
  translation: r.translation,
  genre: r.verifiedGenre || r.genre,
  ruleScores: r.ruleScores,
}))

const cfg = { ...DEFAULT_TRAINER_CONFIG, preprocessing: colab.preprocessing, unclassifiedThreshold: colab.unclassifiedThreshold }
const { artifact, durationMs } = trainGenreModel(rows, cfg, 'parity-check')
const ours = compileArtifact(artifact)

// 1. Same vocabulary and classes as scikit-learn
assert.deepStrictEqual(artifact.classes, colab.classes, 'classes differ')
assert.strictEqual(artifact.vectorizers[0].terms.length, colab.vectorizers[0].terms.length, 'vocabulary size differs')
assert.deepStrictEqual(artifact.vectorizers[0].terms, colab.vectorizers[0].terms, 'vocabulary differs')
const idfDiff = Math.max(...artifact.vectorizers[0].idf.map((v, i) => Math.abs(v - colab.vectorizers[0].idf[i])))

// 2. Probabilities on the notebook's own probe inputs vs scikit-learn
let probDiff = 0
for (const t of colab.parityTests) {
  const got = predictWithCompiled(ours, t.input).probabilities.map(p => p.probability)
  t.probabilities.forEach((p: number, i: number) => (probDiff = Math.max(probDiff, Math.abs(p - got[i]))))
}

// 3. Stored artifact reproduces its own training-time probabilities
const parity = runParityTests(ours)

const m = artifact.metrics
const cm = colab.metrics
console.log(`Trained ${artifact.trainedSamples} entries, ${artifact.vectorizers[0].terms.length} features in ${durationMs} ms`)
console.log(`IDF max diff vs sklearn:         ${idfDiff.toExponential(2)}`)
console.log(`Probability max diff vs sklearn: ${probDiff.toExponential(2)}`)
console.log(`Self-parity (${parity.count} probes):       ${parity.passed ? 'passed' : 'FAILED'} (max ${parity.maxDiff.toExponential(2)})`)
console.log(`LOOCV ML-only      in-app ${m.accuracy}  colab ${cm.accuracy}`)
console.log(`LOOCV rules only   in-app ${m.rulesOnly?.accuracy}  colab ${cm.rulesOnly?.accuracy}`)
console.log(`LOOCV rules + ML   in-app ${m.ruleBasedPlusML?.accuracy}  colab ${cm.ruleBasedPlusML?.accuracy}`)
console.log(`Learning curve     ${m.learningCurve.map((p: any) => `${p.trainSize}:${p.accuracy}`).join('  ')}`)

assert.ok(idfDiff < 1e-6, 'IDF does not match scikit-learn')
assert.ok(probDiff < 1e-2, 'probabilities differ from scikit-learn by more than 0.01')
assert.ok(parity.passed, 'artifact failed its own parity tests')
assert.strictEqual(m.accuracy, cm.accuracy, 'LOOCV accuracy differs from the notebook')
console.log('OK: in-app trainer matches the Colab notebook')
