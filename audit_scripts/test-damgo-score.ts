setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
import { cleanClassificationText } from '../lib/classification/textCleaning';
import { genreRules } from '../lib/classification/rules';
import { scoreRule } from '../lib/classification/hybrid';

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const damgo = entries.find((e: any) => e.title.includes('Damgo'));

const text = cleanClassificationText([damgo.transcription, damgo.translation].filter(Boolean).join(' '));
console.log('text:', text);

const g005 = genreRules.find(r => r.id === 'G005')!;
const res = scoreRule(g005, text.toLowerCase(), 'framework-only');
console.log('G005 match:', JSON.stringify(res));

const g003 = genreRules.find(r => r.id === 'G003')!;
const resG003 = scoreRule(g003, text.toLowerCase(), 'framework-only');
console.log('G003 match:', JSON.stringify(resG003));

process.exit(0);
