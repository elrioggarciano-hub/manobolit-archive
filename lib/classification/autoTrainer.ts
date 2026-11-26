// Automatic retraining of the genre model (the machine-learning half of the rule-based + ML decision).
// Runs whenever the human-verified dataset changes (an entry is verified/corrected/marked uncertain,
// a verified entry is edited or deleted, or verified records are imported):
//   1. load the verified dataset (same records the Colab notebook would download)
//   2. skip if it is identical to what the active model was trained on (dataset fingerprint)
//   3. train + evaluate with LOOCV (genreTrainer.ts — same algorithm as the notebook)
//   4. parity-check the artifact and promote it only if it beats the majority-class baseline
//   5. store it in MLModelRegistry as ACTIVE (previous model ARCHIVED, still re-activatable)

import crypto from 'crypto'
import { revalidateTag } from 'next/cache'
import { prisma } from '../database/prisma'
import { loadVerifiedDataset } from './verifiedDataset'
import { trainGenreModel, usableRows, DEFAULT_TRAINER_CONFIG, TrainerConfig, TrainingRow } from './genreTrainer'
import { compileArtifact, runParityTests, getActiveTrainedModel, invalidateTrainedModelCache } from './trainedModel'
import { RULE_WEIGHT } from './hybrid'

export type RetrainTrigger = 'AUTO' | 'MANUAL'

export interface AutoRetrainResult {
  status: 'ACTIVATED' | 'SKIPPED_UNCHANGED' | 'REJECTED_INSUFFICIENT_DATA' | 'REJECTED_INFERIOR' | 'FAILED'
  message: string
  version?: string
  trainedSamples?: number
  accuracy?: number
  combinedAccuracy?: number
  skippedGenres?: string[]
  durationMs?: number
}

let inflight: Promise<AutoRetrainResult> | null = null

/** Identifies the training data: which verified entries, their labels, content and rule scores. */
function fingerprintOf(rows: (TrainingRow & { contentHash?: string })[], cfg: TrainerConfig): string {
  const canonical = [...rows]
    .sort((a, b) => (a.id || '').localeCompare(b.id || ''))
    .map(r => [
      r.id,
      r.contentHash,
      r.genre,
      Object.entries(r.ruleScores || {}).sort().map(([g, v]) => [g, Math.round((v as number) * 10000)]),
    ])
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ canonical, preprocessing: cfg.preprocessing, C: cfg.C, ngramRange: cfg.ngramRange }))
    .digest('hex')
}

async function logJob(data: Record<string, any>, id?: string): Promise<string | undefined> {
  // MLTrainingJob is an audit log only; retraining must not fail if the table is unavailable.
  try {
    if (id) {
      await prisma.mLTrainingJob.update({ where: { id }, data })
      return id
    }
    return (await prisma.mLTrainingJob.create({ data: data as any })).id
  } catch (err: any) {
    console.warn('[AutoRetrain] Could not write training job log:', err.message)
    return id
  }
}

export function autoRetrainGenreModel(trigger: RetrainTrigger = 'AUTO', { force = false } = {}): Promise<AutoRetrainResult> {
  if (inflight) return inflight
  inflight = run(trigger, force).finally(() => {
    inflight = null
  })
  return inflight
}

