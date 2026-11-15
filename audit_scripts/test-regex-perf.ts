import fs from 'fs';
import { genreRules } from '../lib/classification/rules';
import { getCleanClassificationInput } from '../lib/classification/textCleaning';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const regexCache = new Map<string, RegExp>();
function getTermRegex(term: string): RegExp {
  const t = term.trim().toLowerCase();
  let r = regexCache.get(t);
  if (!r) {
    r = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(t)}(?![\\p{L}\\p{N}])`, 'iu');
    regexCache.set(t, r);
  }
  return r;
}

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const entryDocs = entries.map((e: any) => ({
  id: e.id,
  title: e.title,
  genre: e.genre,
  text: getCleanClassificationInput(e)
}));

const t0 = performance.now();
let totalMatches = 0;
for (const doc of entryDocs) {
  for (const rule of genreRules) {
    for (const kw of rule.keywords) {
      if (getTermRegex(kw).test(doc.text)) totalMatches++;
    }
  }
}
const t1 = performance.now();
console.log(`Execution time for 22 entries: ${(t1 - t0).toFixed(2)}ms, Total matches: ${totalMatches}`);

process.exit(0);
