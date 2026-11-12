'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLanguage } from '@/lib/context/LanguageContext'
import {
  translateText,
  TranslationLang,
  BIBLE_LEXICON,
  BIBLE_PARALLEL_PHRASES,
  TranslationResult,
} from '@/lib/translation'

const LANG_LABELS: Record<TranslationLang, string> = {
  msm: 'Agusan Manobo',
  en: 'English',
  ceb: 'Bisaya (Cebuano)',
}

const LANG_FIELD: Record<TranslationLang, 'english' | 'manobo' | 'bisaya'> = {
  en: 'english',
  msm: 'manobo',
  ceb: 'bisaya',
}

const VOCAB_GROUPS: { label: string; words: string[] }[] = [
  {
    label: 'Nature & Land',
    words: [
      'mountain',
      'mountains',
      'water',
      'stream',
      'river',
      'land',
      'tree',
      'trees',
      'forest',
      'night',
      'light',
      'sun',
      'star',
      'stars',
      'waves',
      'fish',
      'tiger',
      'bird',
      'beans',
      'sugarcane',
      'charcoal',
      'plants',
    ],
  },
  {
    label: 'People & Tribe',
    words: [
      'tribe',
      'people',
      'person',
      'native',
      'child',
      'children',
      'mother',
      'father',
      'family',
      'neighbors',
      'outsiders',
      'husband',
      'companion',
    ],
  },
  {
    label: 'Cultural Lore & Spirits',
    words: [
      'spirit',
      'guardian',
      'blessing',
      'proverb',
      'story',
      'riddle',
      'song',
      'history',
      'gold',
      'wealth',
    ],
  },
  {
    label: 'Feelings & Struggle',
    words: [
      'hardship',
      'loneliness',
      'sorrow',
      'love',
      'peace',
      'tears',
      'fear',
      'resilient',
      'bare',
      'hunger',
    ],
  },
  {
    label: 'Actions',
    words: [
      'weep',
      'listen',
      'walk',
      'look',
      'remember',
      'protect',
      'help',
      'clean',
      'arrive',
      'return',
      'plant',
      'hide',
      'dwell',
      'make',
      'give',
      'dream',
    ],
  },
  {
    label: 'Qualities',
    words: [
      'good',
      'beautiful',
      'hard',
      'great',
      'small',
      'many',
      'ancient',
      'true',
      'white',
      'black',
    ],
  },
  {
    label: 'Grammar',
    words: ['the', 'to', 'in', 'of', 'and', 'my', 'your', 'we', 'they', 'he', 'she', 'you'],
  },
]

