setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import { TRAINING_CORPUS } from '../lib/classification/trainingCorpus';
import { trainNaiveBayes } from '../lib/classification/naiveBayes';

async function main() {
  const model = trainNaiveBayes(TRAINING_CORPUS, 1.0);
  console.log('=== D4 NAIVE BAYES LEAKAGE CHECK (TOP 15 LOG-ODDS TOKENS PER GENRE) ===');
  console.log(`Trained on ${model.totalDocuments} documents, vocabulary size = ${model.vocabularySize} tokens.\n`);

  // Words that indicate genre labels, taxonomic categories, or dataset descriptors
  const genreIndicators = new Set([
    'riddle', 'tigmo', 'panultihon', 'proverb', 'song', 'songs', 'folk song', 'folk', 'sing', 'singer',
    'creation', 'origin', 'origins', 'myth', 'myths', 'cosmogony', 'deity', 'deities', 'god', 'gods',
    'epic', 'ulaging', 'champion', 'warrior', 'chieftain', 'legend', 'legends', 'folktale', 'folktales',
    'sugilanon', 'tudtul', 'fable', 'fables', 'trickster', 'moral', 'chant', 'chants', 'shaman', 'babaylan',
    'ritual', 'answer', 'maravilla', 'catipay', 'curato'
  ]);

  for (const c of model.classes) {
    const totalWords = model.totalWordsPerClass[c] || 0;
    const denom = totalWords + model.alpha * model.vocabularySize;

    let otherTotal = 0;
    for (const oc of model.classes) {
      if (oc !== c) otherTotal += model.totalWordsPerClass[oc] || 0;
    }
    const otherDenom = otherTotal + model.alpha * model.vocabularySize;

    const tokenScores: Array<{ token: string; count: number; logOdds: number; isFlagged: boolean }> = [];

    for (const token of model.vocabulary) {
      const count = model.wordCountsPerClass[c]?.[token] || 0;
      if (count === 0) continue; // Only tokens that actually appear in this class

      let otherCount = 0;
      for (const oc of model.classes) {
        if (oc !== c) otherCount += model.wordCountsPerClass[oc]?.[token] || 0;
      }

      const likelihood = (count + model.alpha) / denom;
      const otherLikelihood = (otherCount + model.alpha) / otherDenom;
      const logOdds = Math.log(likelihood / otherLikelihood);

      const isFlagged = genreIndicators.has(token.toLowerCase());
      tokenScores.push({ token, count, logOdds, isFlagged });
    }

    tokenScores.sort((a, b) => b.logOdds - a.logOdds);
    const top15 = tokenScores.slice(0, 15);

    console.log(`\n--- GENRE: ${c} (Total tokens in class: ${totalWords}) ---`);
    console.log('Rank\tToken\t\t\tCount\tLog-Odds\tFlagged Descriptor?');
    console.log('-----------------------------------------------------------------------------');
    top15.forEach((t, idx) => {
      const flagText = t.isFlagged ? '>>> [GENRE/LABEL LEAKAGE] <<<' : '';
      console.log(`${idx + 1}\t${t.token.padEnd(20)}\t${t.count}\t${t.logOdds.toFixed(3)}\t\t${flagText}`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error('D4 error:', err);
  process.exit(1);
});

