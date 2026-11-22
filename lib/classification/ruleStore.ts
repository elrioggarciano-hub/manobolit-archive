// Server-side loader for the rule base: ClassificationRule table first, data/classification-rules.json as fallback.
import { prisma } from '../database/prisma'
import { buildRuleSet, ClassificationRule, FALLBACK_RULE_SET, RuleSet } from './rules'

export function ruleRowToRule(row: any): ClassificationRule {
  const list = (v: string) => {
    try {
      const a = JSON.parse(v || '[]')
      return Array.isArray(a) ? a.map(String) : []
    } catch {
      return []
    }
  }
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    framework: row.framework,
    value: row.value,
    keywords: list(row.keywords),
    phrases: list(row.phrases),
    contextClues: list(row.contextClues),
    baseConfidence: row.baseConfidence,
    source: row.source,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }
}

export interface LoadedRules {
  ruleSet: RuleSet
  /** changes whenever the rule table changes (used to decide when to rebuild models) */
  fingerprint: string
}

export async function loadRuleSet(): Promise<LoadedRules> {
  try {
    const [rows, agg] = await Promise.all([
      prisma.classificationRule.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.classificationRule.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
    ])
    if (rows.length > 0) {
      return {
        ruleSet: buildRuleSet(rows.map(ruleRowToRule), FALLBACK_RULE_SET.exclusions, 'database'),
        fingerprint: `rules:${agg._count._all}:${agg._max.updatedAt?.getTime() ?? 0}`,
      }
    }
  } catch (err: any) {
    console.warn('[Rules] Database rule base unavailable; using data/classification-rules.json:', err.message)
  }
  return { ruleSet: FALLBACK_RULE_SET, fingerprint: 'rules:json' }
}

/** Validates admin input for a rule. Returns an error message or null. */
export function validateRuleInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body'
  if (!['GENRE', 'THEME', 'LOCATION'].includes(body.type)) return 'Type must be GENRE, THEME or LOCATION'
  if (!body.name?.trim()) return 'Name is required'
  if (!body.value?.trim()) return 'Value (genre / theme / location code) is required'
  for (const f of ['keywords', 'phrases', 'contextClues']) {
    if (body[f] !== undefined && (!Array.isArray(body[f]) || body[f].some((t: unknown) => typeof t !== 'string'))) return `${f} must be a list of words`
  }
  const total = ['keywords', 'phrases', 'contextClues'].reduce((n, f) => n + (body[f]?.length || 0), 0)
  if (total === 0) return 'A rule needs at least one keyword, phrase or context clue'
  if (body.baseConfidence !== undefined && (typeof body.baseConfidence !== 'number' || body.baseConfidence <= 0 || body.baseConfidence > 1))
    return 'Base confidence must be between 0 and 1'
  return null
}
