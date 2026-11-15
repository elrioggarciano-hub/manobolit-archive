setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import { DEFAULT_CHAR_NGRAM_MODEL } from '../lib/classification/charNgram';

async function main() {
  console.log('=== STEP 3: TOP 10 CHARACTER N-GRAMS PER GENRE CENTROID ===\n');

  for (const centroid of DEFAULT_CHAR_NGRAM_MODEL.centroids) {
    const entries = Object.entries(centroid.vector);
    entries.sort((a, b) => b[1] - a[1]);
    const top10 = entries.slice(0, 10);

    console.log(`--- Genre: ${centroid.genre} (Total unique n-grams: ${entries.length}) ---`);
    for (const [idx, [gram, weight]] of top10.entries()) {
      console.log(`  ${(idx + 1).toString().padStart(2, ' ')}. "${gram}" : ${weight.toFixed(5)}`);
    }
    console.log('');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
