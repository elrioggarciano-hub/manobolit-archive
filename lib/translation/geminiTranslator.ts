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
1. Adhere strictly to SIL Webonary standard orthography for Agusan Manobo (e.g., 'wuhig' for water, 'bubungan' for mountain, 'ligsok'/'bata' for child, 'diwata' for spirit, 'panow' for walk).
2. Preserve cultural and literary nuance (indigenous oral traditions, kinship terms, ecosystem vocabulary).
3. Return strictly valid JSON:
{
  "translatedText": "the accurate translation",
  "confidence": number between 0.85 and 0.99,
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
  modelName: string = 'gemini-flash-lite-latest'
): Promise<GeminiTranslationOutput | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || !text.trim()) return null

  const candidateModels = [modelName, 'gemini-flash-latest', 'gemma-4-26b-a4b-it']

  for (const model of candidateModels) {
    try {
      const ai = new GoogleGenAI({ apiKey })
      const prompt = `Source Language: ${sourceLang}\nTarget Language: ${targetLang}\n\nInput Text:\n"""\n${text.trim()}\n"""`

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })

      const raw = response.text?.trim()
      if (raw) {
        let clean = raw
        if (clean.startsWith('```json')) clean = clean.slice(7)
        if (clean.startsWith('```')) clean = clean.slice(3)
        if (clean.endsWith('```')) clean = clean.slice(0, -3)
        clean = clean.trim()

        const parsed = JSON.parse(clean)
        if (parsed.translatedText) {
          return {
            translatedText: parsed.translatedText,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
            linguisticNotes: parsed.linguisticNotes,
            webonaryLexemes: Array.isArray(parsed.webonaryLexemes) ? parsed.webonaryLexemes : [],
          }
        }
      }
    } catch (e: any) {
      // Continue to next candidate model or fallback
    }
  }

  return null
}

