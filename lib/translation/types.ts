export type TranslationLang = 'en' | 'msm' | 'ceb' | 'fil'

export interface TranslationResult {
  translatedText: string
  confidence: number
  sourceLang: TranslationLang
  targetLang: TranslationLang
  matchedPhrases: Array<{ original: string; translated: string; verseRef?: string }>
  matchedWordsCount: number
  totalWordsCount: number
  corpusSource: string
  engineType: 'DATABASE_DYNAMIC' | 'COLAB_NEURAL_NMT' | 'CORPUS_FALLBACK'
}
