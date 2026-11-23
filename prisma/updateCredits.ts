// Sets the performer credits on the archive entries in the database:
//   • folk songs  → singer   = Diosdado C. Blanco (Datu Hawdon Pagtublehon)  (only where still empty/placeholder)
//   • proverbs, folktales, riddles → narrator = May Ann Mercado
// Safe to run more than once. Usage: npm run credits:update
import 'dotenv/config'
import { prisma } from '../lib/database/prisma'

const SINGER = 'Diosdado C. Blanco (Datu Hawdon Pagtublehon)'
const NARRATOR = 'May Ann Mercado'

async function updateCredits() {
  // Only fills songs whose singer is still empty or the old placeholder — never overwrites a reviewer's edit
  const songs = await prisma.literatureEntry.updateMany({
    where: {
      AND: [
        { OR: [{ type: 'FOLK_SONG' }, { genre: 'SONG' }] },
        { OR: [{ singer: null }, { singer: '' }, { singer: 'Manobo Folk Singer (Elder)' }] },
      ],
    },
    data: { singer: SINGER },
  })
  const oral = await prisma.literatureEntry.updateMany({
    where: { genre: { in: ['PROVERB', 'FOLKTALE', 'RIDDLE'] } },
    data: { narrator: NARRATOR },
  })
  console.log(`Folk songs updated (singer): ${songs.count}`)
  console.log(`Proverbs/folktales/riddles updated (narrator): ${oral.count}`)
}

updateCredits()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Update failed:', err)
    process.exit(1)
  })
