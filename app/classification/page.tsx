import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import ClassificationClient from '@/app/classification/ClassificationClient'
import { loadRuleSet } from '@/lib/classification/ruleStore'
import { loadTrainingCorpus } from '@/lib/classification/corpusStore'
import { computeComparativeMetrics } from '@/lib/classification/metrics'

export const metadata = {
  title: 'Classification Frameworks - ManoboLit Archive',
  description: 'Methodology and taxonomies for classifying Agusan Manobo oral traditions and folk literature',
}

// The page still renders per request (so a build never depends on a live DB
// connection), but the query result itself is cached in Next's Data Cache and
// reused across visits until an admin create/update/delete calls
// revalidateTag('entries') — instead of hitting Supabase on every click.
export const dynamic = 'force-dynamic'

const getCachedClassificationEntries = unstable_cache(
  async () => {
    const entries = await prisma.literatureEntry.findMany({ orderBy: { title: 'asc' } })
    return entries.map(e => ({
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
      communityLocation: e.communityLocation || '',
      municipality: e.municipality || '',
      barangay: e.barangay || '',
    }))
  },
  ['classification-entries-v6'],
  { tags: ['entries'] }
)

// Cheap fingerprint of the rule base and training corpus tables, used as part of the benchmark's cache key
// so an admin edit to either one recomputes the benchmark (entry changes bust it via the 'entries' tag).
async function benchmarkDataFingerprint(): Promise<string> {
  try {
    const [rules, corpus] = await Promise.all([
      prisma.classificationRule.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      prisma.trainingCorpusDocument.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
    ])
    return `rules:${rules._count._all}:${rules._max.updatedAt?.getTime() ?? 0}|corpus:${corpus._count._all}:${corpus._max.updatedAt?.getTime() ?? 0}`
  } catch {
    return 'db-unavailable'
  }
}

// LOOCV benchmark of every model on the archive entries, using the database training corpus and rule base
// (the same data the live classifier uses), computed on the server instead of from bundled seed files.
const getCachedComparativeReport = unstable_cache(
  async (_dataFingerprint: string) => {
    const [entries, rules, corpus] = await Promise.all([
      getCachedClassificationEntries(),
      loadRuleSet(),
      loadTrainingCorpus(),
    ])
    return computeComparativeMetrics(
      entries.map(e => ({
        title: e.title,
        content: e.content,
        transcription: e.transcription,
        translation: e.translation,
        genre: e.genre,
      })),
      { baseCorpus: corpus.docs, rules: rules.ruleSet }
    )
  },
  ['classification-comparison-v1'],
  { tags: ['entries'] }
)

export default async function ClassificationPage() {
  const [parsed, comparativeReport] = await Promise.all([
    getCachedClassificationEntries(),
    benchmarkDataFingerprint().then(getCachedComparativeReport),
  ])
  return <ClassificationClient dbEntries={parsed} comparativeReport={comparativeReport} />
}

