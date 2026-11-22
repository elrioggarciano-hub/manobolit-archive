import { GoogleGenAI } from '@google/genai'
import { TranslationLang } from './types'

export interface GeminiTranslationOutput {
  translatedText: string
  confidence: number
  linguisticNotes?: string
  webonaryLexemes?: string[]
}

const SYSTEM_PROMPT = `You are an expert computational linguist and translator specializing in Agusan Manobo (ISO 639-3: msm), Bisaya (Cebuano), and English, grounded in the official SIL International Webonary Agusan Manobo Dictionary.

Translate the user's text accurately between the specified languages:
- 'msm' = Agusan Manobo (indigenous language of Agusan del Sur)
- 'en'  = English
- 'ceb' = Bisaya / Cebuano

Requirements:
1. Adhere strictly to SIL Webonary standard orthography for Agusan Manobo. When a VERIFIED GLOSSARY from the ManoboLit lexicon database is provided, use those exact word choices.
2. Preserve cultural and literary nuance (indigenous oral traditions, kinship terms, ecosystem vocabulary).
3. Return strictly valid JSON:
{
  "translatedText": "the accurate translation",
  "confidence": number between 0.0 and 1.0 reflecting how certain you are (use a low value when unsure),
  "linguisticNotes": "brief grammatical or cultural observation based on SIL Webonary standards",
  "webonaryLexemes": ["key Agusan Manobo terms identified"]
}`

/**
 * Translates and validates text using Gemini Flash with SIL Webonary grounding.
 */
export async function translateWithGemini(
  text: string,
  sourceLang: TranslationLang,
  targetLang: TranslationLang,
  modelName: string = 'gemini-3.5-flash-lite',
  glossary: { source: string; target: string }[] = []
): Promise<GeminiTranslationOutput | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || !text.trim()) return null

  const candidateModels = Array.from(new Set([
    modelName,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
  ]))

  // Retrieval-augmented grounding: verified pairs from the lexicon database that occur in this input.
  const glossaryBlock = glossary.length
    ? `\n\nVERIFIED GLOSSARY (from the ManoboLit lexicon database, ${sourceLang} -> ${targetLang}):\n` +
      glossary.slice(0, 40).map(g => `- ${g.source} => ${g.target}`).join('\n')
    : ''
  const prompt = `Source Language: ${sourceLang}\nTarget Language: ${targetLang}${glossaryBlock}\n\nInput Text:\n"""\n${text.trim()}\n"""`
  const model = modelName || 'gemini-3.5-flash-lite'

  // Fast direct REST call to gemini-3.5-flash-lite with strict timeout
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(4500),
    })

    if (res.ok) {
      const data = await res.json()
      const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (textOut) {
        let clean = textOut.trim()
        if (clean.startsWith('```json')) clean = clean.slice(7)
        if (clean.startsWith('```')) clean = clean.slice(3)
        if (clean.endsWith('```')) clean = clean.slice(0, -3)
        clean = clean.trim()

        const parsed = JSON.parse(clean)
        if (parsed.translatedText) {
          return {
            translatedText: parsed.translatedText,
            confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
            linguisticNotes: parsed.linguisticNotes,
            webonaryLexemes: Array.isArray(parsed.webonaryLexemes) ? parsed.webonaryLexemes : [],
          }
        }
      }
    }
  } catch (err: any) {
    // Graceful fallback to local lexicon and parallel corpus
  }

  return null
}

