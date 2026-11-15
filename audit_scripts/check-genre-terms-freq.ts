import fs from 'fs';
import { genreRules } from '../lib/classification/rules';
import { getCleanClassificationInput } from '../lib/classification/textCleaning';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchTerm(text: string, term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(t)}(?![\\p{L}\\p{N}])`, 'iu');
  return pattern.test(text);
}

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const entryDocs = entries.map((e: any) => ({
  id: e.id,
  title: e.title,
  genre: e.genre,
  text: getCleanClassificationInput(e)
}));

// Collect all unique terms from genreRules
const genreTerms = new Map<string, { term: string; rules: string[]; count: number; matches: string[] }>();
for (const rule of genreRules) {
  for (const t of [...rule.keywords, ...rule.phrases, ...rule.contextClues]) {
    const norm = t.trim().toLowerCase();
    if (!norm) continue;
    if (!genreTerms.has(norm)) {
      genreTerms.set(norm, { term: t.trim(), rules: [rule.value], count: 0, matches: [] });
    } else {
      const g = genreTerms.get(norm)!;
      if (!g.rules.includes(rule.value)) g.rules.push(rule.value);
    }
  }
}

for (const [norm, info] of genreTerms) {
  for (const doc of entryDocs) {
    if (matchTerm(doc.text, norm)) {
      info.count++;
      info.matches.push(`[${doc.genre}] ${doc.title}`);
    }
  }
}

const countMap = new Map<number, string[]>();
for (const [norm, info] of genreTerms) {
  if (!countMap.has(info.count)) countMap.set(info.count, []);
  countMap.get(info.count)!.push(info.term);
}

console.log("=== GENRE RULES TERM FREQUENCY ACROSS 22 ARCHIVE ENTRIES ===");
for (const count of Array.from(countMap.keys()).sort((a, b) => a - b)) {
  const terms = countMap.get(count)!;
  console.log(`\nCount = ${count} (Total ${terms.length} terms):`);
  if (count > 0) {
    for (const t of terms) {
      const info = genreTerms.get(t.toLowerCase())!;
      console.log(`  "${t}" -> in ${info.count} entries: ${info.matches.join('; ')}`);
    }
  } else {
    console.log(`  [${terms.length} terms did not appear in any of the 22 entries]`);
  }
}

process.exit(0);