export default function TranslatorClient() {
  const { t } = useLanguage()
  const [sourceLang, setSourceLang] = useState<TranslationLang>('msm')
  const [targetLang, setTargetLang] = useState<TranslationLang>('en')
  const [inputText, setInputText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [liveResult, setLiveResult] = useState<TranslationResult | null>(null)
  const [datasetCount, setDatasetCount] = useState<number>(127)

  // Fetch live dataset statistics from the dynamic API
  useEffect(() => {
    fetch('/api/translate/dataset')
      .then((res) => res.json())
      .then((data) => {
        if (data?.summary?.totalPairs) {
          setDatasetCount(data.summary.totalPairs)
        }
      })
      .catch(() => { })
  }, [])

  // Dynamic Translation Caller (queries Supabase / Colab API)
  const performTranslation = useCallback(
    async (text: string, src: TranslationLang, tgt: TranslationLang) => {
      const clean = text.trim()
      if (!clean) {
        setLiveResult(null)
        return
      }

      setIsTranslating(true)
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, sourceLang: src, targetLang: tgt }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.result) {
            setLiveResult(data.result)
            return
          }
        }
      } catch (err) {
        console.warn('Live translation fetch failed, using local fallback:', err)
      } finally {
        setIsTranslating(false)
      }

      // Fallback
      setLiveResult(translateText(clean, src, tgt))
    },
    []
  )

  // Debounced auto-translate on typing
  useEffect(() => {
    if (!inputText.trim()) {
      setLiveResult(null)
      return
    }

    const timer = setTimeout(() => {
      performTranslation(inputText, sourceLang, targetLang)
    }, 400)

    return () => clearTimeout(timer)
  }, [inputText, sourceLang, targetLang, performTranslation])

  const changeSourceLang = (lang: TranslationLang) => {
    setSourceLang(lang)
    setInputText('')
    setLiveResult(null)
  }

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setInputText('')
    setLiveResult(null)
  }

  const langOptions: TranslationLang[] = ['msm', 'en', 'ceb']

  const lexiconByEnglish = useMemo(() => {
    const map = new Map<string, (typeof BIBLE_LEXICON)[number]>()
    for (const entry of BIBLE_LEXICON) map.set(entry.english, entry)
    return map
  }, [])

  const pickWord = (englishKey: string) => {
    const entry = lexiconByEnglish.get(englishKey)
    if (!entry) return
    const word = entry[LANG_FIELD[sourceLang]]
    setInputText(word)
    performTranslation(word, sourceLang, targetLang)
  }

  const pickPhrase = (phrase: (typeof BIBLE_PARALLEL_PHRASES)[number]) => {
    const text = phrase[LANG_FIELD[sourceLang]]
    setInputText(text)
    performTranslation(text, sourceLang, targetLang)
  }

  const clearInput = () => {
    setInputText('')
    setLiveResult(null)
  }

  return (
    <div
      className="w-full bg-[var(--bg-main)] text-[var(--text-primary)]"
      style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}
    >
      <div className="w-full px-6 md:px-8 py-8">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--brand-accent)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Neural &amp; Database-Driven Translation
          </div>

          <h1
            style={{
              margin: '0 0 12px 0',
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 700,
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
            }}
          >
            {t('translator_title')}
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0',
              maxWidth: '820px',
            }}
          >
            {t('translator_subtitle')}
          </p>
        </div>

        {/* Translator Engine Panel */}
        <section
          className="p-4 sm:p-8"
          style={{
            background: '#18181b',
            color: '#e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            maxWidth: '900px',
            border: '1px solid #27272a',
          }}
        >
          {/* Language selector row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '24px',
            }}
          >
            <div style={{ flex: '1 1 220px' }}>
              <label
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#71717a',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                {t('translator_source_label')}
              </label>
              <select
                value={sourceLang}
                onChange={(e) => changeSourceLang(e.target.value as TranslationLang)}
                className="input-anim"
                style={{
                  width: '100%',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  padding: '10px 12px',
                  outline: 'none',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                {langOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANG_LABELS[lang]}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={swapLanguages}
              className="btn-anim my-2 sm:mt-[18px] self-center"
              aria-label={t('translator_swap')}
              title={t('translator_swap')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#27272a',
                border: '1px solid #3f3f46',
                color: '#f1b80d',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>

            <div style={{ flex: '1 1 220px' }}>
              <label
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#71717a',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                {t('translator_target_label')}
              </label>
              <select
                value={targetLang}
                onChange={(e) => {
                  setTargetLang(e.target.value as TranslationLang)
                  if (inputText.trim()) {
                    performTranslation(inputText, sourceLang, e.target.value as TranslationLang)
                  }
                }}
                className="input-anim"
                style={{
                  width: '100%',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  padding: '10px 12px',
                  outline: 'none',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                {langOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANG_LABELS[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Input text — Free typing enabled */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#71717a',
                  letterSpacing: '0.05em',
                }}
              >
                {LANG_LABELS[sourceLang].toUpperCase()} INPUT (FREE TYPING ENABLED)
              </label>
              {inputText && (
                <button
                  onClick={clearInput}
                  className="btn-anim"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {t('translator_clear')} ✕
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type any ${LANG_LABELS[sourceLang]} sentence, word, or select from the vocabulary below...`}
              className="input-anim"
              style={{
                width: '100%',
                minHeight: '90px',
                background: '#09090b',
                border: '1px solid #27272a',
                color: '#e2e8f0',
                fontSize: '14px',
                padding: '12px 14px',
                outline: 'none',
                borderRadius: '4px',
                fontFamily: 'Inter, sans-serif',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Result Box */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#71717a',
                    letterSpacing: '0.05em',
                  }}
                >
                  {LANG_LABELS[targetLang].toUpperCase()} TRANSLATION
                </label>
                {liveResult && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background:
                        liveResult.engineType === 'COLAB_NEURAL_NMT'
                          ? 'rgba(241,184,13,0.18)'
                          : liveResult.engineType === 'DATABASE_DYNAMIC'
                            ? 'rgba(34,197,94,0.18)'
                            : 'rgba(113,113,122,0.18)',
                      color:
                        liveResult.engineType === 'COLAB_NEURAL_NMT'
                          ? '#f1b80d'
                          : liveResult.engineType === 'DATABASE_DYNAMIC'
                            ? '#4ade80'
                            : '#a1a1aa',
                      border: '1px solid currentColor',
                    }}
                  >
                    {liveResult.engineType === 'COLAB_NEURAL_NMT'
                      ? '⚡ COLAB NMT'
                      : liveResult.engineType === 'DATABASE_DYNAMIC'
                        ? '🟢 DYNAMIC SUPABASE DB'
                        : 'CORPUS FALLBACK'}
                  </span>
                )}
              </div>

              {liveResult && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#f1b80d',
                    letterSpacing: '0.04em',
                  }}
                >
                  {isTranslating ? 'TRANSLATING...' : `${Math.round(liveResult.confidence * 100)}% CONFIDENCE`}
                </span>
              )}
            </div>

            <div
              style={{
                background: '#121214',
                border: '1px solid #27272a',
                borderRadius: '4px',
                padding: '16px',
                minHeight: '65px',
                fontSize: '15px',
                color: '#ffffff',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                lineHeight: 1.5,
              }}
            >
              {inputText.trim() ? (
                liveResult ? (
                  liveResult.translatedText || (
                    <span
                      style={{
                        color: '#71717a',
                        fontStyle: 'italic',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                      }}
                    >
                      No translation match found.
                    </span>
                  )
                ) : (
                  <span
                    style={{
                      color: '#a1a1aa',
                      fontStyle: 'italic',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                    }}
                  >
                    Translating...
                  </span>
                )
              ) : (
                <span
                  style={{
                    color: '#71717a',
                    fontStyle: 'italic',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                  }}
                >
                  Type text above or click any word/phrase below to see its translation.
                </span>
              )}
            </div>

            {liveResult && liveResult.matchedPhrases.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#71717a',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  MATCHED CORRESPONDENCES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {liveResult.matchedPhrases.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#1e1e24',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <span style={{ color: '#a1a1aa' }}>
                        &ldquo;{m.original}&rdquo; &rarr; &ldquo;{m.translated}&rdquo;
                      </span>
                      {m.verseRef && (
                        <span
                          style={{
                            color: 'var(--brand-accent)',
                            fontStyle: 'italic',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {m.verseRef}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {liveResult && (
              <div style={{ marginTop: '12px', fontSize: '10.5px', color: '#71717a' }}>
                Engine Source: {liveResult.corpusSource}
              </div>
            )}
          </div>
        </section>

        {/* Quick Pick Word & Phrase Reference */}
        <section style={{ maxWidth: '900px', marginTop: '32px' }}>
          <h2
            style={{
              margin: '0 0 6px 0',
              fontSize: '22px',
              fontWeight: 700,
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              color: 'var(--text-primary)',
            }}
          >
            {t('translator_lexicon_title')}
          </h2>
          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {t('translator_lexicon_desc')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  marginBottom: '8px',
                }}
              >
                PARALLEL LITERATURE PHRASES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {BIBLE_PARALLEL_PHRASES.map((phrase, i) => {
                  const text = phrase[LANG_FIELD[sourceLang]]
                  const isActive = inputText.trim().toLowerCase() === text.toLowerCase()
                  return (
                    <button
                      key={i}
                      onClick={() => pickPhrase(phrase)}
                      className="btn-anim"
                      title={phrase.verseRef}
                      style={{
                        background: isActive ? '#8F000D' : 'var(--bg-surface)',
                        color: isActive ? '#ffffff' : 'var(--text-primary)',
                        border: `1px solid ${isActive ? '#8F000D' : 'var(--border-color)'}`,
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {text}
                    </button>
                  )
                })}
              </div>
            </div>

            {VOCAB_GROUPS.map((group) => (
              <div key={group.label}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                  }}
                >
                  {group.label.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {group.words.map((w) => {
                    const entry = lexiconByEnglish.get(w)
                    if (!entry) return null
                    const isActive =
                      inputText.trim().toLowerCase() === entry[LANG_FIELD[sourceLang]].toLowerCase()
                    return (
                      <button
                        key={w}
                        onClick={() => pickWord(w)}
                        className="btn-anim"
                        style={{
                          background: isActive ? '#8F000D' : 'var(--bg-surface)',
                          color: isActive ? '#ffffff' : 'var(--text-primary)',
                          border: `1px solid ${isActive ? '#8F000D' : 'var(--border-color)'}`,
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {entry[LANG_FIELD[sourceLang]]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
