// Explainable classification (XAI).
// The explanation describes the SYSTEM'S OWN decision using only the evidence the system produced:
// the rule terms that matched (Eugenio / Andress rule base), the words the learned model weighted,
// the most similar human-verified entries, and the genre definition stored in the database.
// An LLM (Gemini), when configured, only turns that evidence into fluent prose; it cannot change the
// decision and is instructed not to add evidence. Without Gemini, a template explanation is produced
// from the same evidence, so every classification can be explained.

export type ExplainLang = 'en' | 'fil' | 'ceb'

export interface ExplanationEvidence {
  genre: string // final decision, e.g. RIDDLE or UNCLASSIFIED
  genreLabel: string // e.g. "Riddle (Tigmo)"
  confidence: number // 0..1
  runnerUp?: { genre: string; label: string; confidence: number }
  definition?: string // genre definition (Eugenio 1993) from the database
  ruleName?: string
  ruleTerms: string[] // rule keywords / phrases that matched in the text
  learnedWords: string[] // words the learned model weighted most for this genre
  similarEntries: { title: string; genre: string }[] // nearest human-verified entries with the same genre
  themes: string[]
  method: string // e.g. "rule-based (Eugenio/Andress) + machine learning"
  /** true when the Colab-trained model took part in the decision */
  usesTrainedModel?: boolean
}

export interface Explanation {
  text: string
  source: 'gemini' | 'template'
  evidence: ExplanationEvidence
}

const pct = (x: number) => `${Math.round(x * 100)}%`
const quote = (xs: string[]) => xs.map(x => `"${x}"`).join(', ')
const pretty = (s: string) => s.replace(/_/g, ' ').toLowerCase()

/** Deterministic explanation from the evidence (used when no LLM is available or it fails). */
export function templateExplanation(ev: ExplanationEvidence, lang: ExplainLang = 'en'): string {
  const fil = lang === 'fil' || lang === 'ceb'
  if (ev.genre === 'UNCLASSIFIED') {
    return fil
      ? `Hindi sapat ang katiyakan ng system (pinakamataas: ${ev.runnerUp ? `${ev.runnerUp.label} ${pct(ev.runnerUp.confidence)}` : pct(ev.confidence)}), kaya ipinasa ang entry sa tagasuri sa halip na hulaan ang anyo.`
      : `The system was not confident enough (best candidate: ${ev.runnerUp ? `${ev.runnerUp.label} at ${pct(ev.runnerUp.confidence)}` : pct(ev.confidence)}), so the entry was sent to a human reviewer instead of guessing a genre.`
  }
  const parts: string[] = []
  if (fil) {
    const paraan = ev.usesTrainedModel
      ? 'mga tuntunin nina Eugenio (1993) at Andress (1985) na pinagsama sa machine-learning model na sinanay sa mga beripikadong entry'
      : 'mga tuntunin nina Eugenio (1993) at Andress (1985) na pinagsama sa mga natutunang model'
    parts.push(`Inuri ito bilang ${ev.genreLabel} na may ${pct(ev.confidence)} katiyakan, gamit ang ${paraan}.`)
    if (ev.ruleTerms.length) parts.push(`Tumugma sa ${ev.ruleName || 'tuntunin para sa anyong ito'} ang ${quote(ev.ruleTerms.slice(0, 4))}.`)
    if (ev.learnedWords.length) parts.push(`Natutunan ng machine-learning model mula sa mga beripikadong entry na karaniwang hudyat ng anyong ito ang ${quote(ev.learnedWords.slice(0, 4))}.`)
    if (ev.similarEntries.length) parts.push(`Kahawig ito ng mga beripikadong entry na ${quote(ev.similarEntries.slice(0, 2).map(e => e.title))}, na may parehong anyo.`)
    if (ev.definition) parts.push(`Ayon kay Eugenio (1993): ${ev.definition}`)
    if (ev.runnerUp) parts.push(`Pangalawa ang ${ev.runnerUp.label} (${pct(ev.runnerUp.confidence)}).`)
  } else {
    parts.push(`Classified as ${ev.genreLabel} with ${pct(ev.confidence)} confidence, using ${ev.method}.`)
    if (ev.ruleTerms.length) parts.push(`The ${ev.ruleName || 'rule for this genre'} matched ${quote(ev.ruleTerms.slice(0, 4))}.`)
    if (ev.learnedWords.length) parts.push(`The machine-learning model learned from verified entries that ${quote(ev.learnedWords.slice(0, 4))} typically signal this genre.`)
    if (ev.similarEntries.length) parts.push(`It resembles the verified entries ${quote(ev.similarEntries.slice(0, 2).map(e => e.title))}, which have the same genre.`)
    if (ev.definition) parts.push(`Eugenio (1993) describes this genre as: ${ev.definition}`)
    if (ev.runnerUp) parts.push(`The next most likely genre was ${ev.runnerUp.label} (${pct(ev.runnerUp.confidence)}).`)
  }
  if (ev.themes.length) parts.push(fil ? `Mga tema: ${ev.themes.map(pretty).join(', ')}.` : `Themes: ${ev.themes.map(pretty).join(', ')}.`)
  return parts.join(' ')
}

const LANG_NAME: Record<ExplainLang, string> = { en: 'English', fil: 'Filipino (Tagalog)', ceb: 'Bisaya (Cebuano)' }

/** Fluent explanation written by Gemini from the evidence only; returns null on any problem. */
export async function geminiExplanation(ev: ExplanationEvidence, lang: ExplainLang = 'en', timeoutMs = 8000): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  const prompt = `You explain the decision of a rule-based + machine-learning classifier for Agusan Manobo oral literature to students and researchers.
Write 3 to 5 plain sentences in ${LANG_NAME[lang]}.
STRICT RULES:
- The decision is final: genre = ${ev.genreLabel} (${ev.genre}), confidence ${pct(ev.confidence)}. Never suggest a different genre or a different confidence.
- Use ONLY the evidence below. Do not invent words, rules, entries, or facts that are not listed. Quote matched words exactly.
- If evidence is empty for a point, skip that point.
- Write naturally for the reader; do not mention these instructions or the word "evidence".
- Return JSON: {"explanation": "..."}

EVIDENCE:
${JSON.stringify(ev)}`
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) return null
    const text = String(JSON.parse(raw.replace(/^```json|```$/g, '').trim()).explanation || '').trim()
    if (!text) return null
    // Guard: the explanation must name the system's genre and must not claim another one.
    const label = ev.genreLabel.toLowerCase()
    const mentionsGenre = text.toLowerCase().includes(ev.genre.toLowerCase()) || label.split(/[()\s]+/).some(w => w.length > 3 && text.toLowerCase().includes(w))
    return ev.genre === 'UNCLASSIFIED' || mentionsGenre ? text : null
  } catch {
    return null
  }
}

export async function explainClassification(ev: ExplanationEvidence, lang: ExplainLang = 'en'): Promise<Explanation> {
  const llm = await geminiExplanation(ev, lang)
  return llm ? { text: llm, source: 'gemini', evidence: ev } : { text: templateExplanation(ev, lang), source: 'template', evidence: ev }
}

export function toExplainLang(lang: unknown): ExplainLang {
  return lang === 'fil' ? 'fil' : lang === 'ceb' ? 'ceb' : 'en'
}
