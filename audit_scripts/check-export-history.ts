setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';

async function main() {
  const transcriptPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\b31c18ce-2b06-4eac-ab57-096abac1f0ac\\.system_generated\\logs\\transcript.jsonl';
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

  for (const l of lines) {
    try {
      const parsed = JSON.parse(l);
      if (parsed.tool_calls) {
        for (const tc of parsed.tool_calls) {
          const str = JSON.stringify(tc);
          if (str.includes('export-entries') || str.includes('entries.json') || str.includes('prisma')) {
            console.log(`[Step ${parsed.step_index}] ${parsed.created_at} (${tc.name}): ${str.slice(0, 150)}`);
          }
        }
      }
    } catch (e) {}
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

