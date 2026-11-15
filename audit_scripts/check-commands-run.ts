setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';

async function main() {
  const transcriptPath = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\b31c18ce-2b06-4eac-ab57-096abac1f0ac\\.system_generated\\logs\\transcript.jsonl';
  if (!fs.existsSync(transcriptPath)) {
    console.log('Transcript not found');
    process.exit(0);
  }

  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  console.log(`Total transcript lines: ${lines.length}`);

  const commandsRun: { step: number; cmd: string; time: string }[] = [];

  for (const l of lines) {
    try {
      const parsed = JSON.parse(l);
      if (parsed.tool_calls) {
        for (const tc of parsed.tool_calls) {
          if (tc.name === 'run_command' && tc.args && tc.args.CommandLine) {
            commandsRun.push({
              step: parsed.step_index,
              cmd: tc.args.CommandLine.replace(/^"|"$/g, ''),
              time: parsed.created_at,
            });
          }
        }
      }
    } catch (e) {}
  }

  console.log(`Total run_command calls: ${commandsRun.length}\n`);
  for (const c of commandsRun) {
    const isDbRelated = /prisma|seed|migrate|reset|push|export-entries/i.test(c.cmd);
    console.log(`[Step ${c.step}] ${c.time}: ${c.cmd} ${isDbRelated ? ' <=== DB / SEED / EXPORT' : ''}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

