setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
import { genreRules, GENRE_NAME_TERMS, CORPUS_TUNED_TERMS } from '../lib/classification/rules';
import { matchWordBoundary } from '../lib/classification/hybrid';

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));

// All original Manobo transcriptions
const transcriptions = entries.map((e: any) => (e.transcription || '').toLowerCase());

const transcriptionTerms = new Set<string>();
const firedTermsMap: Record<string, string[]> = {};

for (const rule of genreRules) {
  const allTerms = [...rule.keywords, ...rule.phrases, ...rule.contextClues];
  for (const t of allTerms) {
    const trimmed = t.trim().toLowerCase();
    if (!trimmed) continue;
    const matchingEntries: string[] = [];
    for (const e of entries) {
      const text = (e.transcription || '').toLowerCase();
      if (matchWordBoundary(text, trimmed)) {
        matchingEntries.push(`${e.id.slice(0, 8)} (${e.title})`);
      }
    }
    if (matchingEntries.length > 0) {
      transcriptionTerms.add(trimmed);
      firedTermsMap[trimmed] = matchingEntries;
    }
  }
}

console.log('Total rule terms appearing in original Manobo transcriptions:', transcriptionTerms.size);
console.log('Terms:');
for (const t of Array.from(transcriptionTerms).sort()) {
  console.log(`  "${t}": [${firedTermsMap[t].join(', ')}]`);
}

process.exit(0);
