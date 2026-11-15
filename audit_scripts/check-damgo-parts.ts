setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
import { cleanClassificationText } from '../lib/classification/textCleaning';

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const damgo = entries.find((e: any) => e.title.includes('Damgo'));

const parts = [damgo.transcription, damgo.translation].filter(Boolean).join(' ');
console.log('parts:', parts);
console.log('cleanClassificationText(parts):', cleanClassificationText(parts));
process.exit(0);
