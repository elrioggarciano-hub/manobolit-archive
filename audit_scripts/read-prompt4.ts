import fs from 'fs';
setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

const content = fs.readFileSync('C:/Users/admin/.gemini/antigravity/brain/b31c18ce-2b06-4eac-ab57-096abac1f0ac/.system_generated/logs/transcript_full.jsonl', 'utf8');
const lines = content.split('\n');
for (const line of lines) {
  if (line.includes('=== STEP 5:')) {
    const obj = JSON.parse(line);
    const userReq = obj.content;
    const s5Idx = userReq.indexOf('=== STEP 5:');
    const s7Idx = userReq.indexOf('=== STEP 7:');
    console.log(userReq.substring(s5Idx, s7Idx));
    break;
  }
}
process.exit(0);
