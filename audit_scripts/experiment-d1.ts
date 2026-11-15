setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import { computeComparativeMetrics, ScorableEntry } from '../lib/classification/metrics';

async function main() {
  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const rawEntries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));

  const scorable: ScorableEntry[] = rawEntries.map((e: any) => ({
    title: e.title,
    content: e.content,
    transcription: e.transcription,
    translation: e.translation,
    genre: e.genre,
  }));

  console.log(`Loaded ${scorable.length} entries for D1 Baseline evaluation.\n`);

  const report = computeComparativeMetrics(scorable);

  console.log('=== D1 BASELINE COMPARATIVE METRICS (AS-IS) ===');
  console.log('Mode\t\tAccuracy\tMacro Precision\tMacro Recall\tMacro F1\tSample Size');
  console.log('-----------------------------------------------------------------------------------------');
  
  const modes: Array<{ name: string; key: keyof typeof report }> = [
    { name: 'RULE_BASED', key: 'ruleBased' },
    { name: 'TF_IDF_VSM', key: 'tfidfVsm' },
    { name: 'NAIVE_BAYES_ML', key: 'naiveBayes' },
    { name: 'CHAR_NGRAM', key: 'charNgram' },
    { name: 'HYBRID_ENSEMBLE', key: 'hybridEnsemble' },
  ];

  for (const m of modes) {
    const data = report[m.key] as any;
    console.log(`${m.name.padEnd(16)}\t${data.accuracy.toFixed(3)}\t\t${data.precision.toFixed(3)}\t\t${data.recall.toFixed(3)}\t\t${data.f1.toFixed(3)}\t\t${data.sampleSize}`);
  }

  console.log(`\nWinner: ${report.winner}`);
  console.log('\n=== GENERATED ACADEMIC DEFENSE SUMMARY ===');
  console.log(report.academicDefenseSummary);

  process.exit(0);
}

main().catch(err => {
  console.error('D1 error:', err);
  process.exit(1);
});

