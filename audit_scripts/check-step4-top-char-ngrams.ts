setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_CHAR_NGRAM_MODEL } from '../lib/classification/charNgram';
import { ACTIVE_GENRES } from '../lib/classification/trainingCorpus';

async function main() {
  const lines: string[] = [];
  const log = (str: string) => lines.push(str);

  log('=== STEP 4: TOP 10 CHARACTER N-GRAMS PER ACTIVE GENRE CENTROID ===\n');

  for (const genre of ACTIVE_GENRES) {
    const centroid = DEFAULT_CHAR_NGRAM_MODEL.centroids.find(c => c.genre === genre);
    if (!centroid) {
      log(`--- Genre: ${genre} : CENTROID NOT FOUND ---`);
      continue;
    }

    const entries = Object.entries(centroid.vector);
    entries.sort((a, b) => b[1] - a[1]);
    const top10 = entries.slice(0, 10);

    log(`--- Genre: ${centroid.genre} (Total unique n-grams: ${entries.length}) ---`);
    for (const [idx, [gram, weight]] of top10.entries()) {
      log(`  ${(idx + 1).toString().padStart(2, ' ')}. "${gram}"`.padEnd(16) + `: ${weight.toFixed(5)}`);
    }
    log('');
  }

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length;
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `\n--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  const outFile = path.join(process.cwd(), 'audit_scripts', 'out', 'step4-char-ngrams.txt');
  fs.writeFileSync(outFile, finalContent, 'utf8');

  console.log(finalContent);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