async function run(trigger: RetrainTrigger, force: boolean): Promise<AutoRetrainResult> {
  const started = Date.now()
  let jobId: string | undefined
  try {
    const { dataset } = await loadVerifiedDataset()
    const active = await getActiveTrainedModel()

    // Keep the configuration of the active model (set in the notebook), defaults otherwise
    const cfg: TrainerConfig = {
      ...DEFAULT_TRAINER_CONFIG,
      ruleWeight: RULE_WEIGHT,
      ...(active
        ? { preprocessing: active.artifact.preprocessing, unclassifiedThreshold: active.artifact.unclassifiedThreshold }
        : {}),
    }

    const rows = dataset.map(r => ({
      id: r.id,
      title: r.title,
      transcription: r.transcription,
      translation: r.translation,
      genre: r.verifiedGenre,
      ruleScores: r.ruleScores,
      contentHash: r.contentHash,
    }))
    const { rows: usable, skippedGenres } = usableRows(rows, cfg.minExamplesPerGenre)
    const genres = new Set(usable.map(r => r.genre))
    if (genres.size < 2) {
      return {
        status: 'REJECTED_INSUFFICIENT_DATA',
        message: `Not retrained: at least 2 genres need ${cfg.minExamplesPerGenre}+ verified entries each (have ${usable.length} usable entries).`,
        skippedGenres,
      }
    }

    const fingerprint = fingerprintOf(rows, cfg)
    if (!force && (active?.artifact as any)?.datasetFingerprint === fingerprint) {
      return {
        status: 'SKIPPED_UNCHANGED',
        message: `The active model ${active!.artifact.version} was already trained on the current verified dataset.`,
        version: active!.artifact.version,
      }
    }

    jobId = await logJob({ status: 'RUNNING', trigger, datasetSize: usable.length, newRecordsCount: Math.max(0, usable.length - (active?.artifact.trainedSamples || 0)) })

    const { artifact, durationMs } = trainGenreModel(rows, cfg)
    artifact.datasetFingerprint = fingerprint
    const m = artifact.metrics

    // Parity: the stored (rounded) artifact must reproduce the trainer's own probabilities
    const parity = runParityTests(compileArtifact(artifact))
    const combinedAccuracy: number | undefined = m.ruleBasedPlusML?.accuracy
    const beatsBaseline = Math.max(m.accuracy, combinedAccuracy ?? 0) > m.majorityBaseline
    const promote = parity.passed && beatsBaseline
    const decision = promote ? 'ACTIVATED' : 'REJECTED_INFERIOR'
    const pct = (x?: number) => (typeof x === 'number' ? `${(x * 100).toFixed(1)}%` : 'n/a')
    const reason = promote
      ? `Automatically retrained (${trigger === 'AUTO' ? 'verified dataset changed' : 'manual retrain'}) on ${artifact.trainedSamples} verified entries; ` +
        `LOOCV rules + ML ${pct(combinedAccuracy)}, ML alone ${pct(m.accuracy)}, majority baseline ${pct(m.majorityBaseline)}; parity verified on ${parity.count} cases`
      : `Not promoted: ${!parity.passed ? 'parity check failed' : `LOOCV accuracy ${pct(Math.max(m.accuracy, combinedAccuracy ?? 0))} does not beat the majority baseline ${pct(m.majorityBaseline)}`}`

    const record = {
      version: artifact.version,
      algorithm: artifact.algorithm,
      metrics: JSON.stringify(m),
      macroF1: m.macroF1,
      accuracy: m.accuracy,
      datasetSize: artifact.trainedSamples,
      verifiedCounts: JSON.stringify(artifact.classCounts),
      promotionReason: reason,
      artifact: JSON.stringify(artifact),
    }
    if (promote) {
      await prisma.$transaction([
        prisma.mLModelRegistry.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'ARCHIVED' } }),
        prisma.mLModelRegistry.create({ data: { ...record, status: 'ACTIVE', activatedAt: new Date() } }),
      ])
      invalidateTrainedModelCache()
      try {
        revalidateTag('entries') // dashboard accuracy and cached pages
      } catch {
        // Outside a Next.js request (scripts) there is nothing to revalidate.
      }
    } else {
      await prisma.mLModelRegistry.create({ data: { ...record, status: 'REJECTED' } })
    }

    await logJob(
      {
        status: 'COMPLETED',
        candidateVersion: artifact.version,
        evaluationResults: JSON.stringify({ accuracy: m.accuracy, macroF1: m.macroF1, ruleBasedPlusML: m.ruleBasedPlusML, majorityBaseline: m.majorityBaseline }),
        promotionDecision: decision,
        completedAt: new Date(),
      },
      jobId
    )
    console.log(`[AutoRetrain] ${decision} ${artifact.version} in ${durationMs} ms — ${reason}`)

    return {
      status: decision,
      message: promote ? `Model ${artifact.version} is now active. ${reason}.` : reason,
      version: artifact.version,
      trainedSamples: artifact.trainedSamples,
      accuracy: m.accuracy,
      combinedAccuracy,
      skippedGenres,
      durationMs: Date.now() - started,
    }
  } catch (err: any) {
    console.error('[AutoRetrain] Failed:', err)
    if (jobId) await logJob({ status: 'FAILED', errorMessage: String(err?.message || err), completedAt: new Date() }, jobId)
    return { status: 'FAILED', message: `Retraining failed: ${err?.message || err}`, durationMs: Date.now() - started }
  }
}
