setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);
import fs from 'fs';

const content = fs.readFileSync('C:/Users/admin/.gemini/antigravity/brain/b31c18ce-2b06-4eac-ab57-096abac1f0ac/.system_generated/logs/transcript_full.jsonl', 'utf8');
for (const line of content.split('\n')) {
  if (line.includes('=== STEP 4:')) {
    const obj = JSON.parse(line);
    const userReq = obj.content;
    const s4Idx = userReq.indexOf('=== STEP 4:');
    const s8Idx = userReq.indexOf('=== STEP 8:');
    console.log(userReq.substring(s4Idx, s8Idx));
    break;
  }
}
process.exit(0);

