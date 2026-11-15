setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_TRAINED_NB_MODEL } from '../lib/classification/naiveBayes';
import { DEFAULT_TFIDF_MODEL } from '../lib/classification/tfidf';
import { DEFAULT_CHAR_NGRAM_MODEL } from '../lib/classification/charNgram';

async function main() {
  const lines: string[] = [];
  const log = (str: string) => lines.push(str);

  log('=== STEP 4: GENRE-NAME AND CITATION TOKEN SCAN ===\n');

  const targetTokens = [
    'riddle', 'riddles', 'tigmo', 'proverb', 'proverbs', 'panultihon',
    'folk', 'song', 'songs', 'epic', 'epics', 'myth', 'myths', 'legend', 'legends',
    'chant', 'chants', 'maravilla', 'catipay', 'curato'
  ];

  log('Target tokens scanned: ' + targetTokens.join(', ') + '\n');

  // 1. Scan Naive Bayes Vocabulary
  log('--- 1. NAIVE BAYES VOCABULARY SCAN ---');
  const nbHits: string[] = [];
  for (const t of targetTokens) {
    if (DEFAULT_TRAINED_NB_MODEL.vocabulary.has(t)) {
      nbHits.push(t);
    }
  }
  log(`Total vocabulary terms: ${DEFAULT_TRAINED_NB_MODEL.vocabularySize}`);
  log(`Target tokens present in NB vocabulary: ${nbHits.length > 0 ? nbHits.join(', ') : 'NONE (0 hits)'}\n`);

  // 2. Scan TF-IDF Centroid Features
  log('--- 2. TF-IDF CENTROID VECTORS SCAN ---');
  const tfidfHits: string[] = [];
  for (const c of DEFAULT_TFIDF_MODEL.centroids) {
    for (const t of targetTokens) {
      if (c.vector[t] !== undefined) {
        tfidfHits.push(`${c.category}::${t} (weight: ${c.vector[t].toFixed(4)})`);
      }
    }
  }
  log(`Total TF-IDF centroids: ${DEFAULT_TFIDF_MODEL.centroids.length}`);
  log(`Target tokens present in TF-IDF centroids: ${tfidfHits.length > 0 ? tfidfHits.join('; ') : 'NONE (0 hits)'}\n`);

  // 3. Scan Character N-Grams
  log('--- 3. CHAR N-GRAM CENTROID VECTORS SCAN ---');
  // Full-word target tokens as character n-grams with word boundaries e.g. "^song$"
  const charHits: string[] = [];
  for (const c of DEFAULT_CHAR_NGRAM_MODEL.centroids) {
    for (const t of targetTokens) {
      const fullWordGram = `^${t}$`;
      if (c.vector[fullWordGram] !== undefined) {
        charHits.push(`${c.genre}::${fullWordGram} (weight: ${c.vector[fullWordGram].toFixed(4)})`);
      }
    }
  }
  log(`Full-word bounded target n-grams present: ${charHits.length > 0 ? charHits.join('; ') : 'NONE (0 hits)'}\n`);

  log(`Overall summary: ${nbHits.length + tfidfHits.length + charHits.length === 0 ? 'ALL MODELS 100% CLEAN OF GENRE NAMES & CITATIONS' : 'WARNING: SOME TARGET TOKENS STILL PRESENT'}`);

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length;
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `\n--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  const outFile = path.join(process.cwd(), 'audit_scripts', 'out', 'step4-genre-tokens.txt');
  fs.writeFileSync(outFile, finalContent, 'utf8');

  console.log(finalContent);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
