import fs from 'fs';
import { ACTIVE_GENRES, TRAINING_CORPUS } from '../lib/classification/trainingCorpus';
import { trainNaiveBayes } from '../lib/classification/naiveBayes';
import { trainTfidf } from '../lib/classification/tfidf';
import { trainCharNgram } from '../lib/classification/charNgram';
import { classifyHybrid } from '../lib/classification/hybrid';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const sanityCases = [
  { name: 'empty', text: '' },
  { name: 'gibberish', text: 'asdf qwer zxcv poiuy lkjhg mnbvc' },
  { name: 'recipe', text: 'Preheat oven to 375 degrees. Whisk flour, baking powder, and sugar in a large bowl. Add milk and eggs.' },
  { name: 'shuffled riddle', text: 'angud bitok pad unto maintok kaba-kaba aslag pag to Tu' },
  { name: 'title removed', text: 'Inggad pusilon, buhi gihapon. Even if you shoot it, it will still be alive.' },
  { name: 'title swapped to Riddle', text: 'Riddle. Inggad pusilon, buhi gihapon. Even if you shoot it, it will still be alive.' }
];

console.log("=== D7 SANITY INPUTS TESTING ===");
for (const sc of sanityCases) {
  const res = classifyHybrid(sc.text, 'ALL', 'HYBRID_ENSEMBLE');
  console.log(`\nCase: "${sc.name}"`);
  console.log(`  Input text: "${sc.text.slice(0, 60)}"`);
  console.log(`  Genre: ${res.genre.value} (conf: ${res.genre.confidence})`);
  console.log(`  All scores:`, res.genre.allScores);
}

process.exit(0);
