setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';

async function main() {
  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));

  console.log(`=== audit_scripts/entries.json (${entries.length} entries) ===`);
  const countsJson: Record<string, number> = {};
  for (const [i, e] of entries.entries()) {
    countsJson[e.genre] = (countsJson[e.genre] || 0) + 1;
    console.log(`[${i + 1}] ID: ${e.id} | Genre: ${e.genre.padEnd(8)} | Title: "${e.title}"`);
  }
  console.log('\nGenre counts in entries.json:', countsJson);

  // Parse seed.ts
  const seedPath = path.join(process.cwd(), 'prisma', 'seed.ts');
  const seedContent = fs.readFileSync(seedPath, 'utf8');
  const startIndex = seedContent.indexOf('const entries = [');
  const endIndex = seedContent.indexOf('async function main()');
  const snippet = seedContent.slice(startIndex, endIndex);
  const entriesCode = snippet.replace('const entries =', 'return');
  const seedEntries = new Function(entriesCode)();

  console.log(`\n=== prisma/seed.ts (${seedEntries.length} entries) ===`);
  const countsSeed: Record<string, number> = {};
  for (const [i, e] of seedEntries.entries()) {
    countsSeed[e.genre] = (countsSeed[e.genre] || 0) + 1;
    console.log(`[${i + 1}] Genre: ${e.genre.padEnd(8)} | Title: "${e.title}"`);
  }
  console.log('\nGenre counts in prisma/seed.ts:', countsSeed);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

