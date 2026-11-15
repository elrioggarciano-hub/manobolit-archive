setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import { DEFAULT_TFIDF_MODEL, trainTfidf } from '../lib/classification/tfidf';
import { TRAINING_CORPUS } from '../lib/classification/trainingCorpus';

async function main() {
  const model = DEFAULT_TFIDF_MODEL || trainTfidf(TRAINING_CORPUS);

  console.log('=== STEP 2 CHECK: TOP 10 CENTROID TERMS PER GENRE (DOCUMENT-TRAINED TF-IDF) ===');
  console.log(`Trained on ${model.totalDocuments} documents. Total centroids: ${model.centroids.length}\n`);

  const genreNameTerms = new Set([
    'myth', 'myths', 'cosmogony', 'origin', 'origins', 'creation', 'deity', 'deities', 'god', 'gods',
    'legend', 'legends',
    'folktale', 'folktales', 'fable', 'fables', 'moral', 'trickster', 'sugilanon', 'tudtul',
    'epic', 'ulaging', 'champion', 'warrior', 'chieftain',
    'riddle', 'riddles', 'tigmo', 'answer', 'puzzle', 'mystery',
    'proverb', 'proverbs', 'panultihon',
    'song', 'songs', 'folk song', 'folk songs', 'sing', 'singer',
    'chant', 'chants', 'ritual', 'babaylan', 'shaman'
  ]);

  const genreCentroids = model.centroids.filter(c => c.type === 'GENRE');

  for (const c of genreCentroids) {
    const termsWithWeights: Array<{ term: string; weight: number; isGenreWord: boolean }> = [];
    for (const [term, weight] of Object.entries(c.vector)) {
      const lower = term.toLowerCase();
      const isGenreWord = genreNameTerms.has(lower) || Array.from(genreNameTerms).some(gw => lower === gw || lower.startsWith(gw + ' ') || lower.endsWith(' ' + gw));
      termsWithWeights.push({ term, weight, isGenreWord });
    }

    termsWithWeights.sort((a, b) => b.weight - a.weight);
    const top10 = termsWithWeights.slice(0, 10);

    console.log(`\n--- GENRE: ${c.category} (Centroid Vector Magnitude: ${c.magnitude.toFixed(3)}) ---`);
    console.log('Rank\tTerm\t\t\tWeight\t\tGenre-Name Word?');
    console.log('-----------------------------------------------------------------------------');
    top10.forEach((t, idx) => {
      const flag = t.isGenreWord ? '>>> [GENRE-NAME WORD] <<<' : '';
      console.log(`${idx + 1}\t${t.term.padEnd(20)}\t${t.weight.toFixed(3)}\t\t${flag}`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

