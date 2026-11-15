setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
import { classifyEntry } from '../lib/classification/engine';
import { classifyHybrid } from '../lib/classification/hybrid';
import { cleanClassificationText } from '../lib/classification/textCleaning';
import { setRulesProfile } from '../lib/classification/rules';

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const damgo = entries.find((e: any) => e.title.includes('Damgo'));

console.log('--- TEST 1: classifyEntry with { rulesProfile: "framework-only" } ---');
const r1 = classifyEntry(damgo, '', 'ALL', 'RULE_BASED', { rulesProfile: 'framework-only' });
console.log('r1 predicted:', r1.genre.value, 'confidence:', r1.genre.confidence, 'rulesApplied:', r1.rulesApplied);

console.log('\n--- TEST 2: classifyHybrid on cleaned text with global profile ---');
setRulesProfile('framework-only');
const textToClassify = cleanClassificationText([damgo.transcription, damgo.translation].filter(Boolean).join(' '));
const r2 = classifyHybrid(textToClassify, 'ALL', 'RULE_BASED');
console.log('r2 predicted:', r2.genre.value, 'confidence:', r2.genre.confidence, 'allScores:', r2.genre.allScores);

process.exit(0);
