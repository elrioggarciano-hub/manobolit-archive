setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { prisma } from '../lib/database/prisma';

async function main() {
  console.log('Connecting to Prisma database to fetch live entries...');
  let liveEntries: any[] = [];

  try {
    const dbPromise = prisma.literatureEntry.findMany({ orderBy: { createdAt: 'asc' } });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT_10S')), 10000));
    liveEntries = await Promise.race([dbPromise, timeoutPromise]) as any[];
    console.log(`Live DB returned ${liveEntries.length} entries.`);
  } catch (err: any) {
    console.error('Live DB query error:', err.message);
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }

  // Normalize parsed themes/culturalElements exactly like export-entries.ts
  const normalizedLive = liveEntries.map(e => ({
    ...e,
    themes: typeof e.themes === 'string' ? JSON.parse(e.themes) : e.themes,
    culturalElements: typeof e.culturalElements === 'string' ? JSON.parse(e.culturalElements) : e.culturalElements,
    exportSource: 'database',
  }));

  const liveCheckPath = path.join(process.cwd(), 'audit_scripts', 'live_entries_check.json');
  fs.writeFileSync(liveCheckPath, JSON.stringify(normalizedLive, null, 2), 'utf8');
  console.log(`Wrote live entries to ${liveCheckPath}`);

  // Compare with audit_scripts/entries.json
  const existingPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const existingEntries = JSON.parse(fs.readFileSync(existingPath, 'utf8'));

  console.log(`Existing entries.json count: ${existingEntries.length}`);
  console.log(`Live DB entries count      : ${normalizedLive.length}`);

  let matches = 0;
  let mismatches = 0;

  for (let i = 0; i < Math.max(existingEntries.length, normalizedLive.length); i++) {
    const ex = existingEntries[i];
    const lv = normalizedLive[i];

    if (!ex || !lv) {
      console.log(`Mismatch at index ${i}: ex=${ex?.id || 'MISSING'}, lv=${lv?.id || 'MISSING'}`);
      mismatches++;
      continue;
    }

    const exStr = JSON.stringify(ex);
    const lvStr = JSON.stringify(lv);

    if (exStr === lvStr) {
      matches++;
    } else {
      mismatches++;
      console.log(`Difference at index ${i} (ID: ${ex.id}):`);
      for (const key of Object.keys({ ...ex, ...lv })) {
        if (JSON.stringify(ex[key]) !== JSON.stringify(lv[key])) {
          console.log(`  Key "${key}": existing=${JSON.stringify(ex[key])} vs live=${JSON.stringify(lv[key])}`);
        }
      }
    }
  }

  console.log(`\nComparison Result: ${matches} identical, ${mismatches} differences.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

