setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import { TRAINING_CORPUS } from '../lib/classification/trainingCorpus';
import { trainNaiveBayes, predictNaiveBayes, DEFAULT_TRAINED_NB_MODEL } from '../lib/classification/naiveBayes';
import { trainTfidf, classifyWithVSM, DEFAULT_TFIDF_MODEL } from '../lib/classification/tfidf';
import { classifyHybrid } from '../lib/classification/hybrid';

async function main() {
  const proverbText = "Panultihon (Life is hard) Hinuy inggad nukoy kapoit tu kahanayan mas maayad pad og antus tu kaungaw kaysa maghimu tu marat.";
  const songRiddleDocs = TRAINING_CORPUS.filter(d => d.genre === 'SONG' || d.genre === 'RIDDLE');

  console.log('=== AUDIT CHECK: INJECTION PROOF (END-TO-END WIRING) ===');
  console.log(`Test Input Text (PROVERB): "${proverbText}"\n`);
  console.log(`Subset Training Corpus: ${songRiddleDocs.length} documents (SONG and RIDDLE only).\n`);

  // ---------------------------------------------------------------------------
  // PART A: NAIVE BAYES INJECTION PROOF
  // ---------------------------------------------------------------------------
  console.log('---------------------------------------------------------------------------');
  console.log('PART A: NAIVE BAYES INJECTION PROOF');
  console.log('---------------------------------------------------------------------------');

  const defaultNbPred = predictNaiveBayes(proverbText, 'ALL', DEFAULT_TRAINED_NB_MODEL);
  console.log('1. Default NB Model (Trained on full 17 docs, 8 genres):');
  console.log(`   Predicted Genre: ${defaultNbPred.predictedGenre} (Prob: ${(defaultNbPred.posteriorProbability * 100).toFixed(1)}%)`);
  console.log('   All Probabilities:');
  defaultNbPred.allProbabilities.forEach(p => {
    console.log(`     - ${p.genre.padEnd(10)}: ${(p.probability * 100).toFixed(2)}%`);
  });

  const customNbModel = trainNaiveBayes(songRiddleDocs);
  const injectedNbPred = predictNaiveBayes(proverbText, 'ALL', customNbModel);
  const hybridInjectedNb = classifyHybrid(proverbText, 'ALL', 'NAIVE_BAYES_ML', { nb: customNbModel });

  console.log('\n2. Injected Custom NB Model (Trained ONLY on SONG + RIDDLE):');
  console.log(`   Direct predictNaiveBayes Predicted: ${injectedNbPred.predictedGenre} (Prob: ${(injectedNbPred.posteriorProbability * 100).toFixed(1)}%)`);
  console.log(`   Via classifyHybrid(..., { nb }) Predicted: ${hybridInjectedNb.genre.value} (Prob: ${(hybridInjectedNb.genre.confidence * 100).toFixed(1)}%)`);
  console.log('   All Probabilities (Restricted to SONG and RIDDLE only):');
  injectedNbPred.allProbabilities.forEach(p => {
    console.log(`     - ${p.genre.padEnd(10)}: ${(p.probability * 100).toFixed(2)}%`);
  });

  const nbDiffers = JSON.stringify(defaultNbPred.allProbabilities) !== JSON.stringify(injectedNbPred.allProbabilities);
  console.log(`\n>> NB Injection Result: ${nbDiffers ? 'SUCCESS (Distributions Differ)' : 'FAILED (Identical)'}`);

  // ---------------------------------------------------------------------------
  // PART B: TF-IDF INJECTION PROOF
  // ---------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------------------');
  console.log('PART B: TF-IDF INJECTION PROOF');
  console.log('---------------------------------------------------------------------------');

  const defaultTfidfPred = classifyWithVSM(proverbText, 'ALL', DEFAULT_TFIDF_MODEL);
  console.log('1. Default TF-IDF Model (Trained on full 17 docs, 8 genres):');
  console.log(`   Predicted Genre: ${defaultTfidfPred.topGenre} (Cosine Sim: ${(defaultTfidfPred.topGenreSimilarity * 100).toFixed(1)}%)`);
  console.log('   All Genre Cosine Similarities:');
  defaultTfidfPred.allGenreScores.forEach(s => {
    console.log(`     - ${s.category.padEnd(10)}: ${(s.cosineSimilarity * 100).toFixed(2)}%`);
  });

  const customTfidfModel = trainTfidf(songRiddleDocs);
  const injectedTfidfPred = classifyWithVSM(proverbText, 'ALL', customTfidfModel);
  const hybridInjectedTfidf = classifyHybrid(proverbText, 'ALL', 'TF_IDF_VSM', { tfidf: customTfidfModel });

  console.log('\n2. Injected Custom TF-IDF Model (Trained ONLY on SONG + RIDDLE):');
  console.log(`   Direct classifyWithVSM Predicted: ${injectedTfidfPred.topGenre} (Cosine Sim: ${(injectedTfidfPred.topGenreSimilarity * 100).toFixed(1)}%)`);
  console.log(`   Via classifyHybrid(..., { tfidf }) Predicted: ${hybridInjectedTfidf.genre.value} (Cosine Sim: ${(hybridInjectedTfidf.genre.confidence * 100).toFixed(1)}%)`);
  console.log('   All Genre Cosine Similarities (Restricted to SONG and RIDDLE only):');
  injectedTfidfPred.allGenreScores.forEach(s => {
    console.log(`     - ${s.category.padEnd(10)}: ${(s.cosineSimilarity * 100).toFixed(2)}%`);
  });

  const tfidfDiffers = JSON.stringify(defaultTfidfPred.allGenreScores) !== JSON.stringify(injectedTfidfPred.allGenreScores);
  console.log(`\n>> TF-IDF Injection Result: ${tfidfDiffers ? 'SUCCESS (Distributions Differ)' : 'FAILED (Identical)'}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Injection proof error:', err);
  process.exit(1);
});

