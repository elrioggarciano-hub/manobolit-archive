// Seeds the LexiconEntry table from data/lexicon.json.
// Runs only when the table is empty, so admin edits made in the app are never overwritten.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/database/prisma'

async function seedLexicon() {
  const file = path.join(__dirname, '..', 'data', 'lexicon.json')
  const { entries } = JSON.parse(fs.readFileSync(file, 'utf8')) as { entries: any[] }

  const existing = await prisma.lexiconEntry.count()
  if (existing > 0) {
    console.log(`LexiconEntry already has ${existing} rows; nothing seeded (manage entries in Admin → Lexicon).`)
    return
  }

  const result = await prisma.lexiconEntry.createMany({
    data: entries.map(e => ({
      kind: e.kind,
      manobo: e.manobo,
      english: e.english ?? null,
      bisaya: e.bisaya ?? null,
      tagalog: e.tagalog ?? null,
      root: e.root ?? null,
      partOfSpeech: e.partOfSpeech ?? null,
      definition: e.definition ?? null,
      notes: e.notes ?? null,
      reference: e.reference ?? null,
      entryTitle: e.entryTitle ?? null,
      group: e.group ?? null,
      source: e.source ?? null,
      sortOrder: e.sortOrder ?? 0,
    })),
  })
  console.log(`Seeded ${result.count} lexicon entries from data/lexicon.json`)
}

seedLexicon()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seeding error:', err)
    process.exit(1)
  })
