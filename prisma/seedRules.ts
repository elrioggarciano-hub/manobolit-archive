// Seeds the ClassificationRule table from data/classification-rules.json.
// Runs only when the table is empty, so reviewer edits made in the app are never overwritten.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/database/prisma'

async function seedRules() {
  const file = path.join(__dirname, '..', 'data', 'classification-rules.json')
  const { rules } = JSON.parse(fs.readFileSync(file, 'utf8')) as { rules: any[] }

  const existing = await prisma.classificationRule.count()
  if (existing > 0) {
    console.log(`ClassificationRule already has ${existing} rules; nothing seeded (manage them in Admin → Classification Rules).`)
    return
  }
  const result = await prisma.classificationRule.createMany({
    data: rules.map((r, i) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      framework: r.framework,
      value: r.value,
      keywords: JSON.stringify(r.keywords || []),
      phrases: JSON.stringify(r.phrases || []),
      contextClues: JSON.stringify(r.contextClues || []),
      baseConfidence: r.baseConfidence,
      source: r.source || 'EXPERT',
      sortOrder: r.sortOrder ?? i,
    })),
  })
  console.log(`Seeded ${result.count} classification rules from data/classification-rules.json`)
}

seedRules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seeding error:', err)
    process.exit(1)
  })
