import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { ruleRowToRule, validateRuleInput } from '@/lib/classification/ruleStore'
import { ensureActiveModels } from '@/lib/classification/retrain'

async function isAdmin(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
}

const clean = (list: unknown) => (Array.isArray(list) ? Array.from(new Set(list.map(t => String(t).trim().toLowerCase()).filter(Boolean))) : [])

// PUT /api/ml/rules/:id — edit a rule, toggle { isActive }, or approve a discovered term { addKeyword } (admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const row = await prisma.classificationRule.findUnique({ where: { id: params.id } })
    if (!row) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    const existing = ruleRowToRule(row)
    const body = await request.json()

    if (typeof body.addKeyword === 'string') {
      const term = body.addKeyword.trim().toLowerCase()
      if (!term) return NextResponse.json({ error: 'Term is empty' }, { status: 400 })
      const keywords = clean([...existing.keywords, term])
      const updated = await prisma.classificationRule.update({
        where: { id: params.id },
        data: { keywords: JSON.stringify(keywords), source: existing.source?.includes('DISCOVERED') ? existing.source : `${existing.source || 'EXPERT'}+DISCOVERED` },
      })
      await ensureActiveModels(true)
      return NextResponse.json({ rule: ruleRowToRule(updated) })
    }

    if (Object.keys(body).length === 1 && 'isActive' in body) {
      const updated = await prisma.classificationRule.update({ where: { id: params.id }, data: { isActive: Boolean(body.isActive) } })
      await ensureActiveModels(true)
      return NextResponse.json({ rule: ruleRowToRule(updated) })
    }

    const merged = { ...existing, ...body }
    const invalid = validateRuleInput(merged)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
    const updated = await prisma.classificationRule.update({
      where: { id: params.id },
      data: {
        name: String(merged.name).trim(),
        value: String(merged.value).trim().toUpperCase().replace(/\s+/g, '_'),
        keywords: JSON.stringify(clean(merged.keywords)),
        phrases: JSON.stringify(clean(merged.phrases)),
        contextClues: JSON.stringify(clean(merged.contextClues)),
        baseConfidence: merged.baseConfidence,
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    })
    await ensureActiveModels(true)
    return NextResponse.json({ rule: ruleRowToRule(updated) })
  } catch (error) {
    console.error('PUT /api/ml/rules/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
  }
}

// DELETE /api/ml/rules/:id — remove a rule permanently (admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.classificationRule.delete({ where: { id: params.id } })
    await ensureActiveModels(true)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/ml/rules/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }
}
