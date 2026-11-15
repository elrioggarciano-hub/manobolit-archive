import { GoogleGenAI } from '@google/genai'

export interface GeminiClassificationResult {
  genre: 'RIDDLE' | 'PROVERB' | 'FOLKTALE' | 'SONG' | 'UNCLASSIFIED'
  confidence: number
  reasoning: string
  culturalThemes: string[]
  linguisticObservations?: string
  model: string
}

export interface ClassificationInputText {
  transcription?: string
  translation?: string
  bisayaTranslation?: string
  additionalContext?: string
}

const SYSTEM_PROMPT = `You are an expert computational folklorist and Philippine oral literature taxonomist specializing in Agusan Manobo indigenous oral traditions (Eugenio, 1993).

Your task is to classify an indigenous oral literature selection into exactly ONE of the four active Agusan Manobo genres:
1. RIDDLE (Tigmo): A short metaphorical puzzle or enigmatic description posing an implicit question or test of wit about nature, flora/fauna, tools, or anatomy.
2. PROVERB (Panultihon): A concise didactic/normative statement conveying traditional moral wisdom, practical advice, or an ethical code of life.
3. FOLKTALE (Tud-om / Kwento): A narrative prose story of sequential events, animal tricksters (e.g., monkey and crocodile), origin tales, or human adventures.
4. SONG (Owaging / Folk Song): Poetic, lyrical verses expressing intense collective or individual emotions, grief, historical neglect, resilience, or longing.
5. UNCLASSIFIED: Return this only if the text is completely unintelligible, gibberish, or irrelevant non-oral text.

Analyze both the Agusan Manobo original transcription and the English/Bisaya translation.
Return your evaluation strictly as a valid JSON object matching this schema:
{
  "genre": "RIDDLE" | "PROVERB" | "FOLKTALE" | "SONG" | "UNCLASSIFIED",
  "confidence": number between 0.0 and 1.0,
  "reasoning": "concise academic explanation referencing Eugenio (1993) criteria, poetic or narrative structure, and thematic cues",
  "culturalThemes": ["string array of detected cultural motifs like RESILIENCE, NATURE, MORAL_LESSONS, etc."],
  "linguisticObservations": "brief observation on tone, meter, narrative arc, or metaphor"
}`

/**
 * Classifies Agusan Manobo oral literature using Gemini LLM semantic reasoning.
 * Returns null if GEMINI_API_KEY is not configured or if an error occurs (allowing graceful local fallback).
 */
export async function classifyWithGemini(
  input: ClassificationInputText,
  modelName: string = 'gemini-flash-latest'
): Promise<GeminiClassificationResult | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }

  const parts: string[] = []
  if (input.transcription?.trim()) {
    parts.push(`Original Manobo Transcription:\n"""\n${input.transcription.trim()}\n"""`)
  }
  if (input.translation?.trim()) {
    parts.push(`English Translation:\n"""\n${input.translation.trim()}\n"""`)
  }
  if (input.bisayaTranslation?.trim()) {
    parts.push(`Bisaya Translation:\n"""\n${input.bisayaTranslation.trim()}\n"""`)
  }
  if (input.additionalContext?.trim()) {
    parts.push(`Additional Linguistic Context:\n"""\n${input.additionalContext.trim()}\n"""`)
  }

  if (parts.length === 0) {
    return null
  }

  const userPrompt = parts.join('\n\n')

  // Strategy A: Using @google/genai SDK
  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nCandidate Oral Literature Selection:\n${userPrompt}` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    })

    const text = response.text
    if (text) {
      const parsed = parseGeminiResponse(text, modelName)
      if (parsed) return parsed
    }
  } catch (sdkError: any) {
    console.warn('[GeminiClassifier] SDK call failed, attempting direct REST fetch fallback:', sdkError.message)
  }

  // Strategy B: Direct REST fetch fallback (matches Google AI Studio curl exactly)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${SYSTEM_PROMPT}\n\nCandidate Oral Literature Selection:\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn(`[GeminiClassifier] REST API HTTP ${res.status}:`, errText)
      return null
    }

    const data = await res.json()
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (content) {
      return parseGeminiResponse(content, modelName)
    }
  } catch (restError: any) {
    console.warn('[GeminiClassifier] Direct REST call error:', restError.message)
  }

  return null
}

function parseGeminiResponse(rawText: string, modelName: string): GeminiClassificationResult | null {
  try {
    // Strip possible markdown fences if returned
    let clean = rawText.trim()
    if (clean.startsWith('```json')) clean = clean.slice(7)
    if (clean.startsWith('```')) clean = clean.slice(3)
    if (clean.endsWith('```')) clean = clean.slice(0, -3)
    clean = clean.trim()

    const obj = JSON.parse(clean)
    const validGenres = ['RIDDLE', 'PROVERB', 'FOLKTALE', 'SONG', 'UNCLASSIFIED'] as const
    let genre = (obj.genre || '').toUpperCase().trim()
    if (!validGenres.includes(genre as any)) {
      genre = 'UNCLASSIFIED'
    }

    const confidence = typeof obj.confidence === 'number'
      ? Math.max(0, Math.min(1, obj.confidence))
      : 0.85

    return {
      genre: genre as GeminiClassificationResult['genre'],
      confidence,
      reasoning: obj.reasoning || 'Semantic classification inferred from oral literature structure.',
      culturalThemes: Array.isArray(obj.culturalThemes) ? obj.culturalThemes : [],
      linguisticObservations: obj.linguisticObservations,
      model: modelName,
    }
  } catch (err: any) {
    console.warn('[GeminiClassifier] JSON parse error:', err.message, rawText)
    return null
  }
}
