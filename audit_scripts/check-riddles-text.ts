import fs from 'fs';
import { getCleanClassificationInput } from '../lib/classification/textCleaning';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
for (const e of entries) {
  const clean = getCleanClassificationInput(e);
  if (e.genre === 'RIDDLE') {
    console.log(`\nRiddle: "${e.title}"`);
    console.log(`Transcription: "${e.transcription}"`);
    console.log(`Translation: "${e.translation}"`);
    console.log(`Cleaned: "${clean}"`);
  }
}

process.exit(0);
