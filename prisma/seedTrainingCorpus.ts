// Seeds the TrainingCorpusDocument table from data/training-corpus.json.
// Existing rows are left untouched (admin edits are never overwritten); only missing ids are inserted.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/database/prisma'

async function seedTrainingCorpus() {
  const file = path.join(__dirname, '..', 'data', 'training-corpus.json')
  const docs = JSON.parse(fs.readFileSync(file, 'utf8')) as any[]
  console.log(`--- Seeding training corpus (${docs.length} docs from data/training-corpus.json) ---`)

  let created = 0
  let skipped = 0
  for (const d of docs) {
    const exists = await prisma.trainingCorpusDocument.findUnique({ where: { id: d.id } })
    if (exists) {
      skipped++
      continue
    }
    await prisma.trainingCorpusDocument.create({
      data: {
        id: d.id,
        text: d.text,
        genre: d.genre,
        themes: JSON.stringify(d.themes || []),
        provenance: d.provenance,
        source: d.source,
        citation: d.citation ?? null,
        archiveEntryId: d.archiveEntryId ?? null,
        overlapsArchive: Boolean(d.overlapsArchive),
      },
    })
    created++
  }

  const total = await prisma.trainingCorpusDocument.count()
  console.log(`Inserted: ${created}, already present: ${skipped}, total in table: ${total}`)
}

seedTrainingCorpus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seeding error:', err)
    process.exit(1)
  })
