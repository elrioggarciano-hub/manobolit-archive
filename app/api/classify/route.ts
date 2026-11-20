import { NextRequest, NextResponse } from 'next/server'
import { classifyEntry, EntryLike } from '@/lib/classification/engine'
import { AlgorithmMode } from '@/lib/classification/hybrid'
import { getLatestSnapshot, getActiveModels } from '@/lib/classification/retrain'
import { ACTIVE_GENRES } from '@/lib/classification/trainingCorpus'
import { classifyWithGemini } from '@/lib/classification/geminiClassifier'
import { prisma } from '@/lib/database/prisma'

// POST /api/classify
// Primary classification endpoint powered by the Gemini LLM Semantic Engine
// with seamless fallback to the TypeScript Hybrid Architecture (NB + TF-IDF + Char N-gram + Rules).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      text,
      additionalContext,
      entryId,
      title,
      manoboTitle,
      englishTitle,
      transcription,
      translation,
      content,
      communityLocation,
      barangay,
      municipality,
      province,
      algorithmMode = 'HYBRID_ENSEMBLE',
    } = body

    const rawText = text || [transcription, translation, additionalContext].filter(Boolean).join(' ')
    if (!rawText && !transcription && !translation) {
      return NextResponse.json(
        { error: 'Transcription or translation fields are required for classification' },
        { status: 400 }
      )
    }

    const entryLike: EntryLike = {
      title,
      manoboTitle,
      englishTitle,
      content: content || '',
      transcription,
      translation,
      communityLocation,
      barangay,
      municipality,
      province,
    }

    // Load active snapshot provenance
    const snapshot = getLatestSnapshot()
    const activeModels = getActiveModels()

    // 1. Primary Classification Path: TypeScript Hybrid Engine (NB + TF-IDF + Char N-gram + Rules)
    const result = classifyEntry(
      entryLike,
      additionalContext || '',
      'ALL',
      algorithmMode as AlgorithmMode,
      activeModels
    )

    // 2. Optional Semantic LLM Reasoning: Gemini Flash (Option 1)
    let geminiResult = null
    try {
      geminiResult = await classifyWithGemini({
        title: title || manoboTitle || englishTitle,
        transcription: transcription || (additionalContext ? additionalContext : undefined),
        translation: translation || text,
        bisayaTranslation: body.bisayaTranslation,
        additionalContext,
      })
    } catch (llmErr: any) {
      console.warn('[ClassifyAPI] Gemini call bypassed; utilizing local hybrid ensemble:', llmErr.message)
    }

    const useGemini = Boolean(geminiResult)
    const finalPredictedGenre = geminiResult ? geminiResult.genre : result.genre.value
    const finalConfidence = geminiResult ? geminiResult.confidence : result.genre.confidence
    const finalSource = geminiResult ? 'GEMINI_LLM_SEMANTIC' : 'TS_HYBRID_ENSEMBLE'

    // 3. Compute individual model predictions and normalized per-model distributions
    const breakdown = result.algorithmicBreakdown
    const candidateGenres = ACTIVE_GENRES as readonly string[]

    // Classify individual component predictions to measure inter-model agreement
    const nbOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'NAIVE_BAYES_ML', activeModels)
    const tfidfOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'TF_IDF_VSM', activeModels)
    const charOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'CHAR_NGRAM', activeModels)
    const ruleOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'RULE_BASED', activeModels)

    const modelPredictions = {
      naiveBayes: nbOnly.genre.value,
      tfidfVsm: tfidfOnly.genre.value,
      charNgram: charOnly.genre.value,
      ruleBased: ruleOnly.genre.value,
      ...(geminiResult ? { geminiLLM: geminiResult.genre } : {}),
    }

    const predictedValue = finalPredictedGenre

    // Models that agreed with the predicted genre (excluding UNCLASSIFIED unless prediction is UNCLASSIFIED)
    const agreeingModels = Object.entries(modelPredictions)
      .filter(([_, pred]) => pred === predictedValue)
      .map(([name]) => name)

    const perModelScores = {
      naiveBayes: Object.fromEntries(nbOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      tfidfVsm: Object.fromEntries(tfidfOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      charNgram: Object.fromEntries(charOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      ruleBased: Object.fromEntries(ruleOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      hybrid: Object.fromEntries(result.genre.allScores.map(s => [s.genre, s.confidence])),
    }

    const isUnclassified = predictedValue === 'UNCLASSIFIED'

    const honestResponse = {
      genre: {
        value: predictedValue,
        confidence: finalConfidence,
        allScores: result.genre.allScores,
        predictionSource: finalSource,
        modelVersion: geminiResult ? `gemini-${geminiResult.model}` : snapshot.id,
        isUncertain: isUnclassified,
      },
      predictedGenre: predictedValue,
      confidence: finalConfidence,
      overallConfidence: finalConfidence,
      isUnclassified,
      isUncertain: isUnclassified,

      // Semantic LLM Explanations (Option 1)
      reasoning: geminiResult ? geminiResult.reasoning : undefined,
      culturalThemes: geminiResult && geminiResult.culturalThemes.length ? geminiResult.culturalThemes : undefined,
      linguisticObservations: geminiResult ? geminiResult.linguisticObservations : undefined,

      // Truthful Architecture Provenance
      algorithm: geminiResult
        ? `Gemini Semantic LLM (${geminiResult.model}) with Local Hybrid Ensemble Fallback`
        : 'ManoboLit TypeScript Hybrid Architecture (NB + TF-IDF VSM + Char N-Gram + Domain Rules)',
      algorithmMode,
      predictionSource: finalSource,
      modelVersion: geminiResult ? `gemini-${geminiResult.model}` : snapshot.id,
      modelSnapshotId: snapshot.id,
      trainedSamples: snapshot.trainedSamples,
      vocabularySize: snapshot.vocabularySize,
      lastRetrainTime: snapshot.createdAt,

      // Model Breakdown & Concordance
      perModelScores,
      modelAgreement: {
        agreeingModels,
        agreementCount: agreeingModels.length,
        totalModels: useGemini ? 5 : 4,
        predictions: modelPredictions,
      },

      // Linguistic & Domain Features
      themes: result.themes,
      location: result.location,
      rulesApplied: result.rulesApplied,
      ruleDetails: result.ruleDetails,
      algorithmicBreakdown: breakdown,
    }

    // If entryId provided, persist classification audit log to Prisma
    if (entryId) {
      try {
        await prisma.classification.create({
          data: {
            entryId,
            classifiedGenre: predictedValue,
            classifiedThemes: JSON.stringify(result.themes.map(t => t.value)),
            confidenceScore: result.genre.confidence,
            rulesApplied: JSON.stringify(result.rulesApplied),
            predictionSource: 'TS_HYBRID_ENSEMBLE',
            modelVersion: snapshot.id,
            probabilities: JSON.stringify(perModelScores.hybrid),
          },
        })
      } catch (dbErr: any) {
        console.warn('Could not persist classification to database:', dbErr.message)
      }
    }

    return NextResponse.json({ result: honestResponse })
  } catch (error) {
    console.error('POST /api/classify error:', error)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}
