setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { prisma } from '../lib/database/prisma';

async function main() {
  console.log('Attempting to export entries from Prisma database...');
  let source = 'database';
  let entries: any[] = [];

  try {
    const dbPromise = prisma.literatureEntry.findMany({ orderBy: { createdAt: 'asc' } });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_QUERY_TIMEOUT')), 10000));
    entries = await Promise.race([dbPromise, timeoutPromise]) as any[];
    console.log(`Successfully fetched ${entries.length} entries from Prisma database.`);
  } catch (err: any) {
    console.warn('Prisma DB query failed or timed out:', err.message);
    console.log('Falling back to extracting entries from prisma/seed.ts...');
    source = 'seed_file';

    const seedPath = path.join(process.cwd(), 'prisma', 'seed.ts');
    const seedContent = fs.readFileSync(seedPath, 'utf8');

    // Extract entries array from prisma/seed.ts
    const startIndex = seedContent.indexOf('const entries = [');
    const endIndex = seedContent.indexOf('async function main()');
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not locate entries array in seed.ts');
    }
    const snippet = seedContent.slice(startIndex, endIndex);
    // Use Function constructor or simple eval in isolated scope to parse the literal array
    const entriesCode = snippet.replace('const entries =', 'return');
    const parsedEntries = new Function(entriesCode)();
    entries = parsedEntries.map((e: any, index: number) => ({
      id: `seed-${index + 1}`,
      ...e,
    }));
    console.log(`Successfully parsed ${entries.length} entries from prisma/seed.ts.`);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }

  // Normalize parsed themes/culturalElements if stored as JSON string
  const normalized = entries.map(e => ({
    ...e,
    themes: typeof e.themes === 'string' ? JSON.parse(e.themes) : e.themes,
    culturalElements: typeof e.culturalElements === 'string' ? JSON.parse(e.culturalElements) : e.culturalElements,
    exportSource: source,
  }));

  const outPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2), 'utf8');
  console.log(`Wrote ${normalized.length} entries to ${outPath} (source: ${source}).`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal export error:', err);
  process.exit(1);
});

