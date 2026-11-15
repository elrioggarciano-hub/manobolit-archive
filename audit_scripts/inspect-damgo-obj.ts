setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const damgo = entries.find((e: any) => e.title.includes('Damgo'));
console.log(damgo);
process.exit(0);
