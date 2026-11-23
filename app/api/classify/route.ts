import { NextRequest, NextResponse } from 'next/server'
import { classifyEntry, EntryLike } from '@/lib/classification/engine'
import { AlgorithmMode } from '@/lib/classification/hybrid'
import { getLatestSnapshot, ensureActiveModels } from '@/lib/classification/retrain'
import { classifyWithGemini } from '@/lib/classification/geminiClassifier'
import { prisma } from '@/lib/database/prisma'
import { getActiveTrainedModel, predictWithCompiled } from '@/lib/classification/trainedModel'
import { blendRulesWithModel } from '@/lib/classification/ruleMlBlend'
import { ruleIndex } from '@/lib/classification/rules'
import { explainClassification, toExplainLang, ExplanationEvidence } from '@/lib/classification/explain'
import { getLexicon } from '@/lib/translation/lexiconStore'
import { dialectVariantGroups } from '@/lib/translation/lexicon'

// POST /api/classify
// Rule-based genre/theme classification (Eugenio 1993 / Andress 1985 rule base stored in the database)
// combined with machine learning: rule scores are blended with the Colab-trained model's probabilities
// (or with the in-app learned models when no Colab model is uploaded). Gemini, if configured, is advisory only.
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
    const lexicon = await getLexicon()
    const activeModels = { ...(await ensureActiveModels()), dialectVariants: dialectVariantGroups(lexicon) }
    const snapshot = getLatestSnapshot()

    // 1a. Primary local path: the Colab-trained model (scikit-learn artifact uploaded by an admin)
    const trainedModel = await getActiveTrainedModel()
    const trained = trainedModel
      ? predictWithCompiled(trainedModel, {
          transcription: transcription || additionalContext || '',
          translation: translation || text || '',
        })
      : null

    // 1b. Rule-based + ML ensemble computed in-app (rules 50% + NB/TF-IDF/Char N-gram/k-NN 50%);
    //     the final answer when no Colab model has been uploaded.
    const result = classifyEntry(
      entryLike,
      additionalContext || '',
      'ALL',
      algorithmMode as AlgorithmMode,
      activeModels
    )

    // 1c. Rule-based classification (Eugenio 1993 / Andress 1985 rule base from the database)
    const ruleOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'RULE_BASED', activeModels)

    // Final local decision: rule scores combined with the Colab-trained model's probabilities
    const blended = trained
      ? blendRulesWithModel(ruleOnly.genre.allScores, trained.probabilities, trainedModel!.artifact.unclassifiedThreshold)
      : null

    // 2. Optional Gemini advisory opinion (runs in parallel; never overrides the engine)
    const geminiPromise = classifyWithGemini({
      title: title || manoboTitle || englishTitle,
      transcription: transcription || (additionalContext ? additionalContext : undefined),
      translation: translation || text,
      bisayaTranslation: body.bisayaTranslation,
      additionalContext,
    }).catch((llmErr: any) => {
      console.warn('[ClassifyAPI] Gemini advisory skipped:', llmErr?.message)
      return null
    })

    // The system's own rule-based + ML engine decides; Gemini (if configured) is advisory only —
    // its opinion and reasoning are returned for comparison but do not override the engine.
    const finalPredictedGenre = blended ? blended.genre : result.genre.value
    const finalConfidence = blended ? blended.confidence : result.genre.confidence
    const finalSource = blended ? 'RULES_PLUS_COLAB_MODEL' : 'RULES_PLUS_LEARNED_ENSEMBLE'
    const finalVersion = trained ? trained.modelVersion : snapshot.id

    // 3a. Explanation of the system's own decision, from the evidence it actually produced (XAI)
    const distribution = blended ? blended.distribution : result.genre.allScores
    const finalRule = activeModels.rules.genre.find(r => r.value === finalPredictedGenre)
    const knnForExplain = classifyEntry(entryLike, additionalContext || '', 'ALL', 'KNN_MEMORY', activeModels).algorithmicBreakdown?.knn
    // When explaining an archive entry, never cite the entry itself as "similar"
    const selfId: string | undefined = body.explainEntryId || entryId
    const neighborIds = (knnForExplain?.neighbors || [])
      .filter(n => n.genre === finalPredictedGenre && n.id.startsWith('verified-'))
      .map(n => n.id.slice('verified-'.length))
      .filter(id => id !== selfId)
    const [definitions, neighborRows] = await Promise.all([
      prisma.categoryDefinition.findMany({ where: { type: 'GENRE' }, select: { code: true, title: true, description: true } }).catch(() => []),
      neighborIds.length
        ? prisma.literatureEntry.findMany({ where: { id: { in: neighborIds } }, select: { id: true, title: true, genre: true } }).catch(() => [])
        : Promise.resolve([] as { id: string; title: string; genre: string }[]),
    ])
    const def = (code: string) => definitions.find(d => d.code === code)
    const label = (code: string) => def(code)?.title || code.charAt(0) + code.slice(1).toLowerCase()
    const second = distribution.find(d => d.genre !== finalPredictedGenre)
    const evidence: ExplanationEvidence = {
      genre: finalPredictedGenre,
      genreLabel: finalPredictedGenre === 'UNCLASSIFIED' ? 'Unclassified' : label(finalPredictedGenre),
      confidence: finalConfidence,
      runnerUp: second ? { genre: second.genre, label: label(second.genre), confidence: second.confidence } : undefined,
      definition: finalPredictedGenre === 'UNCLASSIFIED' ? undefined : def(finalPredictedGenre)?.description,
      ruleName: finalRule?.name,
      ruleTerms: finalRule ? (ruleOnly.ruleDetails[finalRule.id]?.matched || []).map(m => m.term) : [],
      learnedWords: (result.algorithmicBreakdown?.naiveBayes?.featuresByGenre?.[finalPredictedGenre] || []).map(f => f.word),
      similarEntries: neighborIds
        .map(id => neighborRows.find(r => r.id === id))
        .filter((r): r is { id: string; title: string; genre: string } => !!r && r.title !== title)
        .map(r => ({ title: r.title, genre: r.genre })),
      themes: result.themes.map(t => t.value),
      method: blended
        ? 'rule-based classification (Eugenio 1993 / Andress 1985) combined with a machine-learning model trained on verified entries'
        : 'rule-based classification (Eugenio 1993 / Andress 1985) combined with learned models',
      usesTrainedModel: Boolean(blended),
    }
    const [geminiResult, explanation] = await Promise.all([
      geminiPromise,
      explainClassification(evidence, toExplainLang(body.lang)),
    ])

    // 3. Compute individual model predictions and normalized per-model distributions
    const breakdown = result.algorithmicBreakdown
    const candidateGenres = activeModels.genres

    // Classify individual component predictions to measure inter-model agreement
    const nbOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'NAIVE_BAYES_ML', activeModels)
    const tfidfOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'TF_IDF_VSM', activeModels)
    const charOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'CHAR_NGRAM', activeModels)
    const knnOnly = classifyEntry(entryLike, additionalContext || '', 'ALL', 'KNN_MEMORY', activeModels)

    const modelPredictions = {
      ...(trained ? { trainedModel: trained.genre } : {}),
      naiveBayes: nbOnly.genre.value,
      tfidfVsm: tfidfOnly.genre.value,
      charNgram: charOnly.genre.value,
      ruleBased: ruleOnly.genre.value,
      knnMemory: knnOnly.genre.value,
      ...(geminiResult ? { geminiAdvisory: geminiResult.genre } : {}),
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
        allScores: blended ? blended.distribution : result.genre.allScores,
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
      reasoning: geminiResult ? `Gemini advisory opinion (${geminiResult.genre}, not used for the final decision): ${geminiResult.reasoning}` : undefined,
      culturalThemes: geminiResult && geminiResult.culturalThemes.length ? geminiResult.culturalThemes : undefined,
      linguisticObservations: geminiResult ? geminiResult.linguisticObservations : undefined,

      // Truthful Architecture Provenance
      algorithm: trained
        ? `Rule-based classification (Eugenio 1993 / Andress 1985) + ${trainedModel!.artifact.algorithm} trained in Google Colab on human-verified entries`
        : 'Rule-based classification (Eugenio 1993 / Andress 1985) + in-app learned models (Naive Bayes, TF-IDF, Char N-gram, k-NN)',
      ruleWeight: 0.5,
      // Gemini opinion (advisory only, never overrides the engine)
      geminiAdvisory: geminiResult ? { genre: geminiResult.genre, confidence: geminiResult.confidence } : undefined,
      ruleNames: ruleIndex(activeModels.rules),
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

      // Plain-language explanation of the decision (Gemini narrates the evidence; template if unavailable)
      explanation,

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
