// Rule Discovery — the rule base learns new conditions from human-verified entries.
// Association-rule mining (Agrawal et al., 1993) of the form  "text contains w  →  genre / theme X":
//   support    = number of verified entries labelled X that contain w
//   confidence = support / number of verified entries that contain w
// Candidate terms that pass the thresholds and are not yet in the rule are proposed to a reviewer,
// who approves them into the rule base (Admin → Classification Rules). Nothing is added automatically.

import { tokenizeUnigrams } from './tokenizer'
import { ClassificationRule, RuleSet, isExcludedByProfile } from './rules'

export interface DiscoveryEntry {
  text: string
  genre: string
  themes: string[]
}

export interface DiscoveredTerm {
  ruleId: string
  ruleName: string
  type: 'GENRE' | 'THEME'
  value: string
  term: string
  support: number
  confidence: number
  /** entries containing the term, any label */
  occurrences: number
}

export const MIN_SUPPORT = 2
export const MIN_CONFIDENCE = 0.8

function ruleTerms(rule: ClassificationRule): Set<string> {
  return new Set([...rule.keywords, ...rule.phrases, ...rule.contextClues].map(t => t.toLowerCase().trim()))
}

export function discoverRuleTerms(entries: DiscoveryEntry[], ruleSet: RuleSet, limitPerRule = 8): DiscoveredTerm[] {
  // document frequency of each word, overall and per label
  const docsWith = new Map<string, number>()
  const byLabel = new Map<string, Map<string, number>>()
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) || 0) + 1)

  for (const e of entries) {
    const words = new Set(tokenizeUnigrams(e.text.toLowerCase(), true).filter(w => w.length >= 3 && /\p{L}/u.test(w)))
    const labels = [`GENRE:${e.genre}`, ...e.themes.map(t => `THEME:${t}`)]
    for (const w of words) {
      bump(docsWith, w)
      for (const l of labels) {
        if (!byLabel.has(l)) byLabel.set(l, new Map())
        bump(byLabel.get(l)!, w)
      }
    }
  }

  const out: DiscoveredTerm[] = []
  for (const rule of [...ruleSet.genre, ...ruleSet.theme]) {
    const counts = byLabel.get(`${rule.type}:${rule.value}`)
    if (!counts) continue
    const existing = ruleTerms(rule)
    const candidates: DiscoveredTerm[] = []
    for (const [term, support] of counts) {
      if (support < MIN_SUPPORT || existing.has(term) || isExcludedByProfile(term, 'framework-only', ruleSet)) continue
      const occurrences = docsWith.get(term) || support
      const confidence = support / occurrences
      if (confidence < MIN_CONFIDENCE) continue
      candidates.push({
        ruleId: rule.id,
        ruleName: rule.name,
        type: rule.type as 'GENRE' | 'THEME',
        value: rule.value,
        term,
        support,
        confidence: Math.round(confidence * 100) / 100,
        occurrences,
      })
    }
    candidates.sort((a, b) => b.support - a.support || b.confidence - a.confidence || a.term.localeCompare(b.term))
    out.push(...candidates.slice(0, limitPerRule))
  }
  return out
}
