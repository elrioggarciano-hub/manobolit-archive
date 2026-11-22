import fs from 'fs'
import { compileArtifact, runParityTests, predictWithCompiled } from '../../lib/classification/trainedModel'
const file = process.argv[2]
const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
console.log('artifact size', (fs.statSync(file).size / 1024).toFixed(0), 'KB')
const model = compileArtifact(raw)
const r = runParityTests(model)
console.log(`parity: ${r.passed ? 'PASS' : 'FAIL'} over ${r.count} tests, max |diff| = ${r.maxDiff.toExponential(2)}`)
for (const t of raw.parityTests.slice(-2)) console.log(predictWithCompiled(model, t.input).genre, t.probabilities.map((p: number) => p.toFixed(3)).join(' '))
