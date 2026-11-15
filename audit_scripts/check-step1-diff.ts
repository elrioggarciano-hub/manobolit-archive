setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  const baselinePath = path.join(process.cwd(), 'audit_scripts', 'baseline', 'd1_output.txt');
  const baselineOutput = fs.readFileSync(baselinePath, 'utf8').trim().replace(/\r\n/g, '\n');

  const currentRaw = execSync('npx --yes tsx audit_scripts/experiment-d1.ts', { encoding: 'utf8' }).trim().replace(/\r\n/g, '\n');

  if (baselineOutput === currentRaw) {
    console.log('DIFF CHECK RESULT: IDENTICAL');
  } else {
    console.log('DIFF DETECTED:');
    console.log('--- BASELINE ---');
    console.log(baselineOutput);
    console.log('--- CURRENT ---');
    console.log(currentRaw);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

