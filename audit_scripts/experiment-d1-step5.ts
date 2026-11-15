import fs from 'fs';
import crypto from 'crypto';
import { computeComparativeMetrics } from '../lib/classification/metrics';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));

// Under default honest rulesProfile ('framework-only')
const report = computeComparativeMetrics(entries, { rulesProfile: 'framework-only' });

let out = `=== D1 COMPARATIVE METRICS (POST-STEP 5 RULES FIXES, FRAMEWORK-ONLY) ===\n`;
out += `Mode            \tAccuracy\tMacro Precision\tMacro Recall\tMacro F1\tSample Size\n`;
out += `-----------------------------------------------------------------------------------------\n`;
out += `RULE_BASED      \t${report.ruleBased.accuracy.toFixed(3)}\t\t${report.ruleBased.precision.toFixed(3)}\t\t${report.ruleBased.recall.toFixed(3)}\t\t${report.ruleBased.f1.toFixed(3)}\t\t${report.ruleBased.sampleSize}\n`;
out += `TF_IDF_VSM      \t${report.tfidfVsm.accuracy.toFixed(3)}\t\t${report.tfidfVsm.precision.toFixed(3)}\t\t${report.tfidfVsm.recall.toFixed(3)}\t\t${report.tfidfVsm.f1.toFixed(3)}\t\t${report.tfidfVsm.sampleSize}\n`;
out += `NAIVE_BAYES_ML  \t${report.naiveBayes.accuracy.toFixed(3)}\t\t${report.naiveBayes.precision.toFixed(3)}\t\t${report.naiveBayes.recall.toFixed(3)}\t\t${report.naiveBayes.f1.toFixed(3)}\t\t${report.naiveBayes.sampleSize}\n`;
out += `CHAR_NGRAM      \t${report.charNgram.accuracy.toFixed(3)}\t\t${report.charNgram.precision.toFixed(3)}\t\t${report.charNgram.recall.toFixed(3)}\t\t${report.charNgram.f1.toFixed(3)}\t\t${report.charNgram.sampleSize}\n`;
out += `HYBRID_ENSEMBLE \t${report.hybridEnsemble.accuracy.toFixed(3)}\t\t${report.hybridEnsemble.precision.toFixed(3)}\t\t${report.hybridEnsemble.recall.toFixed(3)}\t\t${report.hybridEnsemble.f1.toFixed(3)}\t\t${report.hybridEnsemble.sampleSize}\n\n`;
out += `Winner: ${report.winner}\n\n`;
out += `=== GENERATED ACADEMIC DEFENSE SUMMARY ===\n`;
out += `${report.academicDefenseSummary}\n`;

const lines = out.split('\n').length + 3;
const hash = crypto.createHash('sha256').update(out).digest('hex');
const finalOutput = `${out}\n--- FILE METRICS ---\nTotal Lines: ${lines}\nSHA-256: ${hash}\n`;

fs.writeFileSync('audit_scripts/out/step5-d1.txt', finalOutput, 'utf8');
console.log(finalOutput);

process.exit(0);
