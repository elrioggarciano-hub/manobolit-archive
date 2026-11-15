import { prisma } from '@/lib/database/prisma'
import { TranslationLang, TranslationResult, MatchedPhrase } from './types'
import { translateText } from './fallback'
import { validateTextWithWebonary, lookupWebonaryTranslation } from './webonaryValidator'
import { translateWithGemini } from './geminiTranslator'

export * from './types'
export { translateText } from './fallback'
export { validateTextWithWebonary, validateSingleWord, lookupWebonaryTranslation, SIL_WEBONARY_ENTRIES } from './webonaryValidator'

const LANG_FIELD: Record<TranslationLang, 'english' | 'manobo' | 'bisaya'> = {
  en: 'english',
  msm: 'manobo',
  ceb: 'bisaya',
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

  // 1. Check external translation endpoint
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
            corpusSource: 'External Machine Translation Model (NLLB-200)',
            engineType: 'COLAB_NEURAL_NMT',
          }
        }
      }
    } catch {
      // Graceful fallback to dynamic database on Colab timeout or network error
    }
  }

  // 2. Query dynamic Supabase PostgreSQL ParallelTranslation records (for en, msm, ceb)
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
      const sourceField = LANG_FIELD[sourceLang]
      const targetField = LANG_FIELD[targetLang]

      const matchedPhrases: MatchedPhrase[] = []
      const words = cleanedInput.split(/\s+/)
      let matchedCount = 0
      let bibleMatchedCount = 0
      let webonaryFilledCount = 0
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
            verseRef: phrase.sourceRef || 'Agusan Manobo Bible / Archive Corpus',
            sourceCorpus: 'BIBLE_CORPUS',
          })
          textToProcess = textToProcess.replace(regex, targetPhrase)
          const phraseWordCount = sourcePhrase.split(/\s+/).length
          matchedCount += phraseWordCount
          bibleMatchedCount += phraseWordCount
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

        // A. Primary: Agusan Manobo Bible / Database Corpus
        if (lexiconMap.has(cleanToken)) {
          matchedCount++
          bibleMatchedCount++
          const matched = lexiconMap.get(cleanToken)!
          matchedPhrases.push({
            original: token,
            translated: matched,
            verseRef: 'Agusan Manobo Bible Corpus',
            sourceCorpus: 'BIBLE_CORPUS',
          })
          if (token[0] === token[0].toUpperCase()) {
            return matched.charAt(0).toUpperCase() + matched.slice(1)
          }
          return matched
        }

        // B. Supplementary: If missing in the Bible, SIL Webonary fills it in!
        const webonaryMatch = lookupWebonaryTranslation(cleanToken, sourceLang, targetLang)
        if (webonaryMatch) {
          matchedCount++
          webonaryFilledCount++
          matchedPhrases.push({
            original: token,
            translated: webonaryMatch.translation,
            verseRef: 'SIL International Webonary (ISO 639-3: msm)',
            sourceCorpus: 'SIL_WEBONARY',
          })
          if (token[0] === token[0].toUpperCase()) {
            return webonaryMatch.translation.charAt(0).toUpperCase() + webonaryMatch.translation.slice(1)
          }
          return webonaryMatch.translation
        }

        return token
      })

      const translatedText = processedTokens.join('')
      const ratio = words.length > 0 ? Math.min(matchedCount / words.length, 1.0) : 0
      const confidence = Math.round((0.60 + ratio * 0.38) * 100) / 100

      // Compute SIL Webonary lexical validation
      const manoboTextToValidate = sourceLang === 'msm' ? cleanedInput : (targetLang === 'msm' ? translatedText : '')
      const webonaryValidation = manoboTextToValidate ? validateTextWithWebonary(manoboTextToValidate, 'msm') : undefined

      // If database matched few words and Gemini API is available, enhance with AI
      if (ratio < 0.5 && process.env.GEMINI_API_KEY) {
        try {
          const aiResult = await translateWithGemini(cleanedInput, sourceLang, targetLang)
          if (aiResult?.translatedText) {
            const aiManobo = sourceLang === 'msm' ? cleanedInput : aiResult.translatedText
            return {
              translatedText: aiResult.translatedText,
              confidence: aiResult.confidence,
              sourceLang,
              targetLang,
              matchedPhrases,
              matchedWordsCount: matchedCount,
              totalWordsCount: words.length,
              corpusSource: 'Gemini LLM (SIL Webonary Grounded Translation)',
              engineType: 'COLAB_NEURAL_NMT',
              webonaryValidation: validateTextWithWebonary(aiManobo, 'msm'),
              aiReasoning: aiResult.linguisticNotes,
              bibleWordsCount: bibleMatchedCount,
              webonaryWordsCount: webonaryFilledCount,
            }
          }
        } catch (aiErr) {
          console.warn('[TranslateEngine] Gemini AI translation skipped:', aiErr)
        }
      }

      return {
        translatedText,
        confidence,
        sourceLang,
        targetLang,
        matchedPhrases,
        matchedWordsCount: matchedCount,
        totalWordsCount: words.length,
        corpusSource: `Dual Validating Corpus: Agusan Manobo Bible (${dbEntries.length} verified records) + SIL Webonary Dictionary (Supplementary)`,
        engineType: 'DATABASE_DYNAMIC',
        webonaryValidation,
        bibleWordsCount: bibleMatchedCount,
        webonaryWordsCount: webonaryFilledCount,
      }
    }
  } catch (dbErr) {
    console.warn('Dynamic database translation failed, falling back to static corpus:', dbErr)
  }

  // 3. Check Gemini AI if database was offline
  if (process.env.GEMINI_API_KEY) {
    try {
      const aiResult = await translateWithGemini(cleanedInput, sourceLang, targetLang)
      if (aiResult?.translatedText) {
        const aiManobo = sourceLang === 'msm' ? cleanedInput : aiResult.translatedText
        return {
          translatedText: aiResult.translatedText,
          confidence: aiResult.confidence,
          sourceLang,
          targetLang,
          matchedPhrases: [],
          matchedWordsCount: 0,
          totalWordsCount: cleanedInput.split(/\s+/).length,
          corpusSource: 'Gemini LLM (SIL Webonary Grounded Translation)',
          engineType: 'COLAB_NEURAL_NMT',
          webonaryValidation: validateTextWithWebonary(aiManobo, 'msm'),
          aiReasoning: aiResult.linguisticNotes,
        }
      }
    } catch {
      // Fall through to static
    }
  }

  // 4. Fallback to synchronous static corpus if database and AI are unavailable
  const fallbackResult = translateText(cleanedInput, sourceLang, targetLang)
  const manoboFallback = sourceLang === 'msm' ? cleanedInput : (targetLang === 'msm' ? fallbackResult.translatedText : '')
  return {
    ...fallbackResult,
    webonaryValidation: manoboFallback ? validateTextWithWebonary(manoboFallback, 'msm') : undefined,
  }
}
