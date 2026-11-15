import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const dir = path.join(process.cwd(), 'audit_scripts', 'out');
const files = fs.readdirSync(dir).filter(f => f.startsWith('step6'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  const raw = fs.readFileSync(fullPath);
  const text = raw.toString('utf8');
  const lines = text.split('\n').filter((_, idx, arr) => idx < arr.length - 1 || arr[idx] !== '').length;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  console.log(`${file}: ${lines} lines, SHA-256: ${hash}`);
}

process.exit(0);
