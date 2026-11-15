setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import { DEFAULT_TFIDF_MODEL, trainTfidf } from '../lib/classification/tfidf';
import { TRAINING_CORPUS } from '../lib/classification/trainingCorpus';

async function main() {
  const model = trainTfidf(TRAINING_CORPUS);

  console.log('=== STEP 2.2: CONFIRMATION OF N, DF, AND IDF ===');
  console.log(`N (totalDocuments used in IDF) = ${model.totalDocuments} (Expected: 17)`);

  const termsToCheck = ['tu', 'riddle', 'sky', 'monkey'];
  console.log('\nTerm\t\tDF\tIDF Formula: ln(1 + 17 / (1 + df)) + 1.0\tComputed IDF');
  console.log('-----------------------------------------------------------------------------');
  for (const t of termsToCheck) {
    const df = model.dfMap.get(t) || 0;
    const idf = model.getIDF(t);
    const manualFormula = Math.log(1 + 17 / (1 + df)) + 1.0;
    console.log(`${t.padEnd(16)}\t${df}\tln(1 + 17 / (1 + ${df})) + 1.0\t\t\t${idf.toFixed(4)} (manual: ${manualFormula.toFixed(4)})`);
  }

  console.log('\n=== STEP 2.5: TOP 10 CENTROID TERMS PER GENRE (AFTER BUG FIX) ===');

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

  const crossDocBanned = [
    'gihapon traditional', 'people heroic', 'wuhig long', 'antus panultihon', 'maravilla hardship',
    'loneliness night', 'pilgrimage sacred', 'langit beginning', 'existence first'
  ];

  const genreCentroids = model.centroids.filter(c => c.type === 'GENRE');
  const foundCrossDoc: string[] = [];

  for (const c of genreCentroids) {
    const termsWithWeights: Array<{ term: string; weight: number; isGenreWord: boolean }> = [];
    for (const [term, weight] of Object.entries(c.vector)) {
      const lower = term.toLowerCase();
      const isGenreWord = genreNameTerms.has(lower) || Array.from(genreNameTerms).some(gw => lower === gw || lower.startsWith(gw + ' ') || lower.endsWith(' ' + gw));
      termsWithWeights.push({ term, weight, isGenreWord });

      if (crossDocBanned.includes(lower)) {
        foundCrossDoc.push(lower);
      }
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

  console.log('\n=== VERIFICATION OF REMOVED CROSS-DOCUMENT BIGRAMS ===');
  if (foundCrossDoc.length === 0) {
    console.log('ALL 9 CROSS-DOCUMENT BIGRAMS ARE CONFIRMED GONE:');
    crossDocBanned.forEach(b => console.log(`  - "${b}": GONE`));
  } else {
    console.error('ERROR: Found cross-document bigrams still present:', foundCrossDoc);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

