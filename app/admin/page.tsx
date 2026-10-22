import { prisma } from '@/lib/database/prisma'
import AdminClient from './AdminClient'

// Auth-gated by middleware on every request; must not be statically prerendered at build time.
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const entries = await prisma.literatureEntry.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      genre: true,
      municipality: true,
      province: true,
      yearCollected: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return <AdminClient initialEntries={entries} />
}
