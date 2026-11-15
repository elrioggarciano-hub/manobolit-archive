setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import { TRAINING_CORPUS } from '../lib/classification/trainingCorpus';
import { trainCharNgram, classifyWithCharNgram, DEFAULT_CHAR_NGRAM_MODEL } from '../lib/classification/charNgram';
import { classifyHybrid } from '../lib/classification/hybrid';

async function main() {
  console.log('=== STEP 3: CHAR_NGRAM INJECTION PROOF ===');

  const testText = 'inggad nukoy ka lisud kan kinabuhi, mas marujow pad nug antus ki to ka buntas';
  console.log(`Test text (PROVERB): "${testText}"\n`);

  // 1. Train model on only SONG and RIDDLE docs
  const songRiddleDocs = TRAINING_CORPUS.filter(d => d.genre === 'SONG' || d.genre === 'RIDDLE');
  console.log(`Subset docs count: ${songRiddleDocs.length} (SONG + RIDDLE only)`);
  console.log(`Full corpus docs count: ${TRAINING_CORPUS.length}`);

  const subsetModel = trainCharNgram(songRiddleDocs);

  // 2. Classify with classifyWithCharNgram
  const resFull = classifyWithCharNgram(testText, 'ALL', DEFAULT_CHAR_NGRAM_MODEL);
  const resSubset = classifyWithCharNgram(testText, 'ALL', subsetModel);

  console.log('\n--- (a) Standalone classifyWithCharNgram ---');
  console.log('Full model predictions:');
  for (const s of resFull.allGenreScores) {
    console.log(`  ${s.genre.padEnd(10)}: ${s.similarity.toFixed(4)}`);
  }
  console.log(`Predicted: ${resFull.predictedGenre} (${resFull.confidence.toFixed(4)})`);

  console.log('\nSubset model (SONG + RIDDLE only) predictions:');
  for (const s of resSubset.allGenreScores) {
    console.log(`  ${s.genre.padEnd(10)}: ${s.similarity.toFixed(4)}`);
  }
  console.log(`Predicted: ${resSubset.predictedGenre} (${resSubset.confidence.toFixed(4)})`);

  // 3. Classify with classifyHybrid mode 'CHAR_NGRAM' (with injection vs default)
  console.log('\n--- (b) classifyHybrid with algorithmMode = CHAR_NGRAM ---');
  const hybridDefault = classifyHybrid(testText, 'ALL', 'CHAR_NGRAM');
  const hybridInjected = classifyHybrid(testText, 'ALL', 'CHAR_NGRAM', { charNgram: subsetModel });

  console.log(`Default classifyHybrid CHAR_NGRAM predicted: ${hybridDefault.genre.value} (${hybridDefault.genre.confidence})`);
  console.log('Default scores:', hybridDefault.genre.allScores);

  console.log(`\nInjected classifyHybrid CHAR_NGRAM predicted: ${hybridInjected.genre.value} (${hybridInjected.genre.confidence})`);
  console.log('Injected scores:', hybridInjected.genre.allScores);

  const areDifferent = JSON.stringify(hybridDefault.genre.allScores) !== JSON.stringify(hybridInjected.genre.allScores);
  console.log(`\nDistributions differ? ${areDifferent ? 'YES (Injection verified)' : 'NO (ERROR: Injection failed)'}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
