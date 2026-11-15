import fs from 'fs';
import crypto from 'crypto';
import { ACTIVE_GENRES } from '../lib/classification/trainingCorpus';
import { classifyEntry } from '../lib/classification/engine';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));

interface MetricResult {
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  perClass: Record<string, { precision: number; recall: number; f1: number; support: number; tp: number; fp: number; fn: number }>;
  confusionMatrix: Record<string, Record<string, number>>;
  predictions: { id: string; title: string; actual: string; predicted: string; correct: boolean }[];
}

function evaluateRulesProfile(profile: 'framework-only' | 'full'): MetricResult {
  const classes = [...ACTIVE_GENRES];
  const stats: Record<string, { tp: number; fp: number; fn: number; support: number }> = {};
  const cm: Record<string, Record<string, number>> = {};

  for (const c of classes) {
    stats[c] = { tp: 0, fp: 0, fn: 0, support: 0 };
    cm[c] = {};
    for (const c2 of classes) {
      cm[c][c2] = 0;
    }
  }

  let correctCount = 0;
  const preds: { id: string; title: string; actual: string; predicted: string; correct: boolean }[] = [];

  for (const entry of entries) {
    const actual = entry.genre;
    if (stats[actual]) stats[actual].support++;

    // In LOOCV: entry i is classified in isolation with the specified profile
    const result = classifyEntry(entry, '', 'ALL', 'RULE_BASED', { rulesProfile: profile });
    const predicted = result.genre.value;

    const isCorrect = predicted === actual;
    if (isCorrect) correctCount++;

    preds.push({
      id: entry.id,
      title: entry.title,
      actual,
      predicted,
      correct: isCorrect
    });

    if (cm[actual] && cm[actual][predicted] !== undefined) {
      cm[actual][predicted]++;
    }

    if (isCorrect) {
      if (stats[actual]) stats[actual].tp++;
    } else {
      if (stats[predicted]) stats[predicted].fp++;
      if (stats[actual]) stats[actual].fn++;
    }
  }

  const perClass: Record<string, { precision: number; recall: number; f1: number; support: number; tp: number; fp: number; fn: number }> = {};
  let sumP = 0, sumR = 0, sumF1 = 0;

  for (const c of classes) {
    const s = stats[c];
    const p = s.tp + s.fp > 0 ? s.tp / (s.tp + s.fp) : 0;
    const r = s.tp + s.fn > 0 ? s.tp / (s.tp + s.fn) : 0;
    const f = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    perClass[c] = { precision: p, recall: r, f1: f, support: s.support, tp: s.tp, fp: s.fp, fn: s.fn };
    sumP += p;
    sumR += r;
    sumF1 += f;
  }

  return {
    accuracy: correctCount / entries.length,
    macroPrecision: sumP / classes.length,
    macroRecall: sumR / classes.length,
    macroF1: sumF1 / classes.length,
    perClass,
    confusionMatrix: cm,
    predictions: preds
  };
}

const frameworkRes = evaluateRulesProfile('framework-only');
const fullRes = evaluateRulesProfile('full');

let out = "=== STEP 5 CHECK 4: RULE-BASED LOOCV EVALUATION (BOTH PROFILES) ===\n\n";

out += `========================================================================================\n`;
out += `PROFILE 1: RULE_BASED (framework-only)\n`;
out += `Excludes: GENRE_NAME_TERMS (59) and CORPUS_TUNED_TERMS (85)\n`;
out += `Evaluates: Genuine Eugenio (1993) folkloric indicators on oral text only\n`;
out += `========================================================================================\n`;
out += `Overall Accuracy : ${(frameworkRes.accuracy * 100).toFixed(1)}% (${Math.round(frameworkRes.accuracy * entries.length)}/${entries.length})\n`;
out += `Macro Precision  : ${frameworkRes.macroPrecision.toFixed(3)}\n`;
out += `Macro Recall     : ${frameworkRes.macroRecall.toFixed(3)}\n`;
out += `Macro F1-Score   : ${frameworkRes.macroF1.toFixed(3)}\n\n`;

out += `Per-Class Breakdown:\n`;
out += `Genre    \tPrecision\tRecall\t\tF1-Score\tSupport\t(TP/FP/FN)\n`;
out += `----------------------------------------------------------------------------------------\n`;
for (const g of ACTIVE_GENRES) {
  const p = frameworkRes.perClass[g];
  out += `${g.padEnd(9)}\t${p.precision.toFixed(3)}\t\t${p.recall.toFixed(3)}\t\t${p.f1.toFixed(3)}\t\t${p.support}\t(${p.tp}/${p.fp}/${p.fn})\n`;
}

