import { BIBLE_PARALLEL_PHRASES, BIBLE_LEXICON } from './bibleCorpus'

export type TranslationLang = 'en' | 'msm' | 'ceb'

export interface TranslationResult {
  translatedText: string
  confidence: number
  sourceLang: TranslationLang
  targetLang: TranslationLang
  matchedPhrases: Array<{ original: string; translated: string; verseRef?: string }>
  matchedWordsCount: number
  totalWordsCount: number
  corpusSource: string
}

const LANG_FIELD: Record<TranslationLang, 'english' | 'manobo' | 'bisaya'> = {
  en: 'english',
  msm: 'manobo',
  ceb: 'bisaya',
}

function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Translates text between English, Agusan Manobo (ISO: msm), and Bisaya
 * (Cebuano, ISO: ceb), strictly grounded in the Agusan Manobo Bible corpus
 * (Kasuyatan to Diyus), which carries parallel English/Manobo/Bisaya glosses
 * for the same verses and vocabulary.
 */
export function translateText(
  text: string,
  sourceLang: TranslationLang = 'en',
  targetLang: TranslationLang = 'msm'
): TranslationResult {
  const cleanedInput = cleanText(text)
  const corpusSource = 'Agusan Manobo Bible (Kasuyatan to Diyus)'

  if (!cleanedInput) {
    return {
      translatedText: '',
      confidence: 1.0,
      sourceLang,
      targetLang,
      matchedPhrases: [],
      matchedWordsCount: 0,
      totalWordsCount: 0,
      corpusSource,
    }
  }

  const sourceField = LANG_FIELD[sourceLang]
  const targetField = LANG_FIELD[targetLang]

  const matchedPhrases: Array<{ original: string; translated: string; verseRef?: string }> = []
  const words = cleanedInput.split(/\s+/)
  let matchedCount = 0
  let textToProcess = cleanedInput

  // Step 1: High-priority N-gram / phrase matching against Bible parallel passages
  for (const phrase of BIBLE_PARALLEL_PHRASES) {
    const sourcePhrase = phrase[sourceField]
    const targetPhrase = phrase[targetField]
    if (!sourcePhrase || !targetPhrase) continue

    const regex = new RegExp(`\\b${sourcePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(textToProcess)) {
      matchedPhrases.push({
        original: sourcePhrase,
        translated: targetPhrase,
        verseRef: phrase.verseRef,
      })
      textToProcess = textToProcess.replace(regex, targetPhrase)
      matchedCount += sourcePhrase.split(' ').length
    }
  }

  // Step 2: Word-by-word translation using the Agusan Manobo Bible lexicon
  const lexiconMap = new Map<string, string>()
  for (const entry of BIBLE_LEXICON) {
    const sourceWord = entry[sourceField]
    const targetWord = entry[targetField]
    if (!sourceWord || !targetWord) continue
    lexiconMap.set(sourceWord.toLowerCase(), targetWord)
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

  const translatedText = processedTokens.join('')

  // Calculate confidence score based on Bible corpus match ratio
  const ratio = words.length > 0 ? Math.min(matchedCount / words.length, 1.0) : 0
  const confidence = Math.round((0.55 + ratio * 0.43) * 100) / 100

  return {
    translatedText,
    confidence,
    sourceLang,
    targetLang,
    matchedPhrases,
    matchedWordsCount: matchedCount,
    totalWordsCount: words.length,
    corpusSource,
  }
}
