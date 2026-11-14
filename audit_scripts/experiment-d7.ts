setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import { classifyHybrid } from '../lib/classification/hybrid';

const recipeParagraph = "Preheat oven to 350 degrees F. In a large bowl, whisk together flour, sugar, baking powder, and salt. Add melted butter, eggs, and vanilla extract. Stir until just combined, then fold in chocolate chips. Pour into a greased baking pan and bake for 25 minutes until golden brown.";

function shuffleWords(str: string): string {
  const words = str.split(/\s+/);
  // deterministic pseudo-shuffle
  for (let i = words.length - 1; i > 0; i--) {
    const j = (i * 7 + 3) % (i + 1);
    const temp = words[i];
    words[i] = words[j];
    words[j] = temp;
  }
  return words.join(' ');
}

async function main() {
  const entries = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'audit_scripts', 'entries.json'), 'utf8'));

  // Find a riddle and a song
  const realRiddle = entries.find((e: any) => e.genre === 'RIDDLE');
  const realSong = entries.find((e: any) => e.genre === 'SONG');

  const riddleOriginalText = [
    realRiddle.title,
    realRiddle.englishTitle,
    realRiddle.content,
    realRiddle.transcription,
    realRiddle.translation
  ].filter(Boolean).join(' ');

  const riddleShuffledText = shuffleWords(riddleOriginalText);

  const songWithoutTitle = [
    realSong.content,
    realSong.transcription,
    realSong.translation,
    realSong.bisayaTranslation
  ].filter(Boolean).join(' ');

  const songWithRiddleTitle = [
    "Riddle",
    realSong.content,
    realSong.transcription,
    realSong.translation,
    realSong.bisayaTranslation
  ].filter(Boolean).join(' ');

  const testCases = [
    { label: '(a) Empty string', text: '' },
    { label: '(b) Gibberish "asdf qwer zxcv"', text: 'asdf qwer zxcv' },
    { label: '(c) English recipe paragraph', text: recipeParagraph },
    { label: '(d) Real riddle with words shuffled (original: ' + realRiddle.title + ')', text: riddleShuffledText },
    { label: '(e) Real song with title removed (original: ' + realSong.title + ')', text: songWithoutTitle },
    { label: '(f) Same song with title replaced by "Riddle"', text: songWithRiddleTitle },
  ];

  console.log('=== D7 SANITY & SENSITIVITY TESTS (DETERMINISM VERIFIED OVER 2 RUNS) ===\n');

  for (const tc of testCases) {
    console.log(`======================================================================`);
    console.log(`TEST CASE: ${tc.label}`);
    console.log(`Input Text Snippet: "${tc.text.slice(0, 100)}${tc.text.length > 100 ? '...' : ''}"`);
    console.log(`----------------------------------------------------------------------`);

    for (const mode of ['HYBRID_ENSEMBLE', 'NAIVE_BAYES_ML'] as const) {
      const run1 = classifyHybrid(tc.text, 'ALL', mode);
      const run2 = classifyHybrid(tc.text, 'ALL', mode);

      const isDeterministic = JSON.stringify(run1.genre) === JSON.stringify(run2.genre);

      console.log(`\n  [Mode: ${mode}] (Deterministic: ${isDeterministic ? 'YES' : 'NO'})`);
      console.log(`  Predicted Genre : ${run1.genre.value}`);
      console.log(`  Confidence Score: ${(run1.genre.confidence * 100).toFixed(1)}%`);
      
      const breakdown = run1.algorithmicBreakdown?.scoreBreakdown;
      if (breakdown) {
        console.log(`  Score Breakdown: NB Prob=${(breakdown.naiveBayesProbability * 100).toFixed(1)}% | VSM Sim=${(breakdown.vsmCosineSimilarity * 100).toFixed(1)}% | Neural Sim=${(breakdown.neuralSemanticSimilarity * 100).toFixed(1)}% | Rule Conf=${(breakdown.ruleConfidence * 100).toFixed(1)}%`);
      }
      
      console.log('  All Genre Scores:');
      for (const s of run1.genre.allScores) {
        console.log(`    - ${s.genre.padEnd(10)}: ${(s.confidence * 100).toFixed(1)}%`);
      }
    }
    console.log('\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('D7 error:', err);
  process.exit(1);
});

