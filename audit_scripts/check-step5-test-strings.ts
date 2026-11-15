import fs from 'fs';
import { genreRules, themeRules, locationRules } from '../lib/classification/rules';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const testStrings = [
  "missionary using crossing",
  "toward aware reward",
  "train brain strain",
  "damage madam",
  "ruling scheduling hauling"
];

const allRules = [...genreRules, ...themeRules, ...locationRules];

console.log("=== CURRENT (includes) SUBSTRING MATCHING ===");
for (const str of testStrings) {
  const norm = str.toLowerCase();
  console.log(`\nInput: "${str}"`);
  const matchedKeywords: { ruleId: string; ruleName: string; term: string; type: string }[] = [];
  for (const rule of allRules) {
    for (const kw of rule.keywords) {
      if (norm.includes(kw.toLowerCase())) {
        matchedKeywords.push({ ruleId: rule.id, ruleName: rule.name, term: kw, type: 'keyword' });
      }
    }
    for (const phrase of rule.phrases) {
      if (norm.includes(phrase.toLowerCase())) {
        matchedKeywords.push({ ruleId: rule.id, ruleName: rule.name, term: phrase, type: 'phrase' });
      }
    }
    for (const clue of rule.contextClues) {
      if (norm.includes(clue.toLowerCase())) {
        matchedKeywords.push({ ruleId: rule.id, ruleName: rule.name, term: clue, type: 'context' });
      }
    }
  }
  if (matchedKeywords.length === 0) {
    console.log("  No matches.");
  } else {
    for (const m of matchedKeywords) {
      console.log(`  - [${m.ruleId} ${m.ruleName}] ${m.type}: "${m.term}"`);
    }
  }
}

process.exit(0);
