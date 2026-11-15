import fs from 'fs';
import { genreRules, themeRules } from '../lib/classification/rules';
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

const allRules = [...genreRules, ...themeRules];
const termMap = new Map<string, { term: string; ruleIds: string[]; count: number; matches: string[] }>();

for (const rule of allRules) {
  for (const t of [...rule.keywords, ...rule.phrases, ...rule.contextClues]) {
    const norm = t.trim().toLowerCase();
    if (!norm) continue;
    if (!termMap.has(norm)) {
      termMap.set(norm, { term: t.trim(), ruleIds: [rule.id], count: 0, matches: [] });
    } else {
      const g = termMap.get(norm)!;
      if (!g.ruleIds.includes(rule.id)) g.ruleIds.push(rule.id);
    }
  }
}

for (const [norm, info] of termMap) {
  const rx = getTermRegex(norm);
  for (const doc of entryDocs) {
    if (rx.test(doc.text)) {
      info.count++;
      info.matches.push(`[${doc.genre}] ${doc.title}`);
    }
  }
}

const singleTerms = Array.from(termMap.values()).filter(t => t.count === 1);
singleTerms.sort((a, b) => a.term.localeCompare(b.term));

console.log(`Found ${singleTerms.length} terms appearing in exactly one archive entry:`);
console.log(JSON.stringify(singleTerms.map(t => t.term), null, 2));

process.exit(0);
