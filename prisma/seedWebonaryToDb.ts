import 'dotenv/config'
import { prisma } from '../lib/database/prisma'
import { FALLBACK_LEXICON } from '../lib/translation/lexiconStore'

// Dictionary data lives in data/lexicon.json (seed source), not in code.
const SIL_WEBONARY_ENTRIES = FALLBACK_LEXICON.webonary

async function seedWebonary() {
  console.log('--- Seeding SIL Webonary Lexicon into Supabase PostgreSQL ---')
  console.log(`Total Webonary entries to process: ${SIL_WEBONARY_ENTRIES.length}`)

  let createdCount = 0
  let existingCount = 0

  for (const entry of SIL_WEBONARY_ENTRIES) {
    const eng = entry.english.trim().toLowerCase()
    const msm = entry.manobo.trim().toLowerCase()
    const ceb = entry.bisaya.trim().toLowerCase()

    const existing = await prisma.parallelTranslation.findFirst({
      where: {
        english: eng,
        manobo: msm,
      },
    })

    if (!existing) {
      await prisma.parallelTranslation.create({
        data: {
          english: eng,
          manobo: msm,
          bisaya: ceb,
          category: entry.partOfSpeech || 'LEXICON',
          context: entry.definition || `Root: ${entry.root}`,
          sourceRef: 'SIL International Webonary (ISO 639-3: msm)',
          isVerified: true,
        },
      })
      createdCount++
    } else {
      existingCount++
    }
  }

  const totalInDb = await prisma.parallelTranslation.count()
  console.log(`Successfully completed!`)
  console.log(`- Newly inserted: ${createdCount}`)
  console.log(`- Already existed: ${existingCount}`)
  console.log(`- Total records in ParallelTranslation table: ${totalInDb}`)
  process.exit(0)
}

seedWebonary().catch((err) => {
  console.error('Seeding error:', err)
  process.exit(1)
})