out += `\nConfusion Matrix (Rows: Actual, Cols: Predicted [RIDDLE, PROVERB, FOLKTALE, SONG]):\n`;
out += `ACTUAL \\ PREDICTED\tRIDDLE\tPROVERB\tFOLKTALE\tSONG\n`;
for (const actual of ACTIVE_GENRES) {
  const row = ACTIVE_GENRES.map(pred => frameworkRes.confusionMatrix[actual][pred] ?? 0);
  out += `${actual.padEnd(16)}\t${row.join('\t')}\n`;
}

out += `\n========================================================================================\n`;
out += `PROFILE 2: RULE_BASED (full, in-sample)\n`;
out += `Notice: IN-SAMPLE BY CONSTRUCTION (contains single-entry corpus-tuned keywords)\n`;
out += `========================================================================================\n`;
out += `Overall Accuracy : ${(fullRes.accuracy * 100).toFixed(1)}% (${Math.round(fullRes.accuracy * entries.length)}/${entries.length})\n`;
out += `Macro Precision  : ${fullRes.macroPrecision.toFixed(3)}\n`;
out += `Macro Recall     : ${fullRes.macroRecall.toFixed(3)}\n`;
out += `Macro F1-Score   : ${fullRes.macroF1.toFixed(3)}\n\n`;

out += `Per-Class Breakdown:\n`;
out += `Genre    \tPrecision\tRecall\t\tF1-Score\tSupport\t(TP/FP/FN)\n`;
out += `----------------------------------------------------------------------------------------\n`;
for (const g of ACTIVE_GENRES) {
  const p = fullRes.perClass[g];
  out += `${g.padEnd(9)}\t${p.precision.toFixed(3)}\t\t${p.recall.toFixed(3)}\t\t${p.f1.toFixed(3)}\t\t${p.support}\t(${p.tp}/${p.fp}/${p.fn})\n`;
}

out += `\nConfusion Matrix (Rows: Actual, Cols: Predicted [RIDDLE, PROVERB, FOLKTALE, SONG]):\n`;
out += `ACTUAL \\ PREDICTED\tRIDDLE\tPROVERB\tFOLKTALE\tSONG\n`;
for (const actual of ACTIVE_GENRES) {
  const row = ACTIVE_GENRES.map(pred => fullRes.confusionMatrix[actual][pred] ?? 0);
  out += `${actual.padEnd(16)}\t${row.join('\t')}\n`;
}

out += `\n========================================================================================\n`;
out += `SIDE-BY-SIDE PROFILE COMPARISON ACROSS N=22 ENTRIES\n`;
out += `========================================================================================\n`;
out += `ID            \tActual  \tframework-only\tfull (in-sample)\tTitle\n`;
out += `----------------------------------------------------------------------------------------\n`;
for (let i = 0; i < entries.length; i++) {
  const fPred = frameworkRes.predictions[i];
  const fullPred = fullRes.predictions[i];
  const markF = fPred.correct ? '✓' : '✗';
  const markFull = fullPred.correct ? '✓' : '✗';
  out += `[${entries[i].id.slice(0, 12)}]\t${entries[i].genre.padEnd(8)}\t${fPred.predicted.padEnd(8)} ${markF}\t${fullPred.predicted.padEnd(8)} ${markFull}\t"${entries[i].title.slice(0, 30)}"\n`;
}

out += `\nSummary of honest findings:\n`;
out += `- Under 'framework-only', rule-based accuracy is ${(frameworkRes.accuracy * 100).toFixed(1)}% (Macro F1 = ${frameworkRes.macroF1.toFixed(3)}).\n`;
out += `- Under 'full' (in-sample), rule-based accuracy is ${(fullRes.accuracy * 100).toFixed(1)}% (Macro F1 = ${fullRes.macroF1.toFixed(3)}).\n`;
out += `- The difference reflects the exact degree to which the original rules relied on corpus-tuned lexical cheats.\n`;

const lines = out.split('\n').length + 3;
const hash = crypto.createHash('sha256').update(out).digest('hex');
const finalOutput = `${out}\n--- FILE METRICS ---\nTotal Lines: ${lines}\nSHA-256: ${hash}\n`;

fs.writeFileSync('audit_scripts/out/step5-rules-loocv.txt', finalOutput, 'utf8');
console.log(finalOutput);

process.exit(0);
