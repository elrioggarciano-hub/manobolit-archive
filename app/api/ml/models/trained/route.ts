import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { compileArtifact, runParityTests, invalidateTrainedModelCache, ARTIFACT_FORMAT } from '@/lib/classification/trainedModel'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

const SUMMARY_SELECT = {
  id: true,
  version: true,
  algorithm: true,
  status: true,
  metrics: true,
  macroF1: true,
  accuracy: true,
  datasetSize: true,
  verifiedCounts: true,
  promotionReason: true,
  activatedAt: true,
  createdAt: true,
} as const

// GET /api/ml/models/trained — Colab-trained models (summaries only; the artifact itself is not returned)
export async function GET() {
  try {
    const models = await prisma.mLModelRegistry.findMany({
      where: { artifact: { not: null } },
      select: SUMMARY_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      models: models.map(m => ({
        ...m,
        metrics: JSON.parse(m.metrics || '{}'),
        verifiedCounts: JSON.parse(m.verifiedCounts || '{}'),
      })),
      active: models.find(m => m.status === 'ACTIVE')?.version ?? null,
    })
  } catch (error) {
    console.error('GET /api/ml/models/trained error:', error)
    return NextResponse.json(
      { error: 'Could not load trained models. Has the "artifact" column migration been applied?' },
      { status: 500 }
    )
  }
}

// POST /api/ml/models/trained — upload a model JSON exported by the Colab notebook and activate it
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let artifact: any
  try {
    artifact = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be the model JSON file' }, { status: 400 })
  }

  // 1. Structural validation
  let compiled
  try {
    compiled = compileArtifact(artifact)
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid model file: ${err.message}` }, { status: 400 })
  }

  // 2. Parity: the app must reproduce the notebook's probabilities exactly
  const parity = runParityTests(compiled)
  if (!parity.passed) {
    return NextResponse.json(
      {
        error: 'Model rejected: the app could not reproduce the notebook predictions.',
        parity,
      },
      { status: 422 }
    )
  }

  try {
    const m = artifact.metrics || {}
    const existing = await prisma.mLModelRegistry.findUnique({ where: { version: artifact.version } })
    if (existing) {
      return NextResponse.json({ error: `Model version ${artifact.version} was already uploaded` }, { status: 409 })
    }

    await prisma.$transaction([
      prisma.mLModelRegistry.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'ARCHIVED' } }),
      prisma.mLModelRegistry.create({
        data: {
          version: artifact.version,
          algorithm: artifact.algorithm || ARTIFACT_FORMAT,
          status: 'ACTIVE',
          metrics: JSON.stringify(m),
          macroF1: typeof m.macroF1 === 'number' ? m.macroF1 : null,
          accuracy: typeof m.accuracy === 'number' ? m.accuracy : null,
          datasetSize: artifact.trainedSamples || 0,
          verifiedCounts: JSON.stringify(artifact.classCounts || {}),
          promotionReason: `Uploaded from Colab trainer; parity verified on ${parity.count} cases (max diff ${parity.maxDiff.toExponential(1)})`,
          artifact: JSON.stringify(artifact),
          activatedAt: new Date(),
        },
      }),
    ])
    invalidateTrainedModelCache()

    return NextResponse.json({
      success: true,
      version: artifact.version,
      parity,
      trainedSamples: artifact.trainedSamples,
      accuracy: m.accuracy,
      macroF1: m.macroF1,
    })
  } catch (error) {
    console.error('POST /api/ml/models/trained error:', error)
    return NextResponse.json({ error: 'Failed to store model' }, { status: 500 })
  }
}

// PATCH /api/ml/models/trained — { version } re-activate a previously uploaded model (rollback)
export async function PATCH(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { version } = await request.json()
    const target = await prisma.mLModelRegistry.findUnique({ where: { version }, select: { id: true, artifact: true } })
    if (!target?.artifact) return NextResponse.json({ error: 'Trained model not found' }, { status: 404 })

    await prisma.$transaction([
      prisma.mLModelRegistry.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'ARCHIVED' } }),
      prisma.mLModelRegistry.update({ where: { id: target.id }, data: { status: 'ACTIVE', activatedAt: new Date() } }),
    ])
    invalidateTrainedModelCache()
    return NextResponse.json({ success: true, active: version })
  } catch (error) {
    console.error('PATCH /api/ml/models/trained error:', error)
    return NextResponse.json({ error: 'Failed to activate model' }, { status: 500 })
  }
}
