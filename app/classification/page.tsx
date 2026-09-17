import { prisma } from '@/lib/database/prisma'
import ClassificationClient from '@/app/classification/ClassificationClient'

export const metadata = {
  title: 'Classification Frameworks - ManoboLit Archive',
  description: 'Methodology and taxonomies for classifying Agusan Manobo oral traditions and folk literature',
}

export const revalidate = 0 // Disable cache to get fresh entries

export default async function ClassificationPage() {
  const entries = await prisma.literatureEntry.findMany({
    orderBy: { title: 'asc' },
  })

  const parsed = entries.map(e => ({
    id: e.id,
    title: e.title,
    manoboTitle: e.manoboTitle,
    englishTitle: e.englishTitle,
    type: e.type,
    content: e.content,
    transcription: e.transcription || '',
    translation: e.translation || '',
    genre: e.genre,
    themes: JSON.parse(e.themes || '[]') as string[],
    culturalElements: JSON.parse(e.culturalElements || '[]') as string[],
  }))

  return <ClassificationClient dbEntries={parsed} />
}

