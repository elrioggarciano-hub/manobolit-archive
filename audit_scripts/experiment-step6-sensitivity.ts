import fs from 'fs';
import crypto from 'crypto';
import { ACTIVE_GENRES, TRAINING_CORPUS } from '../lib/classification/trainingCorpus';
import { trainNaiveBayes, predictNaiveBayes } from '../lib/classification/naiveBayes';
import { trainTfidf, classifyWithVSM } from '../lib/classification/tfidf';
import { trainCharNgram, classifyWithCharNgram } from '../lib/classification/charNgram';
import { genreRules } from '../lib/classification/rules';
import { scoreRule, softmaxDistribution } from '../lib/classification/hybrid';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));

// Train default models
const nbModel = trainNaiveBayes(TRAINING_CORPUS, 1.0);
const tfidfModel = trainTfidf(TRAINING_CORPUS);
const charModel = trainCharNgram(TRAINING_CORPUS);

interface EntryScores {
  id: string;
  genre: string;
  pNB: Record<string, number>;
  pVSM: Record<string, number>;
  pChar: Record<string, number>;
  pRules: Record<string, number>;
}

// Compute component probabilities for each entry
const entryScoredList: EntryScores[] = entries.map((e: any) => {
  const text = [e.transcription, e.translation].filter(Boolean).join(' ');

  // NB
  const nbRes = predictNaiveBayes(text, 'ALL', nbModel);
  const pNB: Record<string, number> = {};
  for (const g of ACTIVE_GENRES) {
    pNB[g] = nbRes.allProbabilities.find(s => s.genre === g)?.probability || 0.25;
  }

  // TF-IDF
  const vsmRes = classifyWithVSM(text, 'ALL', tfidfModel);
  const rawVsm = ACTIVE_GENRES.map(g => vsmRes.allGenreScores.find(s => s.category === g)?.cosineSimilarity || 0);
  const pVsmArr = softmaxDistribution(rawVsm, 0.25);
  const pVSM: Record<string, number> = {};
  ACTIVE_GENRES.forEach((g, i) => { pVSM[g] = pVsmArr[i]; });

  // Char N-gram
  const charRes = classifyWithCharNgram(text, 'ALL', charModel);
  const rawChar = ACTIVE_GENRES.map(g => charRes.allGenreScores.find(s => s.genre === g)?.similarity || 0);
  const pCharArr = softmaxDistribution(rawChar, 0.25);
  const pChar: Record<string, number> = {};
  ACTIVE_GENRES.forEach((g, i) => { pChar[g] = pCharArr[i]; });

  // Rules (framework-only)
  const rawRule = ACTIVE_GENRES.map(g => {
    const r = genreRules.find(rule => rule.value === g);
    return r ? scoreRule(r, text, 'framework-only').confidence : 0;
  });
  const pRuleArr = softmaxDistribution(rawRule, 0.25);
  const pRules: Record<string, number> = {};
  ACTIVE_GENRES.forEach((g, i) => { pRules[g] = pRuleArr[i]; });

  return { id: e.id, genre: e.genre, pNB, pVSM, pChar, pRules };
});

let out = "=== STEP 6 ENSEMBLE SENSITIVITY ANALYSIS ===\n\n";

// -----------------------------------------------------------------------------------------
// PART 1: THRESHOLD & MARGIN SENSITIVITY (ON EQUAL-WEIGHT ENSEMBLE)
// -----------------------------------------------------------------------------------------
out += "=========================================================================================\n";
out += "PART 1: ABSTENTION SENSITIVITY TABLE (COVERAGE VS ACCURACY ON N=22 ARCHIVE RECORDS)\n";
out += "Default Fixed Constants chosen a priori: THRESHOLD = 0.35, MARGIN = 0.05\n";
out += "=========================================================================================\n";
out += "Threshold\tMargin\tClassified\tUnclassified\tCoverage\tAcc(Covered)\tAcc(Overall)\n";
out += "-----------------------------------------------------------------------------------------\n";

const thresholdMarginConfigs = [
  { t: 0.28, m: 0.02, label: 'Loose' },
  { t: 0.30, m: 0.03, label: 'Permissive' },
  { t: 0.35, m: 0.05, label: 'Default (Fixed)' },
  { t: 0.40, m: 0.08, label: 'Strict' },
  { t: 0.45, m: 0.10, label: 'Very Strict' }
];

for (const cfg of thresholdMarginConfigs) {
  let classifiedCount = 0;
  let correctCovered = 0;

  for (const item of entryScoredList) {
    const scores = ACTIVE_GENRES.map(g => ({
      genre: g,
      prob: (item.pNB[g] + item.pVSM[g] + item.pChar[g] + item.pRules[g]) / 4
    })).sort((a, b) => b.prob - a.prob);

    const p1 = scores[0].prob;
    const p2 = scores[1].prob;
    const margin = p1 - p2;

    const isUnclassified = p1 < cfg.t || margin < cfg.m;
    if (!isUnclassified) {
      classifiedCount++;
      if (scores[0].genre === item.genre) correctCovered++;
    }
  }

  const unclassifiedCount = entryScoredList.length - classifiedCount;
  const coverage = (classifiedCount / entryScoredList.length) * 100;
  const accCovered = classifiedCount > 0 ? (correctCovered / classifiedCount) * 100 : 0;
  const accOverall = (correctCovered / entryScoredList.length) * 100;

  const mark = cfg.label.includes('Default') ? ' *' : '';
  out += `${cfg.t.toFixed(2)}\t\t${cfg.m.toFixed(2)}\t${classifiedCount}\t\t${unclassifiedCount}\t\t${coverage.toFixed(1)}%\t\t${accCovered.toFixed(1)}%\t\t${accOverall.toFixed(1)}%${mark}\n`;
}
out += "\n* Denotes default fixed constants implemented in the production engine.\n";

