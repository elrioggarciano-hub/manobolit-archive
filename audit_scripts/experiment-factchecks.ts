setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'audit_scripts') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx|json|prisma|py)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function main() {
  const rootDir = process.cwd();
  const allFiles = walkDir(rootDir);

  console.log(`=== FACT CHECKS: GREP SEARCH ACROSS ${allFiles.length} FILES ===\n`);

  const patterns = [
    { name: 'Math.random', regex: /Math\.random/g },
    { name: 'if (title === or title check', regex: /if\s*\([^)]*title\s*===/gi },
    { name: 'switch on id', regex: /switch\s*\([^)]*id/gi },
    { name: 'fallback/default genre MYTH', regex: /['"]MYTH['"]/g },
    { name: 'Hardcoded accuracy/f1 numbers (e.g. 94%, 0.94, 91%, 0.91, 87%, 0.87, 92%, 0.92, 0.8, 0.9)', regex: /(accuracy|precision|recall|f1|confidence)\s*[:=]\s*(0\.\d+|[89]\d%?)/gi },
    { name: 'targetGenreFilter usage', regex: /targetGenreFilter|genreFilter/g },
    { name: 'External AI APIs (openai|anthropic|gemini|huggingface|cohere)', regex: /(openai|anthropic|gemini|huggingface|cohere|replicate)/gi },
  ];

  for (const pat of patterns) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`PATTERN: ${pat.name}`);
    console.log(`--------------------------------------------------------------------------------`);
    let matchesCount = 0;
    for (const f of allFiles) {
      const relPath = path.relative(rootDir, f);
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pat.regex.test(line)) {
          matchesCount++;
          console.log(`${relPath}:${i + 1}: ${line.trim()}`);
        }
      }
    }
    if (matchesCount === 0) {
      console.log('NOT FOUND');
    }
    console.log(`Total hits: ${matchesCount}\n`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fact checks error:', err);
  process.exit(1);
});

