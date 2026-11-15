import fs from 'fs';
import { ACTIVE_GENRES, TRAINING_CORPUS } from '../lib/classification/trainingCorpus';
import { trainNaiveBayes, predictNaiveBayes } from '../lib/classification/naiveBayes';
import { trainTfidf, classifyWithVSM } from '../lib/classification/tfidf';
import { trainCharNgram, classifyWithCharNgram } from '../lib/classification/charNgram';
import { genreRules, RULES_PROFILE } from '../lib/classification/rules';
import { scoreRule } from '../lib/classification/hybrid';
import { cleanClassificationText } from '../lib/classification/textCleaning';
import { tokenizeUnigrams, generateWordBigrams } from '../lib/classification/tokenizer';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));

// Train default models
const nbModel = trainNaiveBayes(TRAINING_CORPUS, 1.0);
const tfidfModel = trainTfidf(TRAINING_CORPUS);
const charModel = trainCharNgram(TRAINING_CORPUS);

function softmax(scores: number[], temperature: number): number[] {
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp((s - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / (sum || 1));
}

function getLengthNormNB(text: string): Record<string, number> {
  const clean = cleanClassificationText(text);
  const unigrams = tokenizeUnigrams(clean, true);
  const bigrams = generateWordBigrams(unigrams);
  const tokens = [...unigrams, ...bigrams];
  const tokenCount = Math.max(1, tokens.length);

  const logProbs: Record<string, number> = {};
  for (const c of ACTIVE_GENRES) {
    let lp = nbModel.priors[c] || Math.log(1 / ACTIVE_GENRES.length);
    const totalWords = nbModel.totalWordsPerClass[c] || 0;
    const denom = totalWords + nbModel.alpha * nbModel.vocabularySize;
    for (const t of tokens) {
      if (nbModel.vocabulary.has(t)) {
        const count = nbModel.wordCountsPerClass[c]?.[t] || 0;
        lp += Math.log((count + nbModel.alpha) / denom);
      }
    }
    // Length normalization
    logProbs[c] = lp / tokenCount;
  }

  const scores = ACTIVE_GENRES.map(g => logProbs[g]);
  const probs = softmax(scores, 1.0);
  const res: Record<string, number> = {};
  ACTIVE_GENRES.forEach((g, i) => { res[g] = probs[i]; });
  return res;
}

function getTfidfDist(text: string, T: number = 0.25): Record<string, number> {
  const vsm = classifyWithVSM(text, 'ALL', tfidfModel);
  const scores = ACTIVE_GENRES.map(g => {
    const m = vsm.allGenreScores.find(s => s.category === g);
    return m ? m.cosineSimilarity : 0;
  });
  const probs = softmax(scores, T);
  const res: Record<string, number> = {};
  ACTIVE_GENRES.forEach((g, i) => { res[g] = probs[i]; });
  return res;
}

function getCharDist(text: string, T: number = 0.25): Record<string, number> {
  const cm = classifyWithCharNgram(text, 'ALL', charModel);
  const scores = ACTIVE_GENRES.map(g => {
    const m = cm.allGenreScores.find(s => s.genre === g);
    return m ? m.similarity : 0;
  });
  const probs = softmax(scores, T);
  const res: Record<string, number> = {};
  ACTIVE_GENRES.forEach((g, i) => { res[g] = probs[i]; });
  return res;
}

function getRulesDist(text: string, T: number = 0.25): Record<string, number> {
  const scores = ACTIVE_GENRES.map(g => {
    const r = genreRules.find(rule => rule.value === g);
    if (!r) return 0;
    const d = scoreRule(r, text, 'framework-only');
    return d.confidence;
  });
  const probs = softmax(scores, T);
  const res: Record<string, number> = {};
  ACTIVE_GENRES.forEach((g, i) => { res[g] = probs[i]; });
  return res;
}

console.log("=== TESTING CALIBRATED PROBABILITIES ON SAMPLE 1 ===");
const sample = entries[0];
const sampleText = [sample.transcription, sample.translation].filter(Boolean).join(' ');
console.log(`Title: "${sample.title}" | Actual: ${sample.genre}`);
const nbP = getLengthNormNB(sampleText);
const tfP = getTfidfDist(sampleText);
const chP = getCharDist(sampleText);
const rlP = getRulesDist(sampleText);

console.log("\nNB distribution       :", nbP);
console.log("TF-IDF distribution   :", tfP);
console.log("CharNgram distribution:", chP);
console.log("Rules distribution    :", rlP);

const ensembleP: Record<string, number> = {};
for (const g of ACTIVE_GENRES) {
  ensembleP[g] = (nbP[g] + tfP[g] + chP[g] + rlP[g]) / 4;
}
console.log("\nEqual-Weight Ensemble :", ensembleP);

process.exit(0);
