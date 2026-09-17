import { genreRules, themeRules, locationRules, ClassificationRule } from './rules'

export interface MatchedTerm {
  term: string
  type: 'keyword' | 'phrase' | 'context'
}

export interface RuleDetail {
  confidence: number
  matched: MatchedTerm[]
}

export interface ClassificationResult {
  genre: {
    value: string
    confidence: number
    rulesApplied: string[]
    allScores: { genre: string; confidence: number }[]
  }
  themes: {
    value: string
    confidence: number
    ruleId: string
  }[]
  location: {
    value: string
    confidence: number
    ruleId: string
  } | null
  rulesApplied: string[]
  overallConfidence: number
  /** Per-rule confidence + the specific keywords/phrases/context clues that matched, keyed by rule id. */
  ruleDetails: Record<string, RuleDetail>
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
}

/**
 * How to Use and Understand the Rule-Based Engine:
 * 
 * This classifier works by scanning literature text against pre-defined rules in rules.ts.
 * The evaluation process is split into these simple steps:
 * 
 * 
 * Step 1: Text Normalization
 *   - Punctuation is stripped and all characters are lowercased so formatting differences do not affect matches.
 * 
 * Step 2: Scoring Keywords, Phrases, and Context Clues
 *   - The algorithm searches the normalized text for specific items from the r ule definition:
 *     1. Keywords: Basic theme-related words (e.g. "creation"). Weight = 1.0.
 *     2. Phrases: Multi-word patterns (e.g. "in the beginning"). Weight = 2.0 (higher weight because phrases are more specific).
 *     3. Context Clues: Semantic indicators (e.g. "genesis"). Weight = 1.5.
 * 
 * Step 3: Match Aggregation
 *   - We sum the weights of all matching items. If no items match, the rule score is 0.
 * 
 * Step 4: Normalizing against Maximum Possible Score
 *   - The match sum is divided by the maximum possible score (i.e., if the text matched ALL keywords, phrases, and clues in the rule) to yield a raw match ratio (value between 0 and 1).
 * 
 * Step 5: Scaling and Base Confidence Adjustment
 *   - To account for shorter texts which only contain a few key indicators, the raw match ratio is scaled up by a factor of 2.5 (capped at a maximum ratio of 1.0).
 *   - Finally, we multiply this scaled ratio by the rule's `baseConfidence` (e.g., 0.85 for Myth) to get the final confidence score (between 0.0 and 1.0).
 */
function scoreRule(rule: ClassificationRule, normalizedText: string): RuleDetail {
  let score = 0
  let matchCount = 0
  const matched: MatchedTerm[] = []

  // 1. Keyword matching — each matching keyword adds 1 to the score
  for (const keyword of rule.keywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      score += 1
      matchCount++
      matched.push({ term: keyword, type: 'keyword' })
    }
  }

  // 2. Phrase matching — each matching phrase adds 2 to the score (higher specificity)
  for (const phrase of rule.phrases) {
    if (normalizedText.includes(phrase.toLowerCase())) {
      score += 2
      matchCount++
      matched.push({ term: phrase, type: 'phrase' })
    }
  }

  // 3. Context clue matching — each matching clue adds 1.5 to the score
  for (const clue of rule.contextClues) {
    if (normalizedText.includes(clue.toLowerCase())) {
      score += 1.5
      matchCount++
      matched.push({ term: clue, type: 'context' })
    }
  }

  // Surface the most specific evidence first: phrases and context clues explain
  // a match far better than a single generic keyword does.
  matched.sort((a, b) => {
    const rank = { phrase: 0, context: 1, keyword: 2 }
    return rank[a.type] - rank[b.type]
  })

  // If nothing matched, the confidence is 0%
  if (matchCount === 0) return { confidence: 0, matched: [] }

  // 4. Calculate maximum possible score for normalization
  const maxScore = rule.keywords.length * 1 + rule.phrases.length * 2 + rule.contextClues.length * 1.5
  const rawRatio = score / maxScore

  // 5. Scale up the ratio by 2.5 to accommodate typical short texts, and cap at 1.0
  const scaled = Math.min(rawRatio * 2.5, 1.0) * rule.baseConfidence

  // Return score rounded to two decimal places (e.g. 0.24 representing 24% confidence)
  return { confidence: Math.round(scaled * 100) / 100, matched }
}

export function classifyEntry(text: string, additionalContext: string = '', genreFilter: string = 'ALL'): ClassificationResult {
  const fullText = normalizeText(`${text} ${additionalContext}`)
  const ruleDetails: Record<string, RuleDetail> = {}

  // --- Genre Classification ---
  const genreScores: { genre: string; confidence: number; ruleId: string }[] = []

  for (const rule of genreRules) {
    // If a specific genre target is selected, skip other genres
    if (genreFilter !== 'ALL' && rule.value !== genreFilter) {
      continue
    }
    const detail = scoreRule(rule, fullText)
    ruleDetails[rule.id] = detail
    if (detail.confidence > 0) {
      genreScores.push({ genre: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }

  genreScores.sort((a, b) => b.confidence - a.confidence)

  // Use top scoring matched rule, or fallback to zero confidence for the target filter
  let topGenre: { genre: string; confidence: number; ruleId: string }
  if (genreScores.length > 0) {
    topGenre = genreScores[0]
  } else {
    const fallbackRule = genreRules.find(r => r.value === genreFilter) || genreRules[2] // default fallback
    topGenre = { genre: fallbackRule.value, confidence: 0.0, ruleId: fallbackRule.id }
  }

  const appliedGenreRuleIds = genreScores
    .filter(s => s.confidence > 0.05)
    .map(s => s.ruleId)

  // --- Theme Classification ---
  const themeResults: { value: string; confidence: number; ruleId: string }[] = []

  for (const rule of themeRules) {
    const detail = scoreRule(rule, fullText)
    ruleDetails[rule.id] = detail
    if (detail.confidence >= 0.12) {
      themeResults.push({ value: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }

  themeResults.sort((a, b) => b.confidence - a.confidence)
  const topThemes = themeResults.slice(0, 4) // Max 4 themes

  // --- Location Classification ---
  const locationResults: { value: string; confidence: number; ruleId: string }[] = []

  for (const rule of locationRules) {
    const detail = scoreRule(rule, fullText)
    ruleDetails[rule.id] = detail
    if (detail.confidence >= 0.08) {
      locationResults.push({ value: rule.value, confidence: detail.confidence, ruleId: rule.id })
    }
  }

  locationResults.sort((a, b) => b.confidence - a.confidence)
  const topLocation = locationResults[0] ?? null

  const allRulesApplied = [
    ...appliedGenreRuleIds,
    ...topThemes.map(t => t.ruleId),
    ...(topLocation ? [topLocation.ruleId] : []),
  ]

  const overallConfidence =
    topThemes.length > 0
      ? Math.round(((topGenre.confidence + topThemes[0].confidence) / 2) * 100) / 100
      : topGenre.confidence

  return {
    genre: {
      value: topGenre.genre,
      confidence: topGenre.confidence,
      rulesApplied: appliedGenreRuleIds,
      allScores: genreScores.map(s => ({ genre: s.genre, confidence: s.confidence })),
    },
    themes: topThemes,
    location: topLocation,
    rulesApplied: allRulesApplied,
    overallConfidence,
    ruleDetails,
  }
}
