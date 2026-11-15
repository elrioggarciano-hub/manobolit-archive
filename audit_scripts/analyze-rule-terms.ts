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
const entryDocs = entries.map((e: any) => ({
  id: e.id,
  title: e.title,
  genre: e.genre,
  text: getCleanClassificationInput(e)
}));

function analyzeRules(ruleSet: typeof genreRules, name: string) {
  console.log(`\n=================== ANALYZING ${name} ===================`);
  const termMap = new Map<string, { term: string; ruleId: string; count: number; matches: string[] }>();

  for (const rule of ruleSet) {
    const all = [...rule.keywords, ...rule.phrases, ...rule.contextClues];
    for (const term of all) {
      const norm = term.trim().toLowerCase();
      if (!norm) continue;
      if (!termMap.has(norm)) {
        termMap.set(norm, { term, ruleId: rule.id, count: 0, matches: [] });
      }
    }
  }

  for (const [norm, info] of termMap) {
    for (const doc of entryDocs) {
      if (matchTerm(doc.text, norm)) {
        info.count++;
        info.matches.push(`[${doc.genre}] ${doc.title}`);
      }
    }
  }

  const single = Array.from(termMap.values()).filter(t => t.count === 1);
  const multi = Array.from(termMap.values()).filter(t => t.count > 1);
  const zero = Array.from(termMap.values()).filter(t => t.count === 0);

  console.log(`Total unique terms: ${termMap.size}`);
  console.log(`Terms in 0 entries: ${zero.length}`);
  console.log(`Terms in >1 entries: ${multi.length}`);
  console.log(`Terms in EXACTLY 1 entry: ${single.length}`);

  console.log(`\nSingle entry terms in ${name}:`);
  for (const s of single) {
    console.log(`  "${s.term}" (${s.ruleId}) -> ${s.matches[0]}`);
  }
}

analyzeRules(genreRules, "GENRE RULES");
analyzeRules(themeRules, "THEME RULES");
analyzeRules(locationRules, "LOCATION RULES");

process.exit(0);
