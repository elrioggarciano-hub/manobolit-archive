setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import { TRAINING_CORPUS, TrainingDocument } from '../lib/classification/trainingCorpus';
import { trainNaiveBayes, predictNaiveBayes, NaiveBayesModel } from '../lib/classification/naiveBayes';
import { classifyWithVSM } from '../lib/classification/tfidf';
import { classifyWithNeuralSemantic } from '../lib/classification/neuralSemantic';
import { findOrthographicDialectMatches } from '../lib/classification/fuzzy';
import { genreRules, themeRules, locationRules, ClassificationRule } from '../lib/classification/rules';
import { tokenizeUnigrams, normalizeText as baseNormalize } from '../lib/classification/tokenizer';
import { RuleDetail, MatchedTerm } from '../lib/classification/engine';

interface Scorable {
  id: string;
  title: string;
  manoboTitle?: string | null;
  englishTitle?: string | null;
  content: string;
  transcription?: string | null;
  translation?: string | null;
  genre: string;
}

// Rule scoring function identical to hybrid.ts
function scoreRule(rule: ClassificationRule, normalizedText: string): RuleDetail {
  let score = 0;
  let matchCount = 0;
  const matched: MatchedTerm[] = [];

  for (const keyword of rule.keywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      score += 1;
      matchCount++;
      matched.push({ term: keyword, type: 'keyword' });
    }
  }

  for (const phrase of rule.phrases) {
    if (normalizedText.includes(phrase.toLowerCase())) {
      score += 2;
      matchCount++;
      matched.push({ term: phrase, type: 'phrase' });
    }
  }

  for (const clue of rule.contextClues) {
    if (normalizedText.includes(clue.toLowerCase())) {
      score += 1.5;
      matchCount++;
      matched.push({ term: clue, type: 'context' });
    }
  }

  if (matchCount === 0) return { confidence: 0, matched: [] };

  const targetSaturation = 2.5;
  const rawRatio = Math.min(score / targetSaturation, 1.0);
  const scaled = rawRatio * rule.baseConfidence;

  return { confidence: Math.round(scaled * 100) / 100, matched };
}

// Fold-aware hybrid classifier
function classifyFoldHybrid(
  text: string,
  nbModel: NaiveBayesModel,
  mode: 'HYBRID_ENSEMBLE' | 'NAIVE_BAYES_ML' | 'TF_IDF_VSM' | 'NEURAL_SEMANTIC' | 'RULE_BASED'
): { predictedGenre: string; confidence: number } {
  const normText = text.toLowerCase();
  const unigrams = tokenizeUnigrams(normText, false);

  const nbResult = predictNaiveBayes(normText, 'ALL', nbModel);
  if (mode === 'NAIVE_BAYES_ML') {
    return { predictedGenre: nbResult.predictedGenre, confidence: nbResult.posteriorProbability };
  }

  const vsmResult = classifyWithVSM(normText, 'ALL');
  if (mode === 'TF_IDF_VSM') {
    return { predictedGenre: vsmResult.topGenre, confidence: vsmResult.topGenreSimilarity };
  }

  const neuralResult = classifyWithNeuralSemantic(normText, 'ALL');
  if (mode === 'NEURAL_SEMANTIC') {
    return { predictedGenre: neuralResult.predictedGenre, confidence: neuralResult.neuralConfidence };
  }

  // Rule-based
  const genreScoresRule: { genre: string; confidence: number }[] = [];
  for (const rule of genreRules) {
    const detail = scoreRule(rule, normText);
    if (detail.confidence > 0) {
      genreScoresRule.push({ genre: rule.value, confidence: detail.confidence });
    }
  }
  genreScoresRule.sort((a, b) => b.confidence - a.confidence);

  if (mode === 'RULE_BASED') {
    const top = genreScoresRule[0] || { genre: 'MYTH', confidence: 0 };
    return { predictedGenre: top.genre, confidence: top.confidence };
  }

  // HYBRID_ENSEMBLE
  const fuzzyMatches = findOrthographicDialectMatches(unigrams, 0.78);
  const fuzzyScore = fuzzyMatches.length > 0
    ? Math.min(1.0, fuzzyMatches.reduce((acc, m) => acc + m.similarity * 0.35, 0))
    : 0.0;
  const genreFuzzyBonus = fuzzyMatches.some(f => f.category === 'GENRE') ? fuzzyScore * 0.15 : 0;

  const allGenres = Array.from(new Set(genreRules.map(r => r.value)));
  const finalGenreScores: { genre: string; confidence: number }[] = [];

  for (const genre of allGenres) {
    const ruleMatch = genreScoresRule.find(s => s.genre === genre);
    const ruleConf = ruleMatch ? ruleMatch.confidence : 0;

    const vsmMatch = vsmResult.allGenreScores.find(s => s.category === genre);
    const vsmSim = vsmMatch ? vsmMatch.cosineSimilarity : 0;

    const nbMatch = nbResult.allProbabilities.find(s => s.genre === genre);
    const nbProb = nbMatch ? nbMatch.probability : 0;

    const neuralMatch = neuralResult.allGenreScores.find(s => s.genre === genre);
    const neuralSim = neuralMatch ? neuralMatch.similarity : 0;

    let combined = (0.40 * nbProb) + (0.25 * vsmSim) + (0.20 * neuralSim) + (0.15 * ruleConf) + genreFuzzyBonus;
    combined = Math.min(1.0, combined);

    finalGenreScores.push({ genre, confidence: Math.round(combined * 100) / 100 });
  }

  finalGenreScores.sort((a, b) => b.confidence - a.confidence);
  const top = finalGenreScores[0] || { genre: 'MYTH', confidence: 0 };
  return { predictedGenre: top.genre, confidence: top.confidence };
}

