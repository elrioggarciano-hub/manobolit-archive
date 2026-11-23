import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/database/prisma'
import { getLatestSnapshot } from '@/lib/classification/retrain'
import { aggregateLocations } from '@/lib/geo'
import { getGazetteer } from '@/lib/geoStore'
import { getActiveTrainedModel } from '@/lib/classification/trainedModel'
import type { AccuracyMetrics } from './DashboardClient'
import DashboardClient from './DashboardClient'

// Edge ISR with 60s stale-while-revalidate for sub-50ms dashboard delivery
export const revalidate = 60

const getProcessedDashboardData = unstable_cache(
  async () => {
    const [genreGrouped, themeRows, allEntries] = await Promise.all([
      prisma.literatureEntry.groupBy({
        by: ['genre'],
        _count: { _all: true },
      }),
      prisma.literatureEntry.findMany({ select: { themes: true } }),
      prisma.literatureEntry.findMany({ orderBy: { createdAt: 'desc' } }),
    ])

    const totalEntries = allEntries.length

    // Report honest out-of-sample LOOCV metrics from the latest verified classifier snapshot
    const snapshot = getLatestSnapshot()
    let loocvReport: any = null
    try {
      loocvReport = JSON.parse(snapshot.loocvJson)
    } catch (e) { }

    // System accuracy comes only from real evaluations (no placeholder numbers):
    // 1) the active Colab model's LOOCV of the full system decision (rule base + ML, computed in the notebook),
    // 2) else the in-app LOOCV snapshot of the rule-based + learned ensemble,
    // 3) else the Colab model's ML-only LOOCV, clearly labelled; otherwise "not evaluated yet".
    const trained = await getActiveTrainedModel()
    const tm = trained?.artifact.metrics || {}
    const vocab = trained ? trained.artifact.vectorizers.reduce((n, v) => n + v.terms.length, 0) : undefined
    const inApp = loocvReport?.modes?.hybridEnsemble
    let accuracyMetrics: AccuracyMetrics | null = null
    if (trained && tm.ruleBasedPlusML) {
      const c = tm.ruleBasedPlusML
      accuracyMetrics = {
        accuracy: c.accuracy, precision: c.macroPrecision, recall: c.macroRecall, f1: c.macroF1,
        sampleSize: trained.artifact.trainedSamples, trainedSamples: trained.artifact.trainedSamples, vocabularySize: vocab,
        lastRetrainTime: trained.artifact.createdAt,
        method: 'Rule-based (Eugenio/Andress) + machine learning',
        coverage: c.coverageAtThreshold, answeredAccuracy: c.accuracyOnAnswered ?? undefined,
        rulesOnlyAccuracy: tm.rulesOnly?.accuracy, mlOnlyAccuracy: tm.accuracy,
      }
    } else if (inApp?.accuracy !== undefined) {
      accuracyMetrics = {
        accuracy: inApp.accuracy, precision: inApp.macroPrecision, recall: inApp.macroRecall, f1: inApp.macroF1,
        sampleSize: inApp.sampleSize, trainedSamples: snapshot.trainedSamples, vocabularySize: snapshot.vocabularySize,
        lastRetrainTime: snapshot.createdAt, method: 'Rule-based + in-app learned models',
      }
    } else if (trained && typeof tm.accuracy === 'number') {
      const per = tm.perClass?.['macro avg'] || {}
      accuracyMetrics = {
        accuracy: tm.accuracy, precision: per.precision ?? 0, recall: per.recall ?? 0, f1: tm.macroF1 ?? 0,
        sampleSize: trained.artifact.trainedSamples, trainedSamples: trained.artifact.trainedSamples, vocabularySize: vocab,
        lastRetrainTime: trained.artifact.createdAt,
        method: 'Machine-learning component only — re-run the Colab notebook to include the rule-based combination',
      }
    }

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

    // Counted per barangay (not per free-text sitio) with verified PhilAtlas coordinates
    const locationStats = aggregateLocations(allEntries, await getGazetteer())

    const topGenre = [...genreGrouped].sort((a, b) => b._count._all - a._count._all)[0]
    const mostCommonGenre = topGenre
      ? {
        genre: topGenre.genre,
        count: topGenre._count._all,
        percent: totalEntries > 0 ? Math.round((topGenre._count._all / totalEntries) * 100) : 0,
      }
      : null

    const genreDistribution = [...genreGrouped]
      .sort((a, b) => b._count._all - a._count._all)
      .map(g => ({
        genre: g.genre,
        count: g._count._all,
        percent: totalEntries > 0 ? Math.round((g._count._all / totalEntries) * 100) : 0,
      }))

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

    return {
      totalEntries,
      locationStats,
      mostCommonGenre,
      genreDistribution,
      mostFrequentTheme,
      themeFrequency,
      accuracyMetrics,
      exportRecords,
    }
  },
  ['dashboard-processed-v9'],
  // Refreshed when entries change (tag) and at least every 5 minutes, so model activations and other
  // database updates always reach the dashboard.
  { tags: ['entries'], revalidate: 300 }
)

export default async function DashboardPage() {
  const data = await getProcessedDashboardData()

  return (
    <DashboardClient
      totalEntries={data.totalEntries}
      locationStats={data.locationStats}
      mostCommonGenre={data.mostCommonGenre}
      genreDistribution={data.genreDistribution}
      mostFrequentTheme={data.mostFrequentTheme}
      themeFrequency={data.themeFrequency}
      accuracyMetrics={data.accuracyMetrics}
      exportRecords={data.exportRecords}
    />
  )
}

