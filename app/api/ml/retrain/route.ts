import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { spawn } from 'child_process'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'

export async function POST(request: NextRequest) {
  try {
    const isAuthed = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Retraining requires an authenticated admin session' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { force = false, trigger = 'MANUAL' } = body

    // 1. Fetch eligible verified entries from DB
    const entries = await prisma.literatureEntry.findMany({
      where: { reviewStatus: 'VERIFIED' },
    })

    // 2. Create MLTrainingJob record
    const job = await prisma.mLTrainingJob.create({
      data: {
        status: 'RUNNING',
        trigger,
        datasetSize: entries.length,
      },
    })

    // 3. Try to call FastAPI microservice
    try {
      const mlRes = await fetch(`${ML_SERVICE_URL}/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, force, entries }),
      })

      if (mlRes.ok) {
        const mlData = await mlRes.json()
        await prisma.mLTrainingJob.update({
          where: { id: job.id },
          data: {
            status: mlData.success ? 'COMPLETED' : 'FAILED',
            candidateVersion: mlData.candidate_version || null,
            promotionDecision: mlData.promoted ? 'ACTIVATED' : (mlData.status || 'REJECTED_CONDITIONS_NOT_MET'),
            evaluationResults: mlData.validation_metrics ? JSON.stringify(mlData.validation_metrics) : null,
            errorMessage: mlData.message || mlData.error || null,
            completedAt: new Date(),
          },
        })

        if (mlData.promoted && mlData.candidate_version) {
          await prisma.mLModelRegistry.updateMany({
            where: { status: 'ACTIVE' },
            data: { status: 'ARCHIVED' },
          })
          await prisma.mLModelRegistry.create({
            data: {
              version: mlData.candidate_version,
              algorithm: mlData.algorithm || 'LogisticRegression',
              status: 'ACTIVE',
              metrics: JSON.stringify(mlData.validation_metrics || {}),
              macroF1: mlData.validation_metrics?.macro_f1 || null,
              accuracy: mlData.validation_metrics?.accuracy || null,
              datasetSize: entries.length,
              pipelinePath: mlData.artifact_path || null,
              promotionReason: mlData.promotion_reason || 'Passed validation criteria',
              activatedAt: new Date(),
            },
          })
        }

        return NextResponse.json({
          jobId: job.id,
          ...mlData,
        })
      }
    } catch (e) {
      console.warn('[ML Retrain] FastAPI not responding, executing via Python subprocess...')
    }

    // 4. Fallback execution via local Python process
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const args = ['ml/retrain.py']
    if (force) args.push('--force')

    const proc = spawn(pythonCmd, args, {
      cwd: process.cwd(),
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })

    proc.on('close', async code => {
      console.log(`[ML Retrain Subprocess] Finished with code ${code}`)
      await prisma.mLTrainingJob.update({
        where: { id: job.id },
        data: {
          status: code === 0 ? 'COMPLETED' : 'FAILED',
          errorMessage: code === 0 ? null : (stderr || 'Subprocess exited with failure code'),
          completedAt: new Date(),
        },
      })
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'DISPATCHED',
      message: 'Retraining job dispatched to background worker.',
    })
  } catch (error) {
    console.error('POST /api/ml/retrain error:', error)
    return NextResponse.json({ error: 'Failed to trigger retraining' }, { status: 500 })
  }
}
