setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { trainNaiveBayes } from '../lib/classification/naiveBayes';
import { TRAINING_CORPUS, ACTIVE_GENRES } from '../lib/classification/trainingCorpus';

async function main() {
  const lines: string[] = [];
  const log = (str: string) => lines.push(str);

  log('=== STEP 4: D4 TOP-15 NAIVE BAYES LOG-ODDS PER ACTIVE GENRE ===\n');

  const model = trainNaiveBayes(TRAINING_CORPUS, 1.0);
  log(`Trained NB on N=${TRAINING_CORPUS.length} docs. Vocab size: ${model.vocabularySize}`);
  log(`Active Genres: ${ACTIVE_GENRES.join(', ')}\n`);

  const forbiddenTerms = new Set([
    'riddle', 'riddles', 'tigmo', 'proverb', 'proverbs', 'panultihon',
    'folk', 'song', 'songs', 'epic', 'epics', 'myth', 'myths', 'legend', 'legends', 'chant', 'chants',
    'maravilla', 'catipay', 'curato'
  ]);

  let anyForbiddenFound = false;

  for (const genre of ACTIVE_GENRES) {
    log(`--- Genre: ${genre} (Total words: ${model.totalWordsPerClass[genre] || 0}) ---`);

    const c = genre;
    const totalWords = model.totalWordsPerClass[c] || 0;
    const denominator = totalWords + model.alpha * model.vocabularySize;

    let otherTotal = 0;
    for (const oc of model.classes) {
      if (oc !== c) {
        otherTotal += model.totalWordsPerClass[oc] || 0;
      }
    }
    const otherDenominator = otherTotal + model.alpha * model.vocabularySize;

    const featureScores: { word: string; count: number; logOdds: number }[] = [];

    for (const word of model.vocabulary) {
      const count = model.wordCountsPerClass[c]?.[word] || 0;
      // Only consider words that actually appear in this class
      if (count === 0) continue;

      let otherCount = 0;
      for (const oc of model.classes) {
        if (oc !== c) {
          otherCount += model.wordCountsPerClass[oc]?.[word] || 0;
        }
      }

      const likelihood = (count + model.alpha) / denominator;
      const otherLikelihood = (otherCount + model.alpha) / otherDenominator;
      const logOdds = Math.log(likelihood / otherLikelihood);

      featureScores.push({ word, count, logOdds });
    }

    featureScores.sort((a, b) => b.logOdds - a.logOdds);
    const top15 = featureScores.slice(0, 15);

    for (const [idx, f] of top15.entries()) {
      const isForbidden = forbiddenTerms.has(f.word.toLowerCase());
      if (isForbidden) anyForbiddenFound = true;
      log(`  ${(idx + 1).toString().padStart(2)}. "${f.word}"`.padEnd(28) + `| Count: ${String(f.count).padStart(2)} | Log-Odds: ${f.logOdds.toFixed(4)}${isForbidden ? ' [LEAKAGE FORBIDDEN!]' : ''}`);
    }
    log('');
  }

  log(`Genre name / citation leakage in top 15 features? ${anyForbiddenFound ? 'YES (LEAKAGE DETECTED)' : 'NO (100% CLEAN OF GENRE NAMES/CITATIONS)'}`);

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length;
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `\n--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  const outFile = path.join(process.cwd(), 'audit_scripts', 'out', 'step4-d4-nb.txt');
  fs.writeFileSync(outFile, finalContent, 'utf8');

  console.log(finalContent);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
