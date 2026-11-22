import assert from 'assert'
import { blendRulesWithModel } from '../../lib/classification/ruleMlBlend'
const rules = [{ genre: 'RIDDLE', confidence: 0.7 }, { genre: 'PROVERB', confidence: 0.1 }, { genre: 'SONG', confidence: 0.1 }, { genre: 'FOLKTALE', confidence: 0.1 }]
const model = [{ genre: 'RIDDLE', probability: 0.2 }, { genre: 'PROVERB', probability: 0.5 }, { genre: 'SONG', probability: 0.2 }, { genre: 'FOLKTALE', probability: 0.1 }]
const b = blendRulesWithModel(rules, model, 0.35)
assert.strictEqual(b.genre, 'RIDDLE'); assert.strictEqual(b.confidence, 0.45)            // 0.5*0.7 + 0.5*0.2
assert.strictEqual(b.distribution.find(d => d.genre === 'PROVERB')!.confidence, 0.3)     // 0.5*0.1 + 0.5*0.5
assert.ok(Math.abs(b.distribution.reduce((s, d) => s + d.confidence, 0) - 1) < 1e-9)
const u = blendRulesWithModel(rules.map(r => ({ ...r, confidence: 0.25 })), model.map(m => ({ ...m, probability: 0.25 })), 0.35)
assert.strictEqual(u.genre, 'UNCLASSIFIED'); assert.ok(u.isUnclassified)
console.log('blend tests passed')
