// Rule-Based Classification Engine — rule MODEL (no rule data in code)
// Genre rules follow Eugenio (1993); theme rules follow Andress (1985); location rules map recorded provenance.
// The rules themselves (keywords, phrases, context clues, confidence) live in the ClassificationRule
// database table, managed by reviewers in Admin → Classification Rules. data/classification-rules.json
// is only the seed source and offline fallback. New rule terms can be DISCOVERED from verified entries
// (ruleDiscovery.ts) and approved by a reviewer, so the rule base grows with the archive.
// Rule scores are combined with machine-learned probabilities in hybrid.ts (rule-based + ML).

import rulesData from '../../data/classification-rules.json'

export interface ClassificationRule {
  id: string
  name: string
  type: 'GENRE' | 'THEME' | 'LOCATION'
  framework: 'EUGENIO_1993' | 'ANDRESS_1985' | 'PROVENANCE' | string
  value: string
  keywords: string[]
  phrases: string[]
  contextClues: string[]
  baseConfidence: number
  source?: string
  sortOrder?: number
  isActive?: boolean
}

export interface RuleExclusions {
  /** literal genre names / citations — removed so rules judge content, not labels */
  genreNameTerms: string[]
  /** terms that occur in only one archive entry (in-sample over-fitting guard) */
  corpusTunedTerms: string[]
  /** additional terms for the strict lower-bound evaluation profile */
  strictCorpusTerms: string[]
}

export interface RuleSet {
  genre: ClassificationRule[]
  theme: ClassificationRule[]
  location: ClassificationRule[]
  exclusions: RuleExclusions
  frameworkExcluded: Set<string>
  strictExcluded: Set<string>
  origin: 'database' | 'fallback-json'
}

export type RulesProfile = 'framework-only' | 'framework-strict' | 'full'

/** Default rules profile across the classification engine: 'framework-only' */
export const RULES_PROFILE: RulesProfile = 'framework-only'

const norm = (t: string) => t.toLowerCase().trim()

export function buildRuleSet(rules: ClassificationRule[], exclusions: RuleExclusions, origin: RuleSet['origin']): RuleSet {
  const active = rules.filter(r => r.isActive !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  return {
    genre: active.filter(r => r.type === 'GENRE'),
    theme: active.filter(r => r.type === 'THEME'),
    location: active.filter(r => r.type === 'LOCATION'),
    exclusions,
    frameworkExcluded: new Set([...exclusions.genreNameTerms, ...exclusions.corpusTunedTerms].map(norm)),
    strictExcluded: new Set([...exclusions.genreNameTerms, ...exclusions.corpusTunedTerms, ...exclusions.strictCorpusTerms].map(norm)),
    origin,
  }
}

const fallbackData = rulesData as unknown as { exclusions: RuleExclusions; rules: ClassificationRule[] }
export const FALLBACK_RULE_SET: RuleSet = buildRuleSet(fallbackData.rules, fallbackData.exclusions, 'fallback-json')

export function isExcludedByProfile(term: string, profile: RulesProfile, ruleSet: RuleSet = FALLBACK_RULE_SET): boolean {
  if (profile === 'framework-strict') return ruleSet.strictExcluded.has(norm(term))
  if (profile === 'framework-only') return ruleSet.frameworkExcluded.has(norm(term))
  return false
}

/** Rule metadata by id (used to label "rules applied" in the UI). */
export function ruleIndex(ruleSet: RuleSet): Record<string, { name: string; value: string; framework: string; type: string }> {
  const out: Record<string, { name: string; value: string; framework: string; type: string }> = {}
  for (const r of [...ruleSet.genre, ...ruleSet.theme, ...ruleSet.location]) out[r.id] = { name: r.name, value: r.value, framework: r.framework, type: r.type }
  return out
}
