setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { TRAINING_CORPUS, ACTIVE_GENRES } from '../lib/classification/trainingCorpus';
import { cleanClassificationText } from '../lib/classification/textCleaning';

async function main() {
  const lines: string[] = [];
  const log = (str: string) => lines.push(str);

  log('=== STEP 4: CORPUS STRUCTURE & CLASS IMBALANCE AUDIT ===\n');

  // 1. Training Corpus (Active Genres)
  const activeDocs = TRAINING_CORPUS.filter(d => ACTIVE_GENRES.includes(d.genre as any));
  log(`Total Active Training Documents: ${activeDocs.length}`);
  log(`Active Genres: ${ACTIVE_GENRES.join(', ')}\n`);

  const perGenreTokens: Record<string, { docCount: number; tokenCount: number; charCount: number; vocab: Set<string> }> = {};
  const totalVocab = new Set<string>();

  for (const g of ACTIVE_GENRES) {
    perGenreTokens[g] = { docCount: 0, tokenCount: 0, charCount: 0, vocab: new Set<string>() };
  }

  for (const doc of activeDocs) {
    const cleaned = cleanClassificationText(doc.text);
    const tokens = cleaned.toLowerCase().match(/[\p{L}\p{M}]+/gu) || [];
    const g = doc.genre;
    if (perGenreTokens[g]) {
      perGenreTokens[g].docCount++;
      perGenreTokens[g].tokenCount += tokens.length;
      perGenreTokens[g].charCount += cleaned.length;
      tokens.forEach(t => {
        perGenreTokens[g].vocab.add(t);
        totalVocab.add(t);
      });
    }
  }

  log('--- 1. TRAINING CORPUS PER-GENRE METRICS ---');
  for (const g of ACTIVE_GENRES) {
    const data = perGenreTokens[g];
    log(`Genre: ${g.padEnd(10)} | Docs: ${String(data.docCount).padStart(2)} | Tokens: ${String(data.tokenCount).padStart(4)} | Unique Words: ${String(data.vocab.size).padStart(4)} | Avg Tokens/Doc: ${(data.tokenCount / (data.docCount || 1)).toFixed(1)}`);
  }
  log(`\nTotal Active Training Vocabulary Size: ${totalVocab.size} unique word tokens\n`);

  // Class Imbalance Ratio (Training Corpus)
  const docCounts = ACTIVE_GENRES.map(g => perGenreTokens[g].docCount);
  const maxDocCount = Math.max(...docCounts);
  const minDocCount = Math.min(...docCounts);
  const imbalanceRatioDocs = (maxDocCount / (minDocCount || 1)).toFixed(2);
  const tokenCounts = ACTIVE_GENRES.map(g => perGenreTokens[g].tokenCount);
  const maxTokenCount = Math.max(...tokenCounts);
  const minTokenCount = Math.min(...tokenCounts);
  const imbalanceRatioTokens = (maxTokenCount / (minTokenCount || 1)).toFixed(2);

  log('--- 2. TRAINING CORPUS IMBALANCE RATIOS ---');
  log(`Max Docs / Min Docs: ${maxDocCount} / ${minDocCount} = ${imbalanceRatioDocs}:1`);
  log(`Max Tokens / Min Tokens: ${maxTokenCount} / ${minTokenCount} = ${imbalanceRatioTokens}:1\n`);

  // 2. Archive Entries (22 Entries)
  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  if (fs.existsSync(entriesPath)) {
    const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
    log(`--- 3. ARCHIVE DATASET (N=${entries.length}) PER-GENRE METRICS ---`);
    const archivePerGenre: Record<string, { count: number; tokenCount: number; vocab: Set<string> }> = {};
    const archiveTotalVocab = new Set<string>();
    for (const g of ACTIVE_GENRES) {
      archivePerGenre[g] = { count: 0, tokenCount: 0, vocab: new Set<string>() };
    }

    for (const e of entries) {
      const g = e.genre;
      const combined = cleanClassificationText([e.transcription, e.translation].filter(Boolean).join(' '));
      const tokens = combined.toLowerCase().match(/[\p{L}\p{M}]+/gu) || [];
      if (archivePerGenre[g]) {
        archivePerGenre[g].count++;
        archivePerGenre[g].tokenCount += tokens.length;
        tokens.forEach(t => {
          archivePerGenre[g].vocab.add(t);
          archiveTotalVocab.add(t);
        });
      }
    }

    for (const g of ACTIVE_GENRES) {
      const data = archivePerGenre[g];
      log(`Genre: ${g.padEnd(10)} | Entries: ${String(data.count).padStart(2)} | Tokens: ${String(data.tokenCount).padStart(4)} | Unique Words: ${String(data.vocab.size).padStart(4)} | Avg Tokens/Entry: ${(data.tokenCount / (data.count || 1)).toFixed(1)}`);
    }
    log(`\nTotal Archive Vocabulary Size: ${archiveTotalVocab.size} unique word tokens`);

    const archCounts = ACTIVE_GENRES.map(g => archivePerGenre[g].count);
    const maxArch = Math.max(...archCounts);
    const minArch = Math.min(...archCounts);
    log(`Archive Class Imbalance (Entries): ${maxArch} / ${minArch} = ${(maxArch / (minArch || 1)).toFixed(2)}:1\n`);
  }

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length;
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  const outFile = path.join(process.cwd(), 'audit_scripts', 'out', 'structure.txt');
  fs.writeFileSync(outFile, finalContent, 'utf8');

  console.log(finalContent);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
