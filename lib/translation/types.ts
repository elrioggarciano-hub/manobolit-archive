export type TranslationLang = 'en' | 'msm' | 'ceb'

export interface WordValidation {
  word: string
  normalizedWord: string
  status: 'VERIFIED_SIL' | 'AFFIXED_SIL_ROOT' | 'DIALECT_VARIANT' | 'UNREGISTERED'
  partOfSpeech?: string
  rootWord?: string
  definition?: string
  notes?: string
  source: string
}

export interface WebonaryValidationReport {
  totalTokens: number
  verifiedTokens: number
  verificationRate: number
  validatedWords: WordValidation[]
  lexicalAuthority: string
  summaryNote: string
  aiAssisted?: boolean
}

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
  webonaryValidation?: WebonaryValidationReport
  aiReasoning?: string
}
