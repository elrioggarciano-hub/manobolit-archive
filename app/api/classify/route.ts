import { NextRequest, NextResponse } from 'next/server'
import { predictWithML } from '@/lib/classification/mlClient'
import { classifyEntry } from '@/lib/classification'
import { prisma } from '@/lib/database/prisma'

// POST /api/classify
// Body: { entryId?: string, text?: string, title?: string, transcription?: string, translation?: string, content?: string, additionalContext?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, additionalContext, entryId, title, transcription, translation, content } = body

    const rawText = text || [title, transcription, translation, content, additionalContext].filter(Boolean).join(' ')
    if (!rawText) {
      return NextResponse.json({ error: 'Text or entry content fields are required' }, { status: 400 })
    }

    // Execute real ML prediction with graceful rule fallback
    const mlResult = await predictWithML(body)
    const ruleFallback = classifyEntry(rawText, additionalContext || '')

    const combinedResult = {
      genre: {
        value: mlResult.predictedGenre,
        confidence: mlResult.confidence,
        predictionSource: mlResult.predictionSource,
        modelVersion: mlResult.modelVersion,
        isUncertain: mlResult.isUncertain,
        allScores: Object.entries(mlResult.probabilities).map(([g, c]) => ({ genre: g, confidence: c })),
      },
      themes: ruleFallback.themes,
      location: ruleFallback.location,
      overallConfidence: mlResult.confidence,
      predictionSource: mlResult.predictionSource,
      modelVersion: mlResult.modelVersion,
      isUncertain: mlResult.isUncertain,
      topFeatures: mlResult.topFeatures,
      algorithm: mlResult.algorithm,
      rulesApplied: ruleFallback.rulesApplied,
      ruleDetails: ruleFallback.ruleDetails,
    }

    // If entryId provided, persist classification result
    if (entryId) {
      await prisma.classification.create({
        data: {
          entryId,
          classifiedGenre: mlResult.predictedGenre,
          classifiedThemes: JSON.stringify(ruleFallback.themes.map(t => t.value)),
          confidenceScore: mlResult.confidence,
          rulesApplied: JSON.stringify(ruleFallback.rulesApplied),
          predictionSource: mlResult.predictionSource,
          modelVersion: mlResult.modelVersion,
          probabilities: JSON.stringify(mlResult.probabilities),
        },
      })
    }

    return NextResponse.json({ result: combinedResult })
  } catch (error) {
    console.error('POST /api/classify error:', error)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}

