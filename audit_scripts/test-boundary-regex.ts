import fs from 'fs';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchWordBoundary(text: string, term: string): boolean {
  // If term has leading/trailing non-letters, handle appropriately
  // A clean pattern: (?<![\p{L}\p{N}])term(?![\p{L}\p{N}]) with 'iu' flags
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(term.trim())}(?![\\p{L}\\p{N}])`, 'iu');
  return pattern.test(text);
}

const testStrings = [
  "missionary using crossing",
  "toward aware reward",
  "train brain strain",
  "damage madam",
  "ruling scheduling hauling"
];

const checkTerms = ["sing", "miss", "war", "rain", "dam", "uling"];

console.log("=== TESTING BORDER REGEX ===");
for (const str of testStrings) {
  console.log(`String: "${str}"`);
  for (const term of checkTerms) {
    const matched = matchWordBoundary(str, term);
    console.log(`  term "${term}": ${matched}`);
  }
}

console.log("\n=== TESTING POSITIVE MATCHES ===");
const positiveTests = [
  { text: "we sing together", term: "sing" },
  { text: "sing", term: "sing" },
  { text: "kaba-kaba sa hangin", term: "kaba-kaba" },
  { text: "atabay sa unahan", term: "atabay" },
  { text: "answer: the moon", term: "answer:" },
  { text: "sa damgo ko", term: "damgo" },
  { text: "ang uling itom", term: "uling" },
  { text: "sta. maria, trento", term: "sta. maria" },
  { text: "sitio dam", term: "dam" },
];

for (const t of positiveTests) {
  const matched = matchWordBoundary(t.text, t.term);
  console.log(`Text: "${t.text}", Term: "${t.term}" -> ${matched ? "MATCH (PASS)" : "NO MATCH (FAIL)"}`);
}

process.exit(0);
