import fs from 'fs';
import { getCleanClassificationInput } from '../lib/classification/textCleaning';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const raw = [entries[0].transcription, entries[0].translation].filter(Boolean).join(' ');
const clean = getCleanClassificationInput({ transcription: entries[0].transcription, translation: entries[0].translation });

console.log('Sample entry raw length:', raw.length);
console.log('Sample entry clean length:', clean.length);
console.log('Sample entry clean start:', clean.slice(0, 100));

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchTerm(text: string, term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(t)}(?![\\p{L}\\p{N}])`, 'iu');
  return pattern.test(text);
}

console.log('Testing "lawod":', matchTerm(clean, 'lawod'));
console.log('Testing "tribu":', matchTerm(clean, 'tribu'));
console.log('Testing "ocean":', matchTerm(clean, 'ocean'));

process.exit(0);