function calculateMetrics(actuals: string[], predictions: string[], allClasses: string[]) {
  const presentClasses = Array.from(new Set([...actuals, ...predictions])).sort();
  const stats: Record<string, { tp: number; fp: number; fn: number; support: number }> = {};
  
  for (const c of presentClasses) {
    stats[c] = { tp: 0, fp: 0, fn: 0, support: 0 };
  }

  let correct = 0;
  for (let i = 0; i < actuals.length; i++) {
    const act = actuals[i];
    const pred = predictions[i];
    stats[act].support++;
    if (act === pred) {
      correct++;
      stats[act].tp++;
    } else {
      stats[pred].fp++;
      stats[act].fn++;
    }
  }

  const perClass = presentClasses.map(c => {
    const { tp, fp, fn, support } = stats[c];
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    return { class: c, precision, recall, f1, support };
  });

  const accuracy = correct / actuals.length;
  // Macro average over classes that actually appear in ground truth
  const groundTruthClasses = perClass.filter(p => p.support > 0);
  const macroP = groundTruthClasses.reduce((sum, p) => sum + p.precision, 0) / groundTruthClasses.length;
  const macroR = groundTruthClasses.reduce((sum, p) => sum + p.recall, 0) / groundTruthClasses.length;
  const macroF1 = groundTruthClasses.reduce((sum, p) => sum + p.f1, 0) / groundTruthClasses.length;

  // Build confusion matrix
  const matrix: Record<string, Record<string, number>> = {};
  for (const act of presentClasses) {
    matrix[act] = {};
    for (const pred of presentClasses) {
      matrix[act][pred] = 0;
    }
  }
  for (let i = 0; i < actuals.length; i++) {
    matrix[actuals[i]][predictions[i]]++;
  }

  return { accuracy, macroP, macroR, macroF1, perClass, matrix, presentClasses };
}

