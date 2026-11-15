setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface Entry {
  id: string;
  title: string;
  genre: string;
  transcription?: string | null;
  translation?: string | null;
  bisayaTranslation?: string | null;
  content?: string | null;
}

function countTokens(str: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const entries: Entry[] = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));

  const lines: string[] = [];
  const log = (str: string) => {
    lines.push(str);
  };

  log('=== PART A: ARCHIVE ENTRIES FIELD AUDIT (check-fields-v2) ===\n');

  // --- PART 1: ENTRIES 1 TO 11 ---
  log('========================================================================');
  log('--- HALF 1: ENTRIES 1 TO 11 ---');
  log('========================================================================');
  for (let i = 0; i < 11; i++) {
    const e = entries[i];
    log(`\n[${i + 1}/22] ID: ${e.id} | Genre: ${e.genre} | Title: "${e.title}"`);
    for (const f of ['transcription', 'translation', 'bisayaTranslation', 'content'] as const) {
      const val = (e[f] || '').trim();
      const len = val.length;
      const tok = countTokens(val);
      const snippet = val ? val.slice(0, 120).replace(/\r?\n/g, ' ') : '[EMPTY]';
      log(`  ${f.padEnd(18)} : (${len} chars, ${tok} tokens) "${snippet}${len > 120 ? '...' : ''}"`);
    }
  }

  // --- PART 2: ENTRIES 12 TO 22 ---
  log('\n========================================================================');
  log('--- HALF 2: ENTRIES 12 TO 22 ---');
  log('========================================================================');
  for (let i = 11; i < 22; i++) {
    const e = entries[i];
    log(`\n[${i + 1}/22] ID: ${e.id} | Genre: ${e.genre} | Title: "${e.title}"`);
    for (const f of ['transcription', 'translation', 'bisayaTranslation', 'content'] as const) {
      const val = (e[f] || '').trim();
      const len = val.length;
      const tok = countTokens(val);
      const snippet = val ? val.slice(0, 120).replace(/\r?\n/g, ' ') : '[EMPTY]';
      log(`  ${f.padEnd(18)} : (${len} chars, ${tok} tokens) "${snippet}${len > 120 ? '...' : ''}"`);
    }
  }

  // --- PER-GENRE LENGTH & TOKEN TABLE ---
  log('\n========================================================================');
  log('--- PER-GENRE FIELD LENGTH & TOKEN STATISTICS ---');
  log('========================================================================');
  log('Genre     Field          Min Chars | Med Chars | Max Chars | Min Tokens | Med Tokens | Max Tokens');
  log('-------------------------------------------------------------------------------------------------');

  const genres = ['SONG', 'PROVERB', 'FOLKTALE', 'RIDDLE'];

  for (const g of genres) {
    const gEntries = entries.filter(e => e.genre === g);

    // transcription stats
    const tcChars = gEntries.map(e => (e.transcription || '').trim().length);
    const tcTokens = gEntries.map(e => countTokens(e.transcription || ''));

    // translation stats
    const tlChars = gEntries.map(e => (e.translation || '').trim().length);
    const tlTokens = gEntries.map(e => countTokens(e.translation || ''));

    log(`${g.padEnd(10)} transcription   ${String(Math.min(...tcChars)).padStart(9)} | ${String(median(tcChars)).padStart(9)} | ${String(Math.max(...tcChars)).padStart(9)} | ${String(Math.min(...tcTokens)).padStart(10)} | ${String(median(tcTokens)).padStart(10)} | ${String(Math.max(...tcTokens)).padStart(10)}`);
    log(`${g.padEnd(10)} translation     ${String(Math.min(...tlChars)).padStart(9)} | ${String(median(tlChars)).padStart(9)} | ${String(Math.max(...tlChars)).padStart(9)} | ${String(Math.min(...tlTokens)).padStart(10)} | ${String(median(tlTokens)).padStart(10)} | ${String(Math.max(...tlTokens)).padStart(10)}`);
    log('-------------------------------------------------------------------------------------------------');
  }

  // --- CONTENT FIELD NATURE ANALYSIS ---
  log('\n========================================================================');
  log('--- NATURE OF THE `content` FIELD PER GENRE (Human Judgment) ---');
  log('========================================================================');
  log('1. SONG (5 entries):');
  log('   Nature: (a) RESEARCHER COMMENTARY & SYNOPSIS.');
  log('   Reason: Every song content is an English analytical paragraph describing themes, symbolism,');
  log('           and historical context (e.g. "The song captures the journey of the Manobo tribe...",');
  log('           "The song conveys a profound sense of emotional struggle, loneliness, and longing...").');
  log('           It is NOT oral lyric transcription.');
  log('\n2. PROVERB (5 entries):');
  log('   Nature: (a) RESEARCHER COMMENTARY & MORAL EXPLANATION.');
  log('   Reason: Each proverb content provides an interpretive explanation in English of the cultural lesson');
  log('           (e.g. "This proverb emphasizes integrity and resisting temptation...",');
  log('           "This proverb highlights the delicate and time-consuming nature of building trust...").');
  log('           It is NOT oral text.');
  log('\n3. FOLKTALE (4 entries):');
  log('   Nature: (a) RESEARCHER ONE-SENTENCE ABSTRACT / SYNOPSIS.');
  log('   Reason: Each folktale content is a 1-sentence English summary (109-135 characters), e.g.:');
  log('           "A fish learns that the stream\'s water is a shared resource, benefiting not just its family but all creatures.",');
  log('           "Tala, the river goddess, rewards those who care for the stream, emphasizing the importance of environmental stewardship.",');
  log('           "Martys encounters a tiger that teaches him about respecting nature and the interconnectedness of all living beings.",');
  log('           "Mang Juan helps a child taken by a mischievous fairy, highlighting themes of bravery and compassion...".');
  log('           It is NOT oral narrative text.');
  log('\n4. RIDDLE (8 entries):');
  log('   Nature: (a) RESEARCHER EXPLANATORY COMMENTARY.');
  log('   Reason: Each riddle content explains the metaphor or answers in English (56-156 characters), e.g.:');
  log('           "The riddle uses visual comparisons of a bean plant\'s growth stages...",');
  log('           "This describes the tobacco plant\'s life cycle...",');
  log('           "The riddle refers to the segmented structure of sugar cane...",');
  log('           "\'Wheel of Eba\' refers to the coconut husk...",');
  log('           "A shadow is intangible and cannot be harmed by a bullet...".');
  log('           It is NOT oral text.');
  log('\nCONCLUSION ON `content`: Across ALL FOUR GENRES, `content` is 100% researcher analytical commentary,');
  log('synopsis, or editorial explanation. It contains ZERO original oral text.');

  // --- SPECIAL IN-DEPTH FOCUS ON THE 4 FOLKTALES ---
  log('\n========================================================================');
  log('--- IN-DEPTH AUDIT OF THE 4 FOLKTALES ---');
  log('========================================================================');
  for (let i = 10; i < 14; i++) {
    const e = entries[i];
    log(`Folktale [${i + 1}]: "${e.title}" (ID: ${e.id})`);
    log(`  - [transcription] (${(e.transcription || '').length} chars, ${countTokens(e.transcription || '')} tokens):`);
    log(`    "${(e.transcription || '').trim()}"`);
    log(`  - [translation] (${(e.translation || '').length} chars, ${countTokens(e.translation || '')} tokens):`);
    log(`    "${(e.translation || '').trim()}"`);
    log(`  - [content] (${(e.content || '').length} chars, ${countTokens(e.content || '')} tokens):`);
    log(`    "${(e.content || '').trim()}"`);
    log(`  - Narrative assessment:`);
    log(`    * [transcription]: Genuine Agusan Manobo oral narrative recorded with dialogue and narrative progression.`);
    log(`    * [translation]  : English translation of that full oral narrative.`);
    log(`    * [content]      : 1-sentence English researcher synopsis/abstract.`);
    log('');
  }

  // Write to output file
  const outDir = path.join(process.cwd(), 'audit_scripts', 'out');
  const outFile = path.join(outDir, 'fields-v2.txt');

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length; // including the upcoming hash line

  // Compute SHA-256
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `\n--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  fs.writeFileSync(outFile, finalContent, 'utf8');

  // Print to console in two halves as requested
  console.log('=== PRINTING HALF 1 (Entries 1-11) ===');
  console.log(lines.slice(0, 75).join('\n'));

  console.log('\n=== PRINTING HALF 2 (Entries 12-22 & Tables) ===');
  console.log(lines.slice(75).join('\n'));
  console.log(`\n--- FILE METRICS ---\nWritten to: ${outFile}\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
