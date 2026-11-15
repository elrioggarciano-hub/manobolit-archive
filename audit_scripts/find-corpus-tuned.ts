import fs from 'fs';
import { genreRules, themeRules, locationRules } from '../lib/classification/rules';
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

// Prepare cleaned text for each entry
const entryDocs = entries.map((e: any) => {
  const clean = getCleanClassificationInput(e);
  return { id: e.id, title: e.title, genre: e.genre, text: clean };
});

const allRules = [...genreRules, ...themeRules, ...locationRules];

// Collect all unique terms from rules
interface TermInfo {
  term: string;
  ruleTypes: string[];
  ruleIds: string[];
  categories: string[];
  matchingEntries: { id: string; title: string; genre: string }[];
}

const termMap = new Map<string, TermInfo>();

for (const rule of allRules) {
  const allTerms = [
    ...rule.keywords.map(k => ({ term: k, cat: 'keyword' })),
    ...rule.phrases.map(p => ({ term: p, cat: 'phrase' })),
    ...rule.contextClues.map(c => ({ term: c, cat: 'context' }))
  ];

  for (const item of allTerms) {
    const normTerm = item.term.trim().toLowerCase();
    if (!normTerm) continue;

    if (!termMap.has(normTerm)) {
      termMap.set(normTerm, {
        term: item.term.trim(),
        ruleTypes: [rule.type],
        ruleIds: [rule.id],
        categories: [item.cat],
        matchingEntries: []
      });
    } else {
      const existing = termMap.get(normTerm)!;
      if (!existing.ruleTypes.includes(rule.type)) existing.ruleTypes.push(rule.type);
      if (!existing.ruleIds.includes(rule.id)) existing.ruleIds.push(rule.id);
      if (!existing.categories.includes(item.cat)) existing.categories.push(item.cat);
    }
  }
}

// Now test each term against all 22 entries
for (const [normTerm, info] of termMap.entries()) {
  for (const doc of entryDocs) {
    if (matchTerm(doc.text, normTerm)) {
      info.matchingEntries.push({ id: doc.id, title: doc.title, genre: doc.genre });
    }
  }
}

const singleEntryTerms: TermInfo[] = [];
const multiEntryTerms: TermInfo[] = [];
const zeroEntryTerms: TermInfo[] = [];

for (const info of termMap.values()) {
  if (info.matchingEntries.length === 1) {
    singleEntryTerms.push(info);
  } else if (info.matchingEntries.length > 1) {
    multiEntryTerms.push(info);
  } else {
    zeroEntryTerms.push(info);
  }
}

console.log(`Total unique terms in rules: ${termMap.size}`);
console.log(`Terms matching 0 entries: ${zeroEntryTerms.length}`);
console.log(`Terms matching >1 entries: ${multiEntryTerms.length}`);
console.log(`Terms matching EXACTLY 1 entry (CORPUS-TUNED CANDIDATES): ${singleEntryTerms.length}`);

console.log("\n=== TERMS MATCHING EXACTLY 1 ENTRY ===");
singleEntryTerms.sort((a, b) => a.term.localeCompare(b.term));
for (const t of singleEntryTerms) {
  const match = t.matchingEntries[0];
  console.log(`- "${t.term}" [Rules: ${t.ruleIds.join(',')}] -> Matched [${match.genre}] "${match.title}"`);
}

process.exit(0);
