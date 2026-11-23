// Seeds the BarangayLocation table from data/barangay-coordinates.json (verified PhilAtlas coordinates).
// Only inserts barangays that are not listed yet, so locations added or edited in the admin are kept.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/database/prisma'

async function seedLocations() {
  const file = path.join(__dirname, '..', 'data', 'barangay-coordinates.json')
  const { barangays } = JSON.parse(fs.readFileSync(file, 'utf8')) as { barangays: any[] }
  let created = 0
  for (const b of barangays) {
    const exists = await prisma.barangayLocation.findUnique({
      where: { barangay_municipality: { barangay: b.barangay, municipality: b.municipality } },
    })
    if (exists) continue
    await prisma.barangayLocation.create({
      data: {
        barangay: b.barangay,
        aliases: JSON.stringify(b.aliases || []),
        municipality: b.municipality,
        province: b.province,
        lat: b.lat,
        lng: b.lng,
        sourceUrl: b.url || null,
      },
    })
    created++
  }
  console.log(`Barangay locations inserted: ${created}, total: ${await prisma.barangayLocation.count()}`)
}

seedLocations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seeding error:', err)
    process.exit(1)
  })
