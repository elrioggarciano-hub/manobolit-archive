setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
console.log('Entry 19 (index 18 or id ending in ymm):');
console.log('Index 18:', entries[18].title, entries[18].genre, 'Transcription:', entries[18].transcription, 'Translation:', entries[18].translation);
console.log('Index 19:', entries[19].title, entries[19].genre, 'Transcription:', entries[19].transcription, 'Translation:', entries[19].translation);
process.exit(0);