// -----------------------------------------------------------------------------------------
// PART 2: WEIGHTING SENSITIVITY TABLE (SENSITIVITY ONLY, NOT TUNED)
// -----------------------------------------------------------------------------------------
out += "\n=========================================================================================\n";
out += "PART 2: WEIGHTING SENSITIVITY TABLE (SENSITIVITY ONLY, NOT TUNED)\n";
out += "Notice: Equal-weighting (0.25 each) is the default; no weights were tuned to fit the 22 entries.\n";
out += "=========================================================================================\n";
out += "Weighting Scheme               \tNB\tTF-IDF\tChar\tRules\tCoverage\tAcc(Covered)\tAcc(Overall)\n";
out += "-----------------------------------------------------------------------------------------\n";

const weightingConfigs = [
  { name: 'Equal-Weight (Default)        ', wNB: 0.25, wTF: 0.25, wChar: 0.25, wRule: 0.25 },
  { name: 'Interim Step 4 (40/25/20/15)  ', wNB: 0.40, wTF: 0.25, wChar: 0.20, wRule: 0.15 },
  { name: 'Subword-Heavy (20/20/40/20)   ', wNB: 0.20, wTF: 0.20, wChar: 0.40, wRule: 0.20 },
  { name: 'Lexical-Heavy (20/40/20/20)   ', wNB: 0.20, wTF: 0.40, wChar: 0.20, wRule: 0.20 },
  { name: 'Rules-Heavy (15/15/15/55)     ', wNB: 0.15, wTF: 0.15, wChar: 0.15, wRule: 0.55 },
  { name: 'Pure ML Ensemble (50/25/25/0) ', wNB: 0.50, wTF: 0.25, wChar: 0.25, wRule: 0.00 }
];

for (const w of weightingConfigs) {
  let classifiedCount = 0;
  let correctCovered = 0;

  for (const item of entryScoredList) {
    const scores = ACTIVE_GENRES.map(g => ({
      genre: g,
      prob: (w.wNB * item.pNB[g]) + (w.wTF * item.pVSM[g]) + (w.wChar * item.pChar[g]) + (w.wRule * item.pRules[g])
    })).sort((a, b) => b.prob - a.prob);

    const p1 = scores[0].prob;
    const p2 = scores[1].prob;
    const margin = p1 - p2;

    const isUnclassified = p1 < 0.35 || margin < 0.05;
    if (!isUnclassified) {
      classifiedCount++;
      if (scores[0].genre === item.genre) correctCovered++;
    }
  }

  const coverage = (classifiedCount / entryScoredList.length) * 100;
  const accCovered = classifiedCount > 0 ? (correctCovered / classifiedCount) * 100 : 0;
  const accOverall = (correctCovered / entryScoredList.length) * 100;

  out += `${w.name}\t${w.wNB.toFixed(2)}\t${w.wTF.toFixed(2)}\t${w.wChar.toFixed(2)}\t${w.wRule.toFixed(2)}\t${coverage.toFixed(1)}%\t\t${accCovered.toFixed(1)}%\t\t${accOverall.toFixed(1)}%\n`;
}

// -----------------------------------------------------------------------------------------
// PART 3: FUZZY MATCHING ARCHITECTURAL REPORT
// -----------------------------------------------------------------------------------------
out += "\n=========================================================================================\n";
out += "PART 3: FUZZY BONUS ARCHITECTURAL DECISION REPORT\n";
out += "=========================================================================================\n";
out += "- Evaluation: The previous implementation added an arbitrary scalar bonus (+0.15) to every\n";
out += "  genre whenever a generic 'GENRE' variant (e.g. 'tudtul') matched anywhere in the text.\n";
out += "- Architectural Choice: REMOVED additive fuzzy bonus from the genre ensemble combination.\n";
out += "- Academic Defense Rationale: Additive scalar bonuses disrupt the mathematical calibration\n";
out += "  of normalized probability distributions (sum = 1.0). In low-resource text classification,\n";
out += "  dialectal variations are already captured robustly by the character 3-5-gram subword model.\n";
out += "- Diagnostic Retention: Fuzzy orthographic matches remain active in algorithmicBreakdown.fuzzyMatches\n";
out += "  for transparency and cultural-linguistic inspection in the user interface.\n";

const lines = out.split('\n').length + 3;
const hash = crypto.createHash('sha256').update(out).digest('hex');
const finalOutput = `${out}\n--- FILE METRICS ---\nTotal Lines: ${lines}\nSHA-256: ${hash}\n`;

fs.writeFileSync('audit_scripts/out/step6-sensitivity.txt', finalOutput, 'utf8');
console.log(finalOutput);

process.exit(0);
