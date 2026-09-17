import { prisma } from '@/lib/database/prisma'
import DashboardClient from './DashboardClient'

export const revalidate = 0 // Disable cache to get fresh stats

export default async function DashboardPage() {
  const [totalEntries, grouped, genreGrouped, themeRows] = await Promise.all([
    prisma.literatureEntry.count(),
    prisma.literatureEntry.groupBy({
      by: ['communityLocation', 'municipality', 'province'],
      _count: { _all: true },
    }),
    prisma.literatureEntry.groupBy({
      by: ['genre'],
      _count: { _all: true },
    }),
    prisma.literatureEntry.findMany({ select: { themes: true } }),
  ])

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
    />
  )
}

