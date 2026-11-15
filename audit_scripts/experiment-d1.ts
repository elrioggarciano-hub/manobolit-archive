setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { computeComparativeMetrics, ScorableEntry } from '../lib/classification/metrics';

async function main() {
  const lines: string[] = [];
  const log = (str: string) => lines.push(str);

  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const rawEntries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));

  const scorable: ScorableEntry[] = rawEntries.map((e: any) => ({
    title: e.title,
    content: e.content,
    transcription: e.transcription,
    translation: e.translation,
    genre: e.genre,
  }));

  log(`Loaded ${scorable.length} entries for D1 evaluation (Policy: transcription + translation ONLY).\n`);

  const report = computeComparativeMetrics(scorable);

  log('=== D1 BASELINE COMPARATIVE METRICS (AS-IS, POST-STEP 4) ===');
  log('Mode            \tAccuracy\tMacro Precision\tMacro Recall\tMacro F1\tSample Size');
  log('-----------------------------------------------------------------------------------------');

  const modes: Array<{ name: string; key: keyof typeof report }> = [
    { name: 'RULE_BASED', key: 'ruleBased' },
    { name: 'TF_IDF_VSM', key: 'tfidfVsm' },
    { name: 'NAIVE_BAYES_ML', key: 'naiveBayes' },
    { name: 'CHAR_NGRAM', key: 'charNgram' },
    { name: 'HYBRID_ENSEMBLE', key: 'hybridEnsemble' },
  ];

  for (const m of modes) {
    const data = report[m.key] as any;
    log(`${m.name.padEnd(16)}\t${data.accuracy.toFixed(3)}\t\t${data.precision.toFixed(3)}\t\t${data.recall.toFixed(3)}\t\t${data.f1.toFixed(3)}\t\t${data.sampleSize}`);
  }

  log(`\nWinner: ${report.winner}`);
  log('\n=== GENERATED ACADEMIC DEFENSE SUMMARY ===');
  log(report.academicDefenseSummary);

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length;
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `\n--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  const outFile = path.join(process.cwd(), 'audit_scripts', 'out', 'step4-d1.txt');
  fs.writeFileSync(outFile, finalContent, 'utf8');

  console.log(finalContent);
  process.exit(0);
}

main().catch(err => {
  console.error('D1 error:', err);
  process.exit(1);
});
