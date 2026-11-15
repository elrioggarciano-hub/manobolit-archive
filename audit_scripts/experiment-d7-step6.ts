import fs from 'fs';
import crypto from 'crypto';
import { classifyHybrid } from '../lib/classification/hybrid';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const testCases = [
  { name: 'empty', text: '' },
  { name: 'gibberish', text: 'asdf qwer zxcv poiuy lkjhg mnbvc' },
  { name: 'recipe', text: 'Preheat oven to 375 degrees. Whisk flour, baking powder, and sugar in a large bowl. Add milk and eggs.' },
  { name: 'shuffled riddle', text: 'angud bitok pad unto maintok kaba-kaba aslag pag to Tu' },
  { name: 'title removed', text: 'Inggad pusilon, buhi gihapon. Even if you shoot it, it will still be alive.' },
  { name: 'title swapped to Riddle', text: 'Riddle. Inggad pusilon, buhi gihapon. Even if you shoot it, it will still be alive.' }
];

let out = "=== STEP 6 CHECK: D7 SANITY TESTS (RUN TWICE EACH) ===\n\n";

for (const tc of testCases) {
  out += `========================================================================\n`;
  out += `Test Case: "${tc.name}"\n`;
  out += `Input Text: "${tc.text.slice(0, 80)}"\n`;
  out += `========================================================================\n`;

  // Run 1
  const res1 = classifyHybrid(tc.text, 'ALL', 'HYBRID_ENSEMBLE');
  out += `RUN 1:\n`;
  out += `  Predicted Genre : ${res1.genre.value}\n`;
  out += `  Confidence      : ${res1.genre.confidence}\n`;
  out += `  Is Unclassified : ${res1.genre.isUnclassified}\n`;
  out += `  All Scores      : ${res1.genre.allScores.map(s => `${s.genre}:${s.confidence}`).join(', ')}\n`;
  out += `  Math Explanation: ${res1.algorithmicBreakdown.mathematicalExplanation}\n`;

  // Run 2
  const res2 = classifyHybrid(tc.text, 'ALL', 'HYBRID_ENSEMBLE');
  out += `RUN 2:\n`;
  out += `  Predicted Genre : ${res2.genre.value}\n`;
  out += `  Confidence      : ${res2.genre.confidence}\n`;
  out += `  Is Unclassified : ${res2.genre.isUnclassified}\n`;
  out += `  Deterministic   : ${res1.genre.value === res2.genre.value && res1.genre.confidence === res2.genre.confidence ? 'YES (IDENTICAL)' : 'NO'}\n`;

  const expectedUnclassified = ['empty', 'gibberish', 'recipe'].includes(tc.name);
  const passCondition = expectedUnclassified
    ? res1.genre.value === 'UNCLASSIFIED'
    : res1.genre.value !== 'UNCLASSIFIED';

  out += `  Status          : ${passCondition ? 'PASS' : 'FAIL'}\n\n`;
}

const lines = out.split('\n').length + 3;
const hash = crypto.createHash('sha256').update(out).digest('hex');
const finalOutput = `${out}\n--- FILE METRICS ---\nTotal Lines: ${lines}\nSHA-256: ${hash}\n`;

fs.writeFileSync('audit_scripts/out/step6-d7-sanity.txt', finalOutput, 'utf8');
console.log(finalOutput);

process.exit(0);
