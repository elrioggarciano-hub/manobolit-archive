setTimeout(() => { console.error('TIMEOUT'); process.exit(1) }, 60000);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { stripGenreDescriptors, stripRiddleAnswer, cleanClassificationText } from '../lib/classification/textCleaning';

async function main() {
  const lines: string[] = [];
  const log = (str: string) => lines.push(str);

  log('=== STEP 4: DESCRIPTOR STRIPPING & TEXT CLEANING AUDIT ===\n');

  log('--- 1. THREE BEFORE/AFTER EXAMPLES OF DESCRIPTOR & ANSWER STRIPPING ---');

  // Example 1: Riddle with editorial "Answer: ..."
  const ex1Before = 'Wuhig to rembo rembo tampudon kunag ka jabo. Water in limbo limbo did not spill. Answer: Tubo (Sugar Cane)';
  const ex1After = cleanClassificationText(ex1Before);
  log('\nExample 1 (Riddle editorial answer stripping):');
  log(`  BEFORE: "${ex1Before}"`);
  log(`  AFTER : "${ex1After}"`);

  // Example 2: Song with author citation and genre term
  const ex2Before = 'Lantawod diya lawod nig duma kan bayod soe tribu ko no daog-daog mahawig no katuigan. The folk song captures the journey of the Manobo tribe. Maravilla (2024).';
  const ex2After = cleanClassificationText(ex2Before);
  log('\nExample 2 (Song citation and genre label stripping):');
  log(`  BEFORE: "${ex2Before}"`);
  log(`  AFTER : "${ex2After}"`);

  // Example 3: Proverb with panultihon prefix and genre metadata sentence
  const ex3Before = 'Panultihon: Inggad nukoy ka lisud kan kinabuhi, mas marujow pad nug antus. This proverb emphasizes integrity and resisting temptation from Catipay & Curato (2024).';
  const ex3After = cleanClassificationText(ex3Before);
  log('\nExample 3 (Proverb label and citation stripping):');
  log(`  BEFORE: "${ex3Before}"`);
  log(`  AFTER : "${ex3After}"`);

  log('\n--- 2. KEYWORD-STUFFED DESCRIPTORS REMOVED FROM TRAINING CORPUS ---');
  log('1. tr-myth-1:');
  log('   - Removed: "Creation origin deity celestial cosmos"');
  log('2. tr-myth-2:');
  log('   - Reworded: "supreme creator deity" -> "supreme creator", "divine spirits" -> "spirits", "gods" -> "divine beings"');
  log('3. tr-myth-3:');
  log('   - Reworded: "Deities formed mankind to steward the sacred soil" -> "Spirits formed mankind to steward the soil"');
  log('4. tr-legend-1:');
  log('   - Removed: "According to legend,"');
  log('   - Reworded: "supernatural hero" -> "warrior", "holy place of pilgrimage" -> "gathering place of pilgrimage"');
  log('5. tr-legend-2:');
  log('   - Reworded: "sacred mountain ... sacred mists" -> "mountain ... mists"');
  log('6. tr-folktale-1:');
  log('   - Removed: "leaving a moral lesson about wit over brute force. Sugilanon tudtul bata sapa wuhig."');
  log('7. tr-folktale-2:');
  log('   - Removed: "Entertainment and traditional moral wisdom for children in the tribe."');
  log('8. tr-epic-1:');
  log('   - Removed: "epic" from "In the epic battle of Ulaging"');
  log('9. tr-epic-2:');
  log('   - Reworded: "Heroic narrative poem of ancient conquests, courage, and tribal warfare" -> "Chieftain narratives of ancient journeys and clan defense"');
  log('10. tr-riddle-1:');
  log('   - Removed: "Answer: tobacco leaf."');
  log('   - Removed: "Tigmo riddle puzzle wordplay mystery question"');
  log('11. tr-riddle-2:');
  log('   - Removed: "A traditional riddle about the coconut tree and well."');
  log('   - Removed: "Tigmo panultihon."');
  log('12. tr-proverb-1:');
  log('   - Removed: "Panultihon:"');
  log('   - Removed: "This proverb emphasizes integrity, resisting temptation, and principled living."');
  log('13. tr-proverb-2:');
  log('   - Removed: "Panultihon:"');
  log('   - Removed: "Traditional wisdom on patience and social harmony."');
  log('14. tr-song-1:');
  log('   - Removed: "The song captures the journey of the Manobo tribe, who have long felt invisible and neglected."');
  log('   - Removed: "IPRA Law 8371 Maravilla (2024)."');
  log('15. tr-song-2:');
  log('   - Removed: "Lyrical melody sorrow tears loneliness."');
  log('16. tr-song-3:');
  log('   - Removed: "The song portrays deep sorrow, loneliness, and separation."');
  log('17. tr-chant-1:');
  log('   - Removed: "chant", "Chanted prayer"');

  const contentRaw = lines.join('\n') + '\n';
  const lineCountBeforeHash = contentRaw.split('\n').length;
  const hash = crypto.createHash('sha256').update(contentRaw).digest('hex');
  const finalContent = contentRaw + `\n--- FILE METRICS ---\nTotal Lines: ${lineCountBeforeHash + 3}\nSHA-256: ${hash}\n`;

  const outFile = path.join(process.cwd(), 'audit_scripts', 'out', 'step4-descriptors.txt');
  fs.writeFileSync(outFile, finalContent, 'utf8');

  console.log(finalContent);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

