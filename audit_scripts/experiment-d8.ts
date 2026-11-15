setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import { classifyHybrid } from '../lib/classification/hybrid';

async function main() {
  const entries = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'audit_scripts', 'entries.json'), 'utf8'));

  console.log('=== D8 ENSEMBLE SCALE CHECK ===\n');

  // Select 5 diverse entries across different genres
  const selectedEntries = [
    entries[0], // Song
    entries[5], // Proverb
    entries[10], // Folktale
    entries[14], // Riddle
    entries[19], // Riddle
  ];

  console.log('--- 1. DETAILED COMPONENT BREAKDOWN FOR 5 SAMPLE ENTRIES ---\n');

  for (let idx = 0; idx < selectedEntries.length; idx++) {
    const e = selectedEntries[idx];
    const fullText = [
      e.title,
      e.manoboTitle,
      e.englishTitle,
      e.content,
      e.transcription,
      e.translation,
      e.type === 'FOLK_SONG' ? 'folk song maravilla' : '',
    ].filter(Boolean).join(' ');

    const res = classifyHybrid(fullText, 'ALL', 'HYBRID_ENSEMBLE');
    const breakdown = res.algorithmicBreakdown;

    console.log(`========================================================================================`);
    console.log(`ENTRY #${idx + 1}: "${e.title}" | Actual Labeled Genre: ${e.genre}`);
    console.log(`Hybrid Predicted: ${res.genre.value} (${(res.genre.confidence * 100).toFixed(1)}%)`);
    console.log(`----------------------------------------------------------------------------------------`);
    console.log(`Genre\t\tNB Prob (%)\tVSM Sim (%)\tNeural Sim (%)\tRule Conf (%)\tFinal Ensemble (%)`);
    console.log(`----------------------------------------------------------------------------------------`);

    const allGenres = res.genre.allScores.map(s => s.genre);

    for (const g of allGenres) {
      const nbMatch = breakdown?.naiveBayes.allProbabilities.find(p => p.genre === g);
      const nbProb = (nbMatch ? nbMatch.probability : 0) * 100;

      const vsmMatch = breakdown?.vsm.allGenreScores.find(s => s.category === g);
      const vsmSim = (vsmMatch ? vsmMatch.cosineSimilarity : 0) * 100;

      const charMatch = breakdown?.charNgram.allGenreScores.find((s: any) => s.genre === g);
      const charSim = (charMatch ? charMatch.similarity : 0) * 100;

      const ruleDetail = res.ruleDetails;
      // Find rule confidence for genre g
      const ruleScores = res.genre.allScores.find(s => s.genre === g);
      const finalConf = (ruleScores ? ruleScores.confidence : 0) * 100;

      // Calculate the rule component score
      // From formula: combined = (0.40 * nbProb) + (0.25 * vsmSim) + (0.20 * neuralSim) + (0.15 * ruleConf) + fuzzy
      // We can inspect the individual rule conf from rulesApplied
      let ruleConf = 0;
      for (const [rId, detail] of Object.entries(res.ruleDetails)) {
        if (rId.startsWith('G') && detail.confidence > 0) {
          // Check if this rule matches genre g
          if (rId.includes(g) || res.rulesApplied.includes(rId)) {
            // let's approximate or compute exact
          }
        }
      }
      // Or get from allScores in raw hybrid
      console.log(`${g.padEnd(12)}\t${nbProb.toFixed(1).padStart(8)}%\t${vsmSim.toFixed(1).padStart(8)}%\t${charSim.toFixed(1).padStart(11)}%\t\t-\t${finalConf.toFixed(1).padStart(12)}%`);
    }
    console.log('\n');
  }

  // --- 2. Share of 22 entries where Hybrid winner == NB winner ---
  let hybridEqualsNbCount = 0;
  let hybridEqualsRuleCount = 0;
  let hybridEqualsVsmCount = 0;
  let hybridEqualsCharCount = 0;

  console.log('--- 2. CONCORDANCE ACROSS ALL 22 ENTRIES ---');
  console.log('Index\tActual\t\tHybrid\t\tNB\t\tVSM\t\tCharNgram\tRule\t\tHybrid == NB?');
  console.log('------------------------------------------------------------------------------------------------------------------------');

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const fullText = [
      e.title,
      e.manoboTitle,
      e.englishTitle,
      e.content,
      e.transcription,
      e.translation,
      e.type === 'FOLK_SONG' ? 'folk song maravilla' : '',
    ].filter(Boolean).join(' ');

    const hRes = classifyHybrid(fullText, 'ALL', 'HYBRID_ENSEMBLE');
    const nbRes = classifyHybrid(fullText, 'ALL', 'NAIVE_BAYES_ML');
    const vsmRes = classifyHybrid(fullText, 'ALL', 'TF_IDF_VSM');
    const neuRes = classifyHybrid(fullText, 'ALL', 'CHAR_NGRAM');
    const ruleRes = classifyHybrid(fullText, 'ALL', 'RULE_BASED');

    const hWinner = hRes.genre.value;
    const nbWinner = nbRes.genre.value;
    const vsmWinner = vsmRes.genre.value;
    const neuWinner = neuRes.genre.value;
    const ruleWinner = ruleRes.genre.value;

    const matchesNb = hWinner === nbWinner;
    if (matchesNb) hybridEqualsNbCount++;
    if (hWinner === ruleWinner) hybridEqualsRuleCount++;
    if (hWinner === vsmWinner) hybridEqualsVsmCount++;
    if (hWinner === neuWinner) hybridEqualsCharCount++;

    console.log(`${String(i + 1).padStart(2)}\t${e.genre.padEnd(12)}\t${hWinner.padEnd(12)}\t${nbWinner.padEnd(12)}\t${vsmWinner.padEnd(12)}\t${neuWinner.padEnd(12)}\t${ruleWinner.padEnd(12)}\t${matchesNb ? 'YES' : 'NO'}`);
  }

  const pctNb = (hybridEqualsNbCount / entries.length) * 100;
  const pctRule = (hybridEqualsRuleCount / entries.length) * 100;
  const pctVsm = (hybridEqualsVsmCount / entries.length) * 100;
  const pctChar = (hybridEqualsCharCount / entries.length) * 100;

  console.log('\n=== SUMMARY OF CONCORDANCE ===');
  console.log(`Hybrid winner == Naive Bayes winner : ${hybridEqualsNbCount} / ${entries.length} (${pctNb.toFixed(1)}%)`);
  console.log(`Hybrid winner == Rule-Based winner  : ${hybridEqualsRuleCount} / ${entries.length} (${pctRule.toFixed(1)}%)`);
  console.log(`Hybrid winner == TF-IDF VSM winner  : ${hybridEqualsVsmCount} / ${entries.length} (${pctVsm.toFixed(1)}%)`);
  console.log(`Hybrid winner == Char N-Gram winner : ${hybridEqualsCharCount} / ${entries.length} (${pctChar.toFixed(1)}%)`);

  process.exit(0);
}

main().catch(err => {
  console.error('D8 error:', err);
  process.exit(1);
});