async function main() {
  const entries: Scorable[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'audit_scripts', 'entries.json'), 'utf8'));
  const overlapData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'audit_scripts', 'overlap.json'), 'utf8'));

  // Create lookup of overlapping doc IDs to exclude per entry
  const overlapExclusions = new Map<string, string[]>();
  for (const o of overlapData) {
    if (o.overlaps) {
      overlapExclusions.set(o.entryId, [o.matchingTrainingId]);
    }
  }

  console.log('=== D2 LEAVE-ONE-OUT CROSS-VALIDATION (LOOCV) ===');
  console.log(`Evaluating N=${entries.length} entries with fold-specific training corpora (leakage excluded).\n`);

  const modes: Array<'RULE_BASED' | 'TF_IDF_VSM' | 'NAIVE_BAYES_ML' | 'NEURAL_SEMANTIC' | 'HYBRID_ENSEMBLE'> = [
    'RULE_BASED',
    'TF_IDF_VSM',
    'NAIVE_BAYES_ML',
    'NEURAL_SEMANTIC',
    'HYBRID_ENSEMBLE',
  ];

  const actuals = entries.map(e => e.genre);
  const allClasses = Array.from(new Set(genreRules.map(r => r.value)));

  const modePredictions: Record<string, string[]> = {
    RULE_BASED: [],
    TF_IDF_VSM: [],
    NAIVE_BAYES_ML: [],
    NEURAL_SEMANTIC: [],
    HYBRID_ENSEMBLE: [],
  };

  for (let i = 0; i < entries.length; i++) {
    const testEntry = entries[i];
    const excludedDocIds = new Set<string>(overlapExclusions.get(testEntry.id) || []);

    // Train fold-specific NB model without overlapping docs
    const foldTrainingCorpus = TRAINING_CORPUS.filter(doc => !excludedDocIds.has(doc.id));
    const foldNbModel = trainNaiveBayes(foldTrainingCorpus, 1.0);

    const fullText = [
      testEntry.title,
      testEntry.englishTitle,
      testEntry.manoboTitle,
      testEntry.content,
      testEntry.transcription,
      testEntry.translation,
    ].filter(Boolean).join(' ');

    for (const m of modes) {
      const res = classifyFoldHybrid(fullText, foldNbModel, m);
      modePredictions[m].push(res.predictedGenre);
    }
  }

  console.log('=== D2 OVERALL LOOCV METRICS SUMMARY ===');
  console.log('Mode\t\t\tAccuracy\tMacro Precision\tMacro Recall\tMacro F1');
  console.log('-----------------------------------------------------------------------------------------');

  for (const m of modes) {
    const res = calculateMetrics(actuals, modePredictions[m], allClasses);
    console.log(`${m.padEnd(20)}\t${res.accuracy.toFixed(3)}\t\t${res.macroP.toFixed(3)}\t\t${res.macroR.toFixed(3)}\t\t${res.macroF1.toFixed(3)}`);
  }

  console.log('\n=== D2 DETAILED PER-CLASS BREAKDOWN & CONFUSION MATRICES ===\n');

  for (const m of modes) {
    const res = calculateMetrics(actuals, modePredictions[m], allClasses);
    console.log(`--- MODE: ${m} ---`);
    console.log(`Accuracy: ${(res.accuracy * 100).toFixed(1)}% | Macro P: ${res.macroP.toFixed(3)} | Macro R: ${res.macroR.toFixed(3)} | Macro F1: ${res.macroF1.toFixed(3)}`);
    console.log('\nPer-class Metrics:');
    console.log('Class\t\tPrecision\tRecall\t\tF1\t\tSupport');
    for (const p of res.perClass) {
      console.log(`${p.class.padEnd(12)}\t${p.precision.toFixed(3)}\t\t${p.recall.toFixed(3)}\t\t${p.f1.toFixed(3)}\t\t${p.support}`);
    }

    console.log('\nConfusion Matrix (Rows = Actual, Columns = Predicted):');
    const cols = res.presentClasses;
    console.log('Actual \\ Pred\t' + cols.map(c => c.slice(0, 8).padEnd(8)).join('\t'));
    for (const act of cols) {
      const row = cols.map(pred => String(res.matrix[act][pred]).padEnd(8)).join('\t');
      console.log(`${act.slice(0, 12).padEnd(12)}\t${row}`);
    }
    console.log('\n------------------------------------------------------------\n');
  }

  // ==========================================
  // D3 ABLATIONS (LOOCV, NB mode and HYBRID mode)
  // (a) Manobo text only (transcription)
  // (b) English translation only (translation)
  // (c) Both (transcription + translation)
  // (d) With title vs without title
  // ==========================================

  console.log('=== D3 ABLATION EXPERIMENTS (LOOCV) ===\n');

  interface AblationVariant {
    name: string;
    getText: (e: Scorable) => string;
  }

  const ablationVariants: AblationVariant[] = [
    {
      name: 'a) Manobo text only',
      getText: (e) => e.transcription || '',
    },
    {
      name: 'b) English translation only',
      getText: (e) => [e.translation, e.content].filter(Boolean).join(' '),
    },
    {
      name: 'c) Both (Manobo + English, no title)',
      getText: (e) => [e.transcription, e.translation, e.content].filter(Boolean).join(' '),
    },
    {
      name: 'd1) With Title (Title + Manobo + English)',
      getText: (e) => [e.title, e.englishTitle, e.manoboTitle, e.transcription, e.translation, e.content].filter(Boolean).join(' '),
    },
    {
      name: 'd2) Without Title (Manobo + English only)',
      getText: (e) => [e.transcription, e.translation, e.content].filter(Boolean).join(' '),
    },
  ];

  console.log('Ablation Condition\t\t\t\tNB Accuracy\tNB Macro F1\tHybrid Acc\tHybrid Macro F1');
  console.log('----------------------------------------------------------------------------------------------------------------');

  for (const v of ablationVariants) {
    const nbPreds: string[] = [];
    const hybridPreds: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const testEntry = entries[i];
      const excludedDocIds = new Set<string>(overlapExclusions.get(testEntry.id) || []);
      const foldTrainingCorpus = TRAINING_CORPUS.filter(doc => !excludedDocIds.has(doc.id));
      const foldNbModel = trainNaiveBayes(foldTrainingCorpus, 1.0);

      const text = v.getText(testEntry);

      const nbRes = classifyFoldHybrid(text, foldNbModel, 'NAIVE_BAYES_ML');
      const hybridRes = classifyFoldHybrid(text, foldNbModel, 'HYBRID_ENSEMBLE');

      nbPreds.push(nbRes.predictedGenre);
      hybridPreds.push(hybridRes.predictedGenre);
    }

    const nbMetrics = calculateMetrics(actuals, nbPreds, allClasses);
    const hybridMetrics = calculateMetrics(actuals, hybridPreds, allClasses);

    console.log(`${v.name.padEnd(40)}\t${nbMetrics.accuracy.toFixed(3)}\t\t${nbMetrics.macroF1.toFixed(3)}\t\t${hybridMetrics.accuracy.toFixed(3)}\t\t${hybridMetrics.macroF1.toFixed(3)}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('D2/D3 error:', err);
  process.exit(1);
});

