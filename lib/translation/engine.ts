import { prisma } from '@/lib/database/prisma'
import { TranslationLang, TranslationResult } from './types'
import { translateText } from './fallback'

export * from './types'
export { translateText } from './fallback'

const LANG_FIELD: Record<TranslationLang, 'english' | 'manobo' | 'bisaya' | 'tagalog'> = {
  en: 'english',
  msm: 'manobo',
  ceb: 'bisaya',
  fil: 'tagalog',
}

function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Dynamic Server-Side Async Translation Engine
 * 1. Checks external Google Colab / Hugging Face Seq2Seq API if configured (COLAB_TRANSLATION_URL)
 * 2. Queries dynamic Supabase PostgreSQL ParallelTranslation table
 * 3. Falls back gracefully to authentic literature corpus (Catipay & Curato 2024; Maravilla 2024)
 */
export async function translateTextDynamic(
  text: string,
  sourceLang: TranslationLang = 'en',
  targetLang: TranslationLang = 'msm'
): Promise<TranslationResult> {
  const cleanedInput = cleanText(text)
  if (!cleanedInput) {
    return {
      translatedText: '',
      confidence: 1.0,
      sourceLang,
      targetLang,
      matchedPhrases: [],
      matchedWordsCount: 0,
      totalWordsCount: 0,
      corpusSource: 'ManoboLit Dynamic Translation Engine',
      engineType: 'DATABASE_DYNAMIC',
    }
  }

  // 1. Check external Google Colab / Hugging Face Neural Machine Translation endpoint
  const colabUrl = process.env.COLAB_TRANSLATION_URL || process.env.HUGGINGFACE_TRANSLATION_URL
  if (colabUrl) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)
      const res = await fetch(`${colabUrl.replace(/\/+$/, '')}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedInput, sourceLang, targetLang }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.translatedText) {
          return {
            translatedText: data.translatedText,
            confidence: data.confidence ?? 0.94,
            sourceLang,
            targetLang,
            matchedPhrases: data.matchedPhrases ?? [],
            matchedWordsCount: data.matchedWordsCount ?? cleanedInput.split(/\s+/).length,
            totalWordsCount: cleanedInput.split(/\s+/).length,
            corpusSource: 'Google Colab / NLLB-200 Neural Machine Translation Model',
            engineType: 'COLAB_NEURAL_NMT',
          }
        }
      }
    } catch {
      // Graceful fallback to dynamic database on Colab timeout or network error
    }
  }

  // 2. Query dynamic Supabase PostgreSQL ParallelTranslation records (for en, msm, ceb)
  if (sourceLang !== 'fil' && targetLang !== 'fil') {
    try {
      const dbEntries = await prisma.parallelTranslation.findMany({
        where: { isVerified: true },
        select: {
          english: true,
          manobo: true,
          bisaya: true,
          category: true,
          sourceRef: true,
        },
      })

    if (dbEntries && dbEntries.length > 0) {
      const sourceField = LANG_FIELD[sourceLang] as 'english' | 'manobo' | 'bisaya'
      const targetField = LANG_FIELD[targetLang] as 'english' | 'manobo' | 'bisaya'

      const matchedPhrases: Array<{ original: string; translated: string; verseRef?: string }> = []
      const words = cleanedInput.split(/\s+/)
      let matchedCount = 0
      let textToProcess = cleanedInput

      // Separate into multi-word phrases and single-word lexicon
      const phrases = dbEntries
        .filter((e) => {
          const s = (e[sourceField] || '').trim()
          return s.length > 0 && (s.includes(' ') || e.category === 'PHRASE' || e.category === 'SENTENCE')
        })
        .sort((a, b) => (b[sourceField] || '').length - (a[sourceField] || '').length)

      for (const phrase of phrases) {
        const sourcePhrase = (phrase[sourceField] || '').trim()
        const targetPhrase = (phrase[targetField] || '').trim()
        if (!sourcePhrase || !targetPhrase) continue

        const regex = new RegExp(`\\b${sourcePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        if (regex.test(textToProcess)) {
          matchedPhrases.push({
            original: sourcePhrase,
            translated: targetPhrase,
            verseRef: phrase.sourceRef || 'Archive Corpus',
          })
          textToProcess = textToProcess.replace(regex, targetPhrase)
          matchedCount += sourcePhrase.split(/\s+/).length
        }
      }

      // Lexicon map for individual word lookup
      const lexiconMap = new Map<string, string>()
      for (const entry of dbEntries) {
        const sourceWord = (entry[sourceField] || '').trim().toLowerCase()
        const targetWord = (entry[targetField] || '').trim()
        if (sourceWord && targetWord && !sourceWord.includes(' ')) {
          lexiconMap.set(sourceWord, targetWord)
        }
      }

      const processedTokens = textToProcess.split(/(\s+|[.,!?;:]+)/).map((token) => {
        const cleanToken = token.toLowerCase().replace(/[^a-z0-9-]/g, '')
        if (!cleanToken) return token

        if (lexiconMap.has(cleanToken)) {
          matchedCount++
          const matched = lexiconMap.get(cleanToken)!
          if (token[0] === token[0].toUpperCase()) {
            return matched.charAt(0).toUpperCase() + matched.slice(1)
          }
          return matched
        }
        return token
      })

      const translatedText = processedTokens.join('')
      const ratio = words.length > 0 ? Math.min(matchedCount / words.length, 1.0) : 0
      const confidence = Math.round((0.60 + ratio * 0.38) * 100) / 100

      return {
        translatedText,
        confidence,
        sourceLang,
        targetLang,
        matchedPhrases,
        matchedWordsCount: matchedCount,
        totalWordsCount: words.length,
        corpusSource: `ManoboLit Dynamic Database Corpus (${dbEntries.length} verified records in Supabase)`,
        engineType: 'DATABASE_DYNAMIC',
      }
    }
    } catch (dbErr) {
      console.warn('Dynamic database translation failed, falling back to static corpus:', dbErr)
    }
  }

  // 3. Fallback to synchronous static corpus if database is unavailable
  return translateText(cleanedInput, sourceLang, targetLang)
}
