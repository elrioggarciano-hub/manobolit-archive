// Offline corpus translator. Word and phrase data come from the Lexicon (database), never from code.
import { Lexicon } from './lexicon'
import { TranslationLang, TranslationResult, MatchedPhrase } from './types'
import { lookupWebonaryTranslation } from './webonaryValidator'

const LANG_FIELD: Record<TranslationLang, 'english' | 'manobo' | 'bisaya'> = {
  en: 'english',
  msm: 'manobo',
  ceb: 'bisaya',
}

function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export function translateText(
  text: string,
  sourceLang: TranslationLang,
  targetLang: TranslationLang,
  lex: Lexicon
): TranslationResult {
  const cleanedInput = cleanText(text)
  const corpusSource = 'Dual Validating Corpus: Agusan Manobo Bible (Primary) + SIL Webonary Dictionary (Supplementary)'

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
      engineType: 'CORPUS_FALLBACK',
      bibleWordsCount: 0,
      webonaryWordsCount: 0,
    }
  }

  const sourceField = LANG_FIELD[sourceLang]
  const targetField = LANG_FIELD[targetLang]

  const matchedPhrases: MatchedPhrase[] = []
  const words = cleanedInput.split(/\s+/)
  let matchedCount = 0
  let bibleMatchedCount = 0
  let webonaryFilledCount = 0
  let textToProcess = cleanedInput

  // 1. Primary: Match multi-word phrases from the Agusan Manobo Bible / Thesis Corpus
  for (const phrase of lex.phrases) {
    const sourcePhrase = phrase[sourceField]
    const targetPhrase = phrase[targetField]
    if (!sourcePhrase || !targetPhrase) continue

    const regex = new RegExp(`\\b${sourcePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(textToProcess)) {
      matchedPhrases.push({
        original: sourcePhrase,
        translated: targetPhrase,
        verseRef: phrase.verseRef,
        sourceCorpus: 'BIBLE_CORPUS',
      })
      textToProcess = textToProcess.replace(regex, targetPhrase)
      const count = sourcePhrase.split(' ').length
      matchedCount += count
      bibleMatchedCount += count
    }
  }

  // 2. Primary: Bible single-word lexicon lookup map
  const bibleMap = new Map<string, string>()
  for (const entry of lex.words) {
    const sourceWord = entry[sourceField]
    const targetWord = entry[targetField]
    if (!sourceWord || !targetWord) continue
    bibleMap.set(sourceWord.toLowerCase(), targetWord)
  }

  const processedTokens = textToProcess.split(/(\s+|[.,!?;:]+)/).map((token) => {
    const cleanToken = token.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!cleanToken) return token

    // A. Check Agusan Manobo Bible Corpus first
    if (bibleMap.has(cleanToken)) {
      matchedCount++
      bibleMatchedCount++
      const matched = bibleMap.get(cleanToken)!
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

    // B. Supplementary: If NOT in Agusan Manobo Bible, SIL Webonary fills it in!
    const webonaryMatch = lookupWebonaryTranslation(cleanToken, sourceLang, targetLang, lex)
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
    engineType: 'CORPUS_FALLBACK',
    bibleWordsCount: bibleMatchedCount,
    webonaryWordsCount: webonaryFilledCount,
  }
}
