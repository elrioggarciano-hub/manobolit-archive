require('dotenv/config')
const { PrismaClient } = require('../src/generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')
const { BIBLE_PARALLEL_PHRASES, BIBLE_LEXICON } = require('../lib/translation/bibleCorpus')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting ParallelTranslation seeding into Supabase PostgreSQL...')

  let seededPhrases = 0
  let seededLexicon = 0
  let seededEntries = 0

  // 1. Seed Parallel Phrases
  for (const p of BIBLE_PARALLEL_PHRASES) {
    const eng = (p.english || '').toLowerCase().trim()
    const msm = (p.manobo || '').toLowerCase().trim()
    const ceb = (p.bisaya || '').toLowerCase().trim()

    const existing = await prisma.parallelTranslation.findFirst({
      where: { english: eng, manobo: msm },
    })

    if (!existing) {
      await prisma.parallelTranslation.create({
        data: {
          english: eng,
          manobo: msm,
          bisaya: ceb,
          category: 'PHRASE',
          context: p.context || 'Literature Phrase',
          sourceRef: p.verseRef || p.entryTitle || 'ManoboLit Archive',
          isVerified: true,
        },
      })
      seededPhrases++
    }
  }

  // 2. Seed Lexicon Words
  for (const lex of BIBLE_LEXICON) {
    const eng = (lex.english || '').toLowerCase().trim()
    const msm = (lex.manobo || '').toLowerCase().trim()
    const ceb = (lex.bisaya || '').toLowerCase().trim()

    const existing = await prisma.parallelTranslation.findFirst({
      where: { english: eng, manobo: msm },
    })

    if (!existing) {
      await prisma.parallelTranslation.create({
        data: {
          english: eng,
          manobo: msm,
          bisaya: ceb,
          category: lex.category || 'LEXICON',
          context: lex.notes || 'Agusan Manobo Vocabulary',
          sourceRef: 'Catipay & Curato (2024) / Maravilla (2024)',
          isVerified: true,
        },
      })
      seededLexicon++
    }
  }

  // 3. Extract parallel literature texts from existing archive entries
  const entries = await prisma.literatureEntry.findMany({
    select: { id: true, title: true, transcription: true, translation: true },
  })

  for (const entry of entries) {
    if (entry.transcription && entry.translation) {
      const eng = entry.translation.toLowerCase().trim()
      const msm = entry.transcription.toLowerCase().trim()

      const existing = await prisma.parallelTranslation.findFirst({
        where: { english: eng, manobo: msm },
      })

      if (!existing && eng.length > 0 && msm.length > 0) {
        await prisma.parallelTranslation.create({
          data: {
            english: eng,
            manobo: msm,
            bisaya: '',
            category: 'SENTENCE',
            context: `Archive Entry: ${entry.title}`,
            sourceRef: entry.title,
            literatureId: entry.id,
            isVerified: true,
          },
        })
        seededEntries++
      }
    }
  }

  const total = await prisma.parallelTranslation.count()
  console.log(`ParallelTranslation seeded successfully!`)
  console.log(`- Phrases added: ${seededPhrases}`)
  console.log(`- Lexicon words added: ${seededLexicon}`)
  console.log(`- Full literature sentences added: ${seededEntries}`)
  console.log(`- Total Parallel Translations in Database: ${total}`)
}

main()
  .catch((e) => {
    console.error('Error seeding parallel translations:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export {}
