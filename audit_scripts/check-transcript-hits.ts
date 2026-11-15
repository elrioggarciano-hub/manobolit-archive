setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';

async function main() {
  const transcriptPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\b31c18ce-2b06-4eac-ab57-096abac1f0ac\\.system_generated\\logs\\transcript.jsonl';
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

  for (const [i, l] of lines.entries()) {
    if (l.includes('11 riddles') || l.includes('6 proverbs') || l.includes('0 folktales') || l.includes('Panultihon (Careful words)')) {
      console.log(`Hit at line ${i}: ${l.slice(0, 200)}...`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

