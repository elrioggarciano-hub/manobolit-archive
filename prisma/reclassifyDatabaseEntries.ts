import 'dotenv/config'
import { prisma } from '../lib/database/prisma'
import { classifyWithGemini } from '../lib/classification/geminiClassifier'
import { predictWithML } from '../lib/classification/mlClient'

async function reclassifyAll() {
  console.log('--- Reclassifying all Archive Literature Entries in Supabase PostgreSQL ---')
  const entries = await prisma.literatureEntry.findMany({
    select: {
      id: true,
      title: true,
      transcription: true,
      translation: true,
      content: true,
      genre: true,
      communityLocation: true,
    },
  })

  console.log(`Found ${entries.length} literature entries to process.`)

  let geminiSuccessCount = 0
  let hybridSuccessCount = 0

  for (const entry of entries) {
    console.log(`\nProcessing: "${entry.title}" (${entry.id})...`)

    let predictedGenre = entry.genre
    let confidence = 0.90
    let predictionSource = 'GEMINI_LLM_SEMANTIC'
    let modelVersion = 'gemini-3.5-flash-lite'
    let themes: string[] = []

    try {
      const gemini = await classifyWithGemini({
        transcription: entry.transcription || undefined,
        translation: entry.translation || entry.content || undefined,
      })

      if (gemini && gemini.genre !== 'UNCLASSIFIED') {
        predictedGenre = gemini.genre
        confidence = gemini.confidence
        predictionSource = 'GEMINI_LLM_SEMANTIC'
        modelVersion = gemini.model
        themes = gemini.culturalThemes || []
        geminiSuccessCount++
        console.log(`  -> Classified via Gemini LLM: ${predictedGenre} (${(confidence * 100).toFixed(1)}%)`)
      } else {
        throw new Error('Gemini unclassified or unavailable')
      }
    } catch {
      // Fallback to TS Supervised ML Hybrid Engine
      const ml = await predictWithML({
        title: entry.title,
        content: entry.content,
        transcription: entry.transcription,
        translation: entry.translation,
        communityLocation: entry.communityLocation,
      })
      predictedGenre = ml.predictedGenre !== 'UNCLASSIFIED' ? ml.predictedGenre : entry.genre
      confidence = ml.confidence
      predictionSource = 'TYPESCRIPT_HYBRID_ENGINE'
      modelVersion = ml.modelVersion
      hybridSuccessCount++
      console.log(`  -> Classified via ML Hybrid: ${predictedGenre} (${(confidence * 100).toFixed(1)}%)`)
    }

    // Upsert or update Classification record
    const existing = await prisma.classification.findFirst({
      where: { entryId: entry.id },
      orderBy: { timestamp: 'desc' },
    })

    if (existing) {
      await prisma.classification.update({
        where: { id: existing.id },
        data: {
          classifiedGenre: predictedGenre,
          classifiedThemes: JSON.stringify(themes.length > 0 ? themes : ['ORAL_TRADITION', 'AGUSAN_MANOBO']),
          confidenceScore: confidence,
          rulesApplied: JSON.stringify([]), // Eradicate rule strings
          predictionSource,
          modelVersion,
          probabilities: JSON.stringify({ [predictedGenre]: confidence }),
        },
      })
    } else {
      await prisma.classification.create({
        data: {
          entryId: entry.id,
          classifiedGenre: predictedGenre,
          classifiedThemes: JSON.stringify(themes.length > 0 ? themes : ['ORAL_TRADITION', 'AGUSAN_MANOBO']),
          confidenceScore: confidence,
          rulesApplied: JSON.stringify([]),
          predictionSource,
          modelVersion,
          probabilities: JSON.stringify({ [predictedGenre]: confidence }),
        },
      })
    }
  }

  console.log('\n--- Reclassification Summary ---')
  console.log(`Total entries: ${entries.length}`)
  console.log(`Classified by Gemini LLM Semantic Engine: ${geminiSuccessCount}`)
  console.log(`Classified by TS Supervised ML Hybrid: ${hybridSuccessCount}`)

  const sourcesInDb = await prisma.classification.groupBy({
    by: ['predictionSource'],
    _count: { id: true },
  })
  console.log('\nDatabase predictionSource audit:', sourcesInDb)

  process.exit(0)
}

reclassifyAll().catch((err) => {
  console.error('Reclassification failed:', err)
  process.exit(1)
})

