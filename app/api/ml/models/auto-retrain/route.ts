import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { autoRetrainGenreModel } from '@/lib/classification/autoTrainer'

export const dynamic = 'force-dynamic'
// Training + leave-one-out evaluation takes several seconds
export const maxDuration = 60

// POST /api/ml/models/auto-retrain — retrain the genre model on the current verified dataset.
// Called automatically by the admin screens after a verification, edit, delete or import
// ({ trigger: 'AUTO' }); skipped when the verified dataset has not changed.
// "Retrain now" sends { trigger: 'MANUAL', force: true }.
export async function POST(request: NextRequest) {
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const result = await autoRetrainGenreModel(body.trigger === 'MANUAL' ? 'MANUAL' : 'AUTO', { force: body.force === true })
  return NextResponse.json(result, { status: result.status === 'FAILED' ? 500 : 200 })
}
