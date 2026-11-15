setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';

async function main() {
  const entriesPath = path.join(process.cwd(), 'audit_scripts', 'entries.json');
  const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));

  console.log('=== AUDIT CHECK: FIELD USAGE ACROSS ALL 22 ARCHIVE ENTRIES ===');
  console.log(`Total entries: ${entries.length}\n`);

  for (const [idx, e] of entries.entries()) {
    console.log(`--- [${idx + 1}/22] ID: ${e.id} | Genre: ${e.genre} | Title: "${e.title}" ---`);
    console.log(`  Source: ${e.source} | Location: ${e.communityLocation || 'N/A'}`);
    
    // Check transcription (Manobo oral text)
    const trans = (e.transcription || '').trim();
    const transSnippet = trans ? `(${trans.length} chars) "${trans.slice(0, 80).replace(/\n/g, ' ')}..."` : 'EMPTY';
    console.log(`  [transcription]   : ${transSnippet}`);

    // Check translation (English translation)
    const transl = (e.translation || '').trim();
    const translSnippet = transl ? `(${transl.length} chars) "${transl.slice(0, 80).replace(/\n/g, ' ')}..."` : 'EMPTY';
    console.log(`  [translation]     : ${translSnippet}`);

    // Check content (Researcher commentary / synopsis / narrative)
    const cont = (e.content || '').trim();
    const contSnippet = cont ? `(${cont.length} chars) "${cont.slice(0, 80).replace(/\n/g, ' ')}..."` : 'EMPTY';
    console.log(`  [content]         : ${contSnippet}`);

    // Check bisayaTranslation
    const bis = (e.bisayaTranslation || '').trim();
    const bisSnippet = bis ? `(${bis.length} chars) "${bis.slice(0, 80).replace(/\n/g, ' ')}..."` : 'EMPTY';
    console.log(`  [bisayaTranslation]: ${bisSnippet}`);

    // Commentary indicator: check if content contains meta-words like "The song", "The riddle", "The proverb", "teaches", "symbolizes", "captures"
    const isCommentary = /\b(the song|this song|the riddle|this riddle|the proverb|this proverb|the story|captures the journey|moral lesson|symbolizes|reflects|teaches)\b/i.test(cont);
    console.log(`  Researcher Commentary in [content]?: ${isCommentary ? 'YES (contains descriptive meta-commentary)' : 'NO (appears to be primary text)'}\n`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
