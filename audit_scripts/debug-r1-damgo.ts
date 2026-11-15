setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
import { classifyEntry } from '../lib/classification/engine';

const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const damgo = entries.find((e: any) => e.title.includes('Damgo'));

const r1 = classifyEntry(damgo, '', 'ALL', 'RULE_BASED', { rulesProfile: 'framework-only' });
console.log('r1 breakdown:', JSON.stringify(r1, null, 2));

process.exit(0);
