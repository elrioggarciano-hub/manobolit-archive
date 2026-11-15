setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';
const entries = JSON.parse(fs.readFileSync('audit_scripts/entries.json', 'utf8'));
const matching = entries.filter((e: any) => e.title.includes('Damgo'));
console.log('Matching entries count:', matching.length);
matching.forEach((e: any, idx: number) => {
  console.log(`[${idx}]`, e.id, e.title, e.genre);
});
process.exit(0);
