const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const entries = await prisma.literatureEntry.findMany({
    include: { classifications: true }
  })
  console.log('Total entries in DB:', entries.length)
  for (const e of entries) {
    const c = e.classifications[0]
    console.log(`${e.title} (${e.genre}) -> confidenceScore: ${c ? c.confidenceScore : 'NONE'}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
