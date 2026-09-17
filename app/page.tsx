import { prisma } from '@/lib/database/prisma'
import ArchiveClient from '@/app/ArchiveClient'

export const revalidate = 0 // Disable cache to get fresh entries

export default async function Home() {
  const entries = await prisma.literatureEntry.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const parsed = entries.map(e => ({
    ...e,
    themes: JSON.parse(e.themes || '[]') as string[],
    culturalElements: JSON.parse(e.culturalElements || '[]') as string[],
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }))

  return <ArchiveClient entries={parsed} />
}
