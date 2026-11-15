setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { genreRules, themeRules, locationRules, setRulesProfile, RULES_PROFILE } from '../lib/classification/rules';
import { scoreRule, classifyHybrid } from '../lib/classification/hybrid';
import { classifyEntry } from '../lib/classification/engine';
import { cleanClassificationText } from '../lib/classification/textCleaning';
import { ACTIVE_GENRES } from '../lib/classification/trainingCorpus';

async function main() {
  const lines: string[] = [];
  const log = (str: string) => lines.push(str);

  log('========================================================================================');
  log('                     PART B: STEP 5 DIAGNOSTICS AUDIT REPORT                           ');
  log('========================================================================================\n');

  // Load entries.json
  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const entries: any[] = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));

  // Ensure framework-only profile
  setRulesProfile('framework-only');

  log('--- 1. RULE_BASED (FRAMEWORK-ONLY) PER-ENTRY BREAKDOWN ---');
  log(`Total Entries: ${entries.length}\n`);

  let zeroConfidenceCount = 0;
  let coveredCount = 0;
  let coveredCorrect = 0;
  let totalCorrect = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const textToClassify = cleanClassificationText(
      [entry.transcription, entry.translation].filter(Boolean).join(' ')
    );
    const normText = textToClassify.toLowerCase();

    // Check matched terms and confidence for each active genre rule
    const genreConf: Record<string, { conf: number; terms: string[] }> = {};
    let maxConf = 0;

    for (const g of ACTIVE_GENRES) {
      const rule = genreRules.find(r => r.value === g);
      if (rule) {
        const detail = scoreRule(rule, normText, 'framework-only');
        const terms = detail.matched.map(m => m.term);
        genreConf[g] = { conf: detail.confidence, terms };
        if (detail.confidence > maxConf) maxConf = detail.confidence;
      } else {
        genreConf[g] = { conf: 0, terms: [] };
      }
    }

    const hybridRes = classifyHybrid(textToClassify, 'ALL', 'RULE_BASED');
    const returnedGenre = hybridRes.genre.value;
    const returnedConf = hybridRes.genre.confidence;
    const isCorrect = returnedGenre === entry.genre;
    if (isCorrect) totalCorrect++;

    const isZero = maxConf === 0;
    if (isZero) zeroConfidenceCount++;
    else {
      coveredCount++;
      if (isCorrect) coveredCorrect++;
    }

    log(`[Entry ${String(i + 1).padStart(2)}/${entries.length}] ID: ${entry.id.padEnd(20)} | Actual: ${entry.genre.padEnd(8)} | Returned: ${returnedGenre.padEnd(8)} (Conf: ${returnedConf.toFixed(2)}) | MaxRuleConf: ${maxConf.toFixed(2)} | ZeroAllGenres: ${isZero ? 'YES' : 'NO'}`);
    for (const g of ACTIVE_GENRES) {
      const gc = genreConf[g];
      log(`   - ${g.padEnd(8)}: conf=${gc.conf.toFixed(2)} | matched: [${gc.terms.join(', ')}]`);
    }
    log('');
  }

  log('--- SUMMARY OF QUESTION 1 ---');
  log(`Entries with ZERO rule confidence for all 4 active genres: ${zeroConfidenceCount} / ${entries.length} (${((zeroConfidenceCount / entries.length) * 100).toFixed(1)}%)`);
  log(`When all genres have zero rule confidence, the code returns: 'RIDDLE'`);
  log(`Reason / Fallback Code (from lib/classification/hybrid.ts lines 289-295):`);
  log(`   finalGenreScores.sort((a, b) => b.confidence - a.confidence)`);
  log(`   const topGenre = finalGenreScores[0] || {`);
  log(`     genre: targetGenreFilter !== 'ALL' ? targetGenreFilter : (ACTIVE_GENRES[0] || 'RIDDLE'),`);
  log(`     confidence: 0,`);
  log(`     ruleId: 'G001',`);
  log(`   }`);
  log(`Because all scores are 0.00, Array.prototype.sort preserves original insertion order, which is candidateGenres = ACTIVE_GENRES = ['RIDDLE', 'PROVERB', 'FOLKTALE', 'SONG'].`);
  log(`Thus, finalGenreScores[0] is always RIDDLE with confidence 0.00.\n`);

  log('--- 2. ACCURACY ON COVERED ENTRIES ONLY (QUESTION 2) ---');
  log(`Total Entries: ${entries.length}`);
  log(`Entries where at least one rule fired (Covered): ${coveredCount} / ${entries.length} (${((coveredCount / entries.length) * 100).toFixed(1)}% coverage)`);
  log(`Correct on covered entries: ${coveredCorrect} / ${coveredCount}`);
  log(`Accuracy on covered entries: ${(coveredCorrect / coveredCount).toFixed(3)} (${((coveredCorrect / coveredCount) * 100).toFixed(1)}%)`);
  log(`Overall accuracy (treating zero-rule entries as returned by code): ${(totalCorrect / entries.length).toFixed(3)} (${totalCorrect}/${entries.length})\n`);

  log('--- 3. FREE-TEXT TEST FOR LOCATION (QUESTION 3) ---');
  const locTest1 = classifyEntry("Agusan del Sur");
  const locTest2 = classifyEntry("In Agusan del Sur the hunter climbed the mountain");

  log(`Input 1: "Agusan del Sur"`);
  log(`   Location returned: ${JSON.stringify(locTest1.location)}`);
  log(`   Expected: null | Match Expected: ${locTest1.location === null ? 'YES' : 'NO'}`);

  log(`Input 2: "In Agusan del Sur the hunter climbed the mountain"`);
  log(`   Location returned: ${JSON.stringify(locTest2.location)}`);
  log(`   Expected: null | Match Expected: ${locTest2.location === null ? 'YES' : 'NO'}`);

  log(`Code explanation: In lib/classification/engine.ts lines 88-96, locationInput is ONLY extracted from metadata properties:`);
  log(`   const locParts = [input.communityLocation, input.barangay, input.municipality, input.province].filter(Boolean)`);
  log(`When input is a plain string, locationInput is undefined. Furthermore, in lib/classification/hybrid.ts lines 220-230:`);
  log(`   if (locationInput && locationInput.trim()) { ... }`);
  log(`Free oral text is never scanned for location rules; location is strictly derived from recorded provenance metadata.\n`);

  log('--- 4. THEME THRESHOLD & OVERLAPPING TERMS (QUESTION 4) ---');
  log(`Theme threshold implementation in lib/classification/hybrid.ts lines 205-214:`);
  log(`   const distinctTerms = new Set(detail.matched.map(m => m.term.toLowerCase()))`);
  log(`   if (distinctTerms.size >= 2 && detail.confidence >= 0.12) { ... }`);
  log(`Testing with text containing: "peace and harmony" for rule T014 (Conflict and Resolution):`);
  const t014 = themeRules.find(r => r.id === 'T014');
  if (t014) {
    const detailT014 = scoreRule(t014, "we seek peace and harmony in the community", 'full');
    const matchedTerms = detailT014.matched.map(m => m.term);
    const distinctSet = new Set(detailT014.matched.map(m => m.term.toLowerCase()));
    log(`   Rule: ${t014.id} (${t014.name})`);
    log(`   Keywords include: 'harmony'`);
    log(`   Phrases include: 'peace and harmony'`);
    log(`   Matched terms array: [${matchedTerms.join(', ')}]`);
    log(`   distinctTerms Set: [${Array.from(distinctSet).join(', ')}]`);
    log(`   distinctTerms.size: ${distinctSet.size}`);
    log(`   Did both keyword and enclosing phrase fire? ${distinctSet.size >= 2 ? 'YES' : 'NO'}`);
    log(`   Are overlapping terms deduplicated by substring containment? NO.`);
    log(`   Deduplication only removes identical strings via Set(term). A keyword that is a substring of an enclosing matched phrase (e.g. 'harmony' inside 'peace and harmony') is counted as 2 distinct terms.`);
  }

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length;
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `\n--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  const outFile = path.join(process.cwd(), 'audit_scripts', 'out', 'step5-diag.txt');
  fs.writeFileSync(outFile, finalContent, 'utf8');

  console.log(finalContent);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
