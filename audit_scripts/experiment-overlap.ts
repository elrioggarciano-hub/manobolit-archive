setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import { TRAINING_CORPUS } from '../lib/classification/trainingCorpus';
import { tokenizeUnigrams } from '../lib/classification/tokenizer';

function computeJaccard(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function computeBagCosine(tokensA: string[], tokensB: string[]): number {
  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();
  for (const t of tokensA) freqA.set(t, (freqA.get(t) || 0) + 1);
  for (const t of tokensB) freqB.set(t, (freqB.get(t) || 0) + 1);

  let dot = 0;
  let sumSqA = 0;
  let sumSqB = 0;

  for (const [t, c] of freqA.entries()) {
    sumSqA += c * c;
    if (freqB.has(t)) {
      dot += c * freqB.get(t)!;
    }
  }
  for (const [_, c] of freqB.entries()) {
    sumSqB += c * c;
  }

  const mag = Math.sqrt(sumSqA) * Math.sqrt(sumSqB);
  return mag > 0 ? dot / mag : 0;
}

async function main() {
  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));

  console.log(`=== B3 / D2 OVERLAP CHECK: 22 ARCHIVE ENTRIES vs ${TRAINING_CORPUS.length} TRAINING CORPUS DOCS ===`);
  console.log('Entry ID\tTitle\t\t\t\tGenre\tMatching Training ID\tJaccard\tCosine\tOverlaps (>0.5)?');
  console.log('------------------------------------------------------------------------------------------------------------------------');

  const overlapResults: any[] = [];

  for (const entry of entries) {
    const entryFullText = [
      entry.title,
      entry.manoboTitle,
      entry.englishTitle,
      entry.content,
      entry.transcription,
      entry.translation,
      entry.bisayaTranslation,
    ].filter(Boolean).join(' ');

    const entryTokens = tokenizeUnigrams(entryFullText, true);

    let bestDoc = '';
    let maxCosine = 0;
    let bestJaccard = 0;

    for (const doc of TRAINING_CORPUS) {
      const docTokens = tokenizeUnigrams(doc.text, true);
      const cosine = computeBagCosine(entryTokens, docTokens);
      const jaccard = computeJaccard(entryTokens, docTokens);

      if (cosine > maxCosine) {
        maxCosine = cosine;
        bestJaccard = jaccard;
        bestDoc = doc.id;
      }
    }

    const isOverlap = maxCosine > 0.5 || bestJaccard > 0.5;
    const titleSnippet = (entry.title || '').slice(0, 30).padEnd(30);

    console.log(`${entry.id}\t${titleSnippet}\t${entry.genre}\t${bestDoc}\t\t${bestJaccard.toFixed(3)}\t${maxCosine.toFixed(3)}\t${isOverlap ? 'YES (LEAKAGE)' : 'No'}`);

    overlapResults.push({
      entryId: entry.id,
      title: entry.title,
      genre: entry.genre,
      matchingTrainingId: bestDoc,
      jaccard: bestJaccard,
      cosine: maxCosine,
      overlaps: isOverlap,
    });
  }

  const outPath = path.join(process.cwd(), 'audit_scripts', 'overlap.json');
  fs.writeFileSync(outPath, JSON.stringify(overlapResults, null, 2), 'utf8');
  console.log(`\nSaved overlap data to ${outPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Overlap error:', err);
  process.exit(1);
});

