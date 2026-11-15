setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';

function searchDir(dir: string, pattern: string) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === '.next' || f.name === '.git') continue;
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      searchDir(full, pattern);
    } else if (f.isFile()) {
      try {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes(pattern)) {
          console.log(`Found "${pattern}" in: ${full}`);
        }
      } catch (e) {}
    }
  }
}

async function main() {
  console.log('Searching for "Lansuk"...');
  searchDir(process.cwd(), 'Lansuk');
  console.log('Searching for "Careful words"...');
  searchDir(process.cwd(), 'Careful words');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

