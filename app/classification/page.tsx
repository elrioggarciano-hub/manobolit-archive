import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import ClassificationClient from '@/app/classification/ClassificationClient'

export const metadata = {
  title: 'Classification Frameworks - ManoboLit Archive',
  description: 'Methodology and taxonomies for classifying Agusan Manobo oral traditions and folk literature',
}

// The page still renders per request (so a build never depends on a live DB
// connection), but the query result itself is cached in Next's Data Cache and
// reused across visits until an admin create/update/delete calls
// revalidateTag('entries') — instead of hitting Supabase on every click.
export const dynamic = 'force-dynamic'

const getEntriesSortedByTitle = unstable_cache(
  async () => prisma.literatureEntry.findMany({ orderBy: { title: 'asc' } }),
  ['classification-entries'],
  { tags: ['entries'] }
)

export default async function ClassificationPage() {
  const entries = await getEntriesSortedByTitle()

  const parsed = entries.map(e => ({
    id: e.id,
    title: e.title,
    manoboTitle: e.manoboTitle,
    englishTitle: e.englishTitle,
    type: e.type,
    content: e.content,
    transcription: e.transcription || '',
    translation: e.translation || '',
    bisayaTranslation: e.bisayaTranslation || '',
    genre: e.genre,
    themes: JSON.parse(e.themes || '[]') as string[],
    culturalElements: JSON.parse(e.culturalElements || '[]') as string[],
  }))

  return <ClassificationClient dbEntries={parsed} />
}

