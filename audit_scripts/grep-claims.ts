setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';

const patterns = [
  /\bneural\b/i,
  /\bdeep learning\b/i,
  /\blatent\b/i,
  /\bembedding[s]?\b/i,
  /\b64-d\b/i,
  /\bneuro-symbolic\b/i,
  /\bquad-model\b/i,
  /\bcomputational ethnolinguistics\b/i,
  /\bontological\b/i,
  /\bexpert system\b/i,
  /\brigorous\b/i,
  /\bproves\b/i
];

function scanDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === '.next' || f === 'audit_scripts' || f === 'dist' || f === 'coverage') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full, fileList);
    } else if (/\.(ts|tsx|js|jsx|py|json|md)$/i.test(f) && !f.endsWith('package-lock.json')) {
      fileList.push(full);
    }
  }
  return fileList;
}

async function main() {
  const allFiles = scanDir(process.cwd());
  console.log(`=== SCANNING ${allFiles.length} REPO FILES FOR INFLATED CLAIMS ===\n`);

  let totalHits = 0;
  for (const file of allFiles) {
    const relPath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      for (const pat of patterns) {
        if (pat.test(line)) {
          console.log(`${relPath}:${idx + 1}: ${line.trim()}`);
          totalHits++;
          break; // Avoid duplicate logs for same line
        }
      }
    });
  }

  console.log(`\nTotal hits found: ${totalHits}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
