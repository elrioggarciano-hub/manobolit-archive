import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { computeAccuracyMetrics } from '@/lib/classification'
import DashboardClient from './DashboardClient'

// The page still renders per request (so a build never depends on a live DB
// connection), but the query results themselves are cached in Next's Data
// Cache and reused across visits until an admin create/update/delete calls
// revalidateTag('entries') — instead of hitting Supabase on every click.
export const dynamic = 'force-dynamic'

const getDashboardData = unstable_cache(
  async () => Promise.all([
    prisma.literatureEntry.groupBy({
      by: ['communityLocation', 'municipality', 'province'],
      _count: { _all: true },
    }),
    prisma.literatureEntry.groupBy({
      by: ['genre'],
      _count: { _all: true },
    }),
    prisma.literatureEntry.findMany({ select: { themes: true } }),
    // Full records power three things below: the total entry count,
    // the accuracy metrics (re-running the classifier against each entry's
    // own curated genre), and the "export cultural heritage records" download.
    // (Deriving the count from this array instead of a separate
    // prisma.literatureEntry.count() call sidesteps an unstable_cache quirk
    // that was silently zeroing out a lone cached primitive number while the
    // cached arrays came through intact.)
    prisma.literatureEntry.findMany({ orderBy: { createdAt: 'desc' } }),
  ]),
  ['dashboard-data-v3'],
  { tags: ['entries'] }
)

export default async function DashboardPage() {
  const [grouped, genreGrouped, themeRows, allEntries] = await getDashboardData()
  const totalEntries = allEntries.length

  // Evaluate the rule-based classifier against the archive's own curated
  // genre labels, rather than showing a fixed placeholder accuracy figure.
  const accuracyMetrics = computeAccuracyMetrics(
    allEntries.map(e => ({ content: e.content, transcription: e.transcription, genre: e.genre }))
  )

  const exportRecords = allEntries.map(e => ({
    id: e.id,
    title: e.title,
    manoboTitle: e.manoboTitle || '',
    englishTitle: e.englishTitle || '',
    type: e.type,
    genre: e.genre,
    themes: (JSON.parse(e.themes || '[]') as string[]).join('; '),
    culturalElements: (JSON.parse(e.culturalElements || '[]') as string[]).join('; '),
    transcription: e.transcription || '',
    translation: e.translation || '',
    bisayaTranslation: e.bisayaTranslation || '',
    source: e.source,
    yearCollected: e.yearCollected ?? '',
    narrator: e.narrator || '',
    communityLocation: e.communityLocation,
    province: e.province,
    municipality: e.municipality,
    barangay: e.barangay || '',
    audioFile: e.audioFile || '',
  }))

  const locationStats = grouped
    .map(g => ({
      location: g.communityLocation,
      municipality: g.municipality,
      province: g.province,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count)

  const topGenre = [...genreGrouped].sort((a, b) => b._count._all - a._count._all)[0]
  const mostCommonGenre = topGenre
    ? {
        genre: topGenre.genre,
        count: topGenre._count._all,
        percent: totalEntries > 0 ? Math.round((topGenre._count._all / totalEntries) * 100) : 0,
      }
    : null

  // `themes` is stored as a JSON-stringified array per entry, so tally it in JS
  // rather than via a SQL group-by.
  const themeCounts: Record<string, number> = {}
  for (const row of themeRows) {
    const themes = JSON.parse(row.themes || '[]') as string[]
    for (const theme of themes) themeCounts[theme] = (themeCounts[theme] || 0) + 1
  }
  const sortedThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])
  const topThemeEntry = sortedThemes[0]
  const mostFrequentTheme = topThemeEntry ? { theme: topThemeEntry[0], count: topThemeEntry[1] } : null

  const maxThemeCount = sortedThemes.length > 0 ? sortedThemes[0][1] : 1
  const themeFrequency = sortedThemes.slice(0, 4).map(([theme, count]) => ({
    theme,
    count,
    percent: Math.round((count / maxThemeCount) * 100),
  }))

  return (
    <DashboardClient
      totalEntries={totalEntries}
      locationStats={locationStats}
      mostCommonGenre={mostCommonGenre}
      mostFrequentTheme={mostFrequentTheme}
      themeFrequency={themeFrequency}
      accuracyMetrics={accuracyMetrics}
      exportRecords={exportRecords}
    />
  )
}

