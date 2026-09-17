import { BIBLE_PARALLEL_PHRASES, BIBLE_LEXICON, LexiconEntry, ParallelPhrase } from './bibleCorpus'

export interface TranslationResult {
  translatedText: string
  confidence: number
  sourceLang: 'en' | 'msm'
  targetLang: 'msm' | 'en'
  matchedPhrases: Array<{ original: string; translated: string; verseRef?: string }>
  matchedWordsCount: number
  totalWordsCount: number
  corpusSource: string
}

function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Translates text between English and Agusan Manobo (ISO: msm),
 * strictly grounded in the Agusan Manobo Bible corpus (Kasuyatan to Diyus).
 */
export function translateText(
  text: string,
  sourceLang: 'en' | 'msm' = 'en',
  targetLang: 'msm' | 'en' = 'msm'
): TranslationResult {
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
      corpusSource: 'Agusan Manobo Bible (Kasuyatan to Diyus)',
    }
  }

  const matchedPhrases: Array<{ original: string; translated: string; verseRef?: string }> = []
  let confidence = 0.5
  let translatedText = ''
  const words = cleanedInput.split(/\s+/)
  let matchedCount = 0

  if (sourceLang === 'en' && targetLang === 'msm') {
    let textToProcess = cleanedInput

    // Step 1: High-priority N-gram / phrase matching against Bible parallel passages
    for (const phrase of BIBLE_PARALLEL_PHRASES) {
      const regex = new RegExp(`\\b${phrase.english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      if (regex.test(textToProcess)) {
        matchedPhrases.push({
          original: phrase.english,
          translated: phrase.manobo,
          verseRef: phrase.verseRef,
        })
        textToProcess = textToProcess.replace(regex, phrase.manobo)
        matchedCount += phrase.english.split(' ').length
      }
    }

    // Step 2: Word-by-word translation using Agusan Manobo Bible lexicon
    const lexiconMap = new Map<string, string>()
    for (const entry of BIBLE_LEXICON) {
      lexiconMap.set(entry.english.toLowerCase(), entry.manobo)
    }

    const processedTokens = textToProcess.split(/(\s+|[.,!?;:]+)/).map(token => {
      const cleanToken = token.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!cleanToken) return token

      if (lexiconMap.has(cleanToken)) {
        matchedCount++
        const matched = lexiconMap.get(cleanToken)!
        // Preserve capitalisation if original was capitalized
        if (token[0] === token[0].toUpperCase()) {
          return matched.charAt(0).toUpperCase() + matched.slice(1)
        }
        return matched
      }
      return token
    })

    translatedText = processedTokens.join('')
  } else {
    // Reverse translation: Agusan Manobo -> English
    let textToProcess = cleanedInput

    for (const phrase of BIBLE_PARALLEL_PHRASES) {
      const regex = new RegExp(`\\b${phrase.manobo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      if (regex.test(textToProcess)) {
        matchedPhrases.push({
          original: phrase.manobo,
          translated: phrase.english,
          verseRef: phrase.verseRef,
        })
        textToProcess = textToProcess.replace(regex, phrase.english)
        matchedCount += phrase.manobo.split(' ').length
      }
    }

    const reverseLexiconMap = new Map<string, string>()
    for (const entry of BIBLE_LEXICON) {
      reverseLexiconMap.set(entry.manobo.toLowerCase(), entry.english)
    }

    const processedTokens = textToProcess.split(/(\s+|[.,!?;:]+)/).map(token => {
      const cleanToken = token.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!cleanToken) return token

      if (reverseLexiconMap.has(cleanToken)) {
        matchedCount++
        const matched = reverseLexiconMap.get(cleanToken)!
        if (token[0] === token[0].toUpperCase()) {
          return matched.charAt(0).toUpperCase() + matched.slice(1)
        }
        return matched
      }
      return token
    })

    translatedText = processedTokens.join('')
  }

  // Calculate confidence score based on Bible corpus match ratio
  const ratio = words.length > 0 ? Math.min(matchedCount / words.length, 1.0) : 0
  confidence = Math.round((0.55 + ratio * 0.43) * 100) / 100

  return {
    translatedText,
    confidence,
    sourceLang,
    targetLang,
    matchedPhrases,
    matchedWordsCount: matchedCount,
    totalWordsCount: words.length,
    corpusSource: 'Agusan Manobo Bible (Kasuyatan to Diyus)',
  }
}
