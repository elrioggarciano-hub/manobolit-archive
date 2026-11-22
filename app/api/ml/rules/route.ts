import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { ruleRowToRule, validateRuleInput } from '@/lib/classification/ruleStore'
import { ensureActiveModels } from '@/lib/classification/retrain'

export const dynamic = 'force-dynamic'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

const PREFIX: Record<string, string> = { GENRE: 'G', THEME: 'T', LOCATION: 'L' }
const FRAMEWORK: Record<string, string> = { GENRE: 'EUGENIO_1993', THEME: 'ANDRESS_1985', LOCATION: 'PROVENANCE' }
const clean = (list: unknown) => (Array.isArray(list) ? Array.from(new Set(list.map(t => String(t).trim().toLowerCase()).filter(Boolean))) : [])

// GET /api/ml/rules — the full rule base (admin)
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const rows = await prisma.classificationRule.findMany({ orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] })
    return NextResponse.json({ rules: rows.map(r => ({ ...ruleRowToRule(r), updatedAt: r.updatedAt })) })
  } catch (error) {
    console.error('GET /api/ml/rules error:', error)
    return NextResponse.json(
      { error: 'Could not load the rule base. Has the migration been applied and the table seeded (npm run seed:rules)?' },
      { status: 500 }
    )
  }
}

// POST /api/ml/rules — add a new rule (admin)
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const invalid = validateRuleInput(body)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const prefix = PREFIX[body.type]
    const ids = await prisma.classificationRule.findMany({ where: { id: { startsWith: prefix } }, select: { id: true } })
    const next = Math.max(0, ...ids.map(r => parseInt(r.id.slice(1), 10)).filter(n => !isNaN(n))) + 1
    const last = await prisma.classificationRule.aggregate({ _max: { sortOrder: true } })
    const rule = await prisma.classificationRule.create({
      data: {
        id: `${prefix}${String(next).padStart(3, '0')}`,
        name: body.name.trim(),
        type: body.type,
        framework: body.framework || FRAMEWORK[body.type],
        value: body.value.trim().toUpperCase().replace(/\s+/g, '_'),
        keywords: JSON.stringify(clean(body.keywords)),
        phrases: JSON.stringify(clean(body.phrases)),
        contextClues: JSON.stringify(clean(body.contextClues)),
        baseConfidence: body.baseConfidence ?? 0.8,
        source: 'EXPERT',
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    })
    await ensureActiveModels(true)
    return NextResponse.json({ rule: ruleRowToRule(rule) }, { status: 201 })
  } catch (error) {
    console.error('POST /api/ml/rules error:', error)
    return NextResponse.json({ error: 'Failed to add rule' }, { status: 500 })
  }
}
