setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';

async function main() {
  const entries = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'audit_scripts', 'entries.json'), 'utf8'));
  const overlap = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'audit_scripts', 'overlap.json'), 'utf8'));

  console.log(`entries.json count: ${entries.length}`);
  console.log(`overlap.json count: ${overlap.length}`);

  console.log('\n--- VERIFYING 22 ENTRIES IN BASELINE OVERLAP VS CURRENT ENTRIES.JSON ---');
  console.log('Idx\tBaseline Title\t\t\t\t\tCurrent Title\t\t\t\t\tGenre\t\tStatus');
  console.log('-----------------------------------------------------------------------------------------------------------------------------');

  for (let i = 0; i < Math.max(entries.length, overlap.length); i++) {
    const e = entries[i];
    const o = overlap[i];

    const oTitle = o ? o.title : 'NONE';
    const eTitle = e ? e.title : 'NONE';
    const genre = e ? e.genre : o?.genre;
    const same = o && e && o.title === e.title && o.genre === e.genre && o.entryId === e.id;

    console.log(`${i + 1}\t${oTitle.padEnd(45).slice(0, 45)}\t${eTitle.padEnd(45).slice(0, 45)}\t${genre.padEnd(12)}\t${same ? 'UNCHANGED' : 'CHANGED'}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

