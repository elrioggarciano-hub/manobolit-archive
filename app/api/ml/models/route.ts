import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'

// GET /api/ml/models - Lists models, active model status, and training history
export async function GET() {
  try {
    const dbModels = await prisma.mLModelRegistry.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const activeModel = dbModels.find(m => m.status === 'ACTIVE') || {
      version: 'rules-baseline',
      algorithm: 'DomainExpertRules',
      status: 'ACTIVE',
      metrics: JSON.stringify({ source: 'Eugenio 1993 Rules' }),
    }

    const trainingJobs = await prisma.mLTrainingJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      activeVersion: activeModel.version,
      activeModel,
      isMLActive: activeModel.version !== 'rules-baseline',
      models: dbModels.map(m => ({
        ...m,
        metrics: JSON.parse(m.metrics || '{}'),
        verifiedCounts: JSON.parse(m.verifiedCounts || '{}'),
      })),
      recentJobs: trainingJobs.map(j => ({
        ...j,
        evaluationResults: JSON.parse(j.evaluationResults || '{}'),
      })),
    })
  } catch (error) {
    console.error('GET /api/ml/models error:', error)
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}

// POST /api/ml/models/activate - Rollback or switch active model version
export async function POST(request: NextRequest) {
  try {
    const isAuthed = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { version } = body

    if (!version) {
      return NextResponse.json({ error: 'version is required' }, { status: 400 })
    }

    // Call FastAPI service if running, to atomically update files
    try {
      await fetch(`${ML_SERVICE_URL}/models/${version}/activate`, {
        method: 'POST',
      })
    } catch (e) {
      // If service is offline, update database directly
      console.warn('[ML Models] Python service offline, updating database directly.')
    }

    // Mark previous active models as ARCHIVED
    await prisma.mLModelRegistry.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'ARCHIVED' },
    })

    // Activate the requested model in DB
    await prisma.mLModelRegistry.updateMany({
      where: { version },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      activeVersion: version,
      message: `Successfully set active model to ${version}`,
    })
  } catch (error) {
    console.error('POST /api/ml/models/activate error:', error)
    return NextResponse.json({ error: 'Failed to switch model version' }, { status: 500 })
  }
}
