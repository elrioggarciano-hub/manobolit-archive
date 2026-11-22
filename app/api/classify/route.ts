import { NextRequest, NextResponse } from 'next/server'
import { classifyEntry, EntryLike } from '@/lib/classification/engine'
import { AlgorithmMode } from '@/lib/classification/hybrid'
import { getLatestSnapshot, ensureActiveModels } from '@/lib/classification/retrain'
import { ACTIVE_GENRES } from '@/lib/classification/trainingCorpus'
import { classifyWithGemini } from '@/lib/classification/geminiClassifier'
import { prisma } from '@/lib/database/prisma'
import { getActiveTrainedModel, predictWithCompiled } from '@/lib/classification/trainedModel'

// POST /api/classify
// Genre classification. Local prediction comes from the Colab-trained model (if uploaded), otherwise from the
// in-app learned ensemble. Gemini, when configured, still overrides the final answer. Rules are baseline-only.
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

    // Load models trained on base corpus + all human-verified entries (rebuilt after cold start / new verifications)
    const activeModels = await ensureActiveModels()
    const snapshot = getLatestSnapshot()

    // 1a. Primary local path: the Colab-trained model (scikit-learn artifact uploaded by an admin)
    const trainedModel = await getActiveTrainedModel()
    const trained = trainedModel
      ? predictWithCompiled(trainedModel, {
          transcription: transcription || additionalContext || '',
          translation: translation || text || '',
        })
      : null

    // 1b. In-app learned ensemble (NB + TF-IDF + Char N-gram + k-NN); used when no trained model is uploaded.
    // Domain rules are computed only as a comparison baseline and never decide the genre.
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

    const localGenre = trained ? trained.genre : result.genre.value
    const localConfidence = trained ? trained.confidence : result.genre.confidence
    const localSource = trained ? 'COLAB_TRAINED_MODEL' : 'TS_LEARNED_ENSEMBLE'
    const localVersion = trained ? trained.modelVersion : snapshot.id

    const finalPredictedGenre = geminiResult ? geminiResult.genre : localGenre
    const finalConfidence = geminiResult ? geminiResult.confidence : localConfidence
    const finalSource = geminiResult ? 'NEURAL_SEMANTIC_MODEL' : localSource
    const finalVersion = geminiResult ? 'v2.4-neural' : localVersion

    // 3. Compute individual model predictions and normalized per-model distributions
    const breakdown = result.algorithmicBreakdown
    const candidateGenres = ACTIVE_GENRES as readonly string[]

    // Classify individual component predictions to measure inter-model agreement
    const nbOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'NAIVE_BAYES_ML', activeModels)
    const tfidfOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'TF_IDF_VSM', activeModels)
    const charOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'CHAR_NGRAM', activeModels)
    const ruleOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'RULE_BASED', activeModels)
    const knnOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'KNN_MEMORY', activeModels)

    const modelPredictions = {
      ...(trained ? { trainedModel: trained.genre } : {}),
      naiveBayes: nbOnly.genre.value,
      tfidfVsm: tfidfOnly.genre.value,
      charNgram: charOnly.genre.value,
      ruleBased: ruleOnly.genre.value,
      knnMemory: knnOnly.genre.value,
      ...(geminiResult ? { neuralSemantic: geminiResult.genre } : {}),
    }

    const predictedValue = finalPredictedGenre

    // Models that agreed with the predicted genre (excluding UNCLASSIFIED unless prediction is UNCLASSIFIED)
    const agreeingModels = Object.entries(modelPredictions)
      .filter(([_, pred]) => pred === predictedValue)
      .map(([name]) => name)

    const perModelScores = {
      ...(trained ? { trainedModel: Object.fromEntries(trained.probabilities.map(p => [p.genre, Math.round(p.probability * 1000) / 1000])) } : {}),
      naiveBayes: Object.fromEntries(nbOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      tfidfVsm: Object.fromEntries(tfidfOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      charNgram: Object.fromEntries(charOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      ruleBased: Object.fromEntries(ruleOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      knnMemory: Object.fromEntries(knnOnly.genre.allScores.map(s => [s.genre, s.confidence])),
      hybrid: Object.fromEntries(result.genre.allScores.map(s => [s.genre, s.confidence])),
    }

    const isUnclassified = predictedValue === 'UNCLASSIFIED'

    const honestResponse = {
      genre: {
        value: predictedValue,
        confidence: finalConfidence,
        allScores: trained
          ? [...trained.probabilities]
              .sort((a, b) => b.probability - a.probability)
              .map(p => ({ genre: p.genre, confidence: Math.round(p.probability * 1000) / 1000 }))
          : result.genre.allScores,
        predictionSource: finalSource,
        modelVersion: finalVersion,
        isUncertain: isUnclassified,
      },
      predictedGenre: predictedValue,
      confidence: finalConfidence,
      overallConfidence: finalConfidence,
      isUnclassified,
      isUncertain: isUnclassified,

      // Semantic Reasoning Explanations
      reasoning: geminiResult ? geminiResult.reasoning : undefined,
      culturalThemes: geminiResult && geminiResult.culturalThemes.length ? geminiResult.culturalThemes : undefined,
      linguisticObservations: geminiResult ? geminiResult.linguisticObservations : undefined,

      // Truthful Architecture Provenance
      algorithm: geminiResult
        ? 'Gemini LLM semantic classification (local trained model shown for comparison)'
        : trained
        ? trainedModel!.artifact.algorithm + ' — trained in Google Colab on human-verified entries'
        : 'In-app learned ensemble (Naive Bayes + TF-IDF + Char N-gram + k-NN)',
      algorithmMode,
      predictionSource: finalSource,
      modelVersion: finalVersion,
      modelSnapshotId: snapshot.id,
      trainedSamples: trained ? trainedModel!.artifact.trainedSamples : snapshot.trainedSamples,
      trainedModelMetrics: trained ? trainedModel!.artifact.metrics?.accuracy : undefined,
      vocabularySize: snapshot.vocabularySize,
      lastRetrainTime: snapshot.createdAt,

      // Model Breakdown & Concordance
      perModelScores,
      modelAgreement: {
        agreeingModels,
        agreementCount: agreeingModels.length,
        totalModels: Object.keys(modelPredictions).length,
        predictions: modelPredictions,
      },

      // Nearest human-verified exemplars (explains the k-NN vote)
      nearestVerifiedExemplars: knnOnly.algorithmicBreakdown?.knn?.neighbors ?? [],

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
            confidenceScore: finalConfidence,
            rulesApplied: JSON.stringify(result.rulesApplied),
            predictionSource: finalSource,
            modelVersion: finalVersion,
            probabilities: JSON.stringify(perModelScores.trainedModel ?? perModelScores.hybrid),
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
