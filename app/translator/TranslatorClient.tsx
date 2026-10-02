'use client'

import { useState, useMemo } from 'react'
import { translateText, TranslationLang, BIBLE_LEXICON, BIBLE_PARALLEL_PHRASES } from '@/lib/translation'

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

// The translator only knows the words in this corpus — grouping them here by
// topic (mirroring how they're organized in bibleCorpus.ts) lets a visitor
// browse and click what's actually available, instead of guessing random
// words that will never match.
const VOCAB_GROUPS: { label: string; words: string[] }[] = [
  { label: 'Theological', words: ['god', 'lord', 'creator', 'spirit', 'blessing', 'grace', 'prayer', 'faith', 'heaven'] },
  { label: 'Nature & Universe', words: ['earth', 'land', 'world', 'sky', 'mountain', 'mountains', 'water', 'stream', 'river', 'tree', 'trees', 'forest', 'star', 'stars', 'sun', 'night', 'light', 'fish', 'animal', 'bird', 'tiger'] },
  { label: 'People & Community', words: ['people', 'person', 'man', 'woman', 'child', 'children', 'father', 'mother', 'family', 'tribe', 'native', 'village'] },
  { label: 'Qualities', words: ['good', 'great', 'hard', 'bitter', 'beautiful', 'bare', 'holy', 'small', 'many', 'first', 'ancient'] },
  { label: 'Actions', words: ['create', 'created', 'made', 'make', 'give', 'gave', 'listen', 'heard', 'see', 'saw', 'walk', 'come', 'came', 'remember', 'weep', 'cry', 'protect', 'help'] },
  { label: 'Feelings & Concepts', words: ['love', 'peace', 'loneliness', 'sorrow', 'history', 'proverb', 'story'] },
  { label: 'Grammar', words: ['the', 'of', 'in', 'to', 'and', 'we', 'you', 'they', 'he', 'she', 'my'] },
]

export default function TranslatorClient() {
  const [sourceLang, setSourceLang] = useState<TranslationLang>('msm')
  const [targetLang, setTargetLang] = useState<TranslationLang>('en')
  const [inputText, setInputText] = useState('')
  const [hasTranslated, setHasTranslated] = useState(false)

  const result = useMemo(() => translateText(inputText, sourceLang, targetLang), [inputText, sourceLang, targetLang])

  // Changing which language the input box is "in" has to clear whatever text
  // was typed under the old language — otherwise leftover Manobo text sits in
  // a box now labeled English (or vice versa) and silently fails to match
  // anything, which reads as the translator being broken rather than as a
  // language mismatch.
  const changeSourceLang = (lang: TranslationLang) => {
    setSourceLang(lang)
    setInputText('')
    setHasTranslated(false)
  }

  const swapLanguages = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setInputText('')
    setHasTranslated(false)
  }

  const langOptions: TranslationLang[] = ['msm', 'en', 'ceb']

  const lexiconByEnglish = useMemo(() => {
    const map = new Map<string, typeof BIBLE_LEXICON[number]>()
    for (const entry of BIBLE_LEXICON) map.set(entry.english, entry)
    return map
  }, [])

  const pickWord = (englishKey: string) => {
    const entry = lexiconByEnglish.get(englishKey)
    if (!entry) return
    setInputText(entry[LANG_FIELD[sourceLang]])
    setHasTranslated(true)
  }

  const pickPhrase = (phrase: typeof BIBLE_PARALLEL_PHRASES[number]) => {
    setInputText(phrase[LANG_FIELD[sourceLang]])
    setHasTranslated(true)
  }

  const clearInput = () => {
    setInputText('')
    setHasTranslated(false)
  }

  return (
    <div className="w-full bg-[var(--bg-main)] text-[var(--text-primary)]" style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full px-6 md:px-8 py-8">

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
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
            Word-Level Translation
          </div>

          <h1
            style={{
              margin: '0 0 16px 0',
              fontSize: '44px',
              fontWeight: 700,
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
            }}
          >
            Manobo Word Translator
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0',
              maxWidth: '760px',
            }}
          >
            Translate individual words and short phrases between Agusan Manobo, English, and Bisaya (Cebuano).
            Every match is validated against the Agusan Manobo Bible corpus (<em style={{ fontStyle: 'italic' }}>Kasuyatan to Diyus</em>),
            the same trusted parallel-language reference used to cross-check the archive&apos;s own transcriptions.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0 24px 0' }} />

        {/* Translator Engine Panel */}
        <section
          style={{
            background: '#18181b',
            color: '#e2e8f0',
            padding: '32px',
            borderRadius: '0px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            maxWidth: '900px',
          }}
        >
          {/* Language selector row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                TRANSLATE FROM
              </label>
              <select
                value={sourceLang}
                onChange={(e) => changeSourceLang(e.target.value as TranslationLang)}
                className="input-anim"
                style={{
                  width: '100%',
                  background: '#09090b',
                  border: '1px solid #1e1e24',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  padding: '10px 12px',
                  outline: 'none',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                {langOptions.map(lang => (
                  <option key={lang} value={lang}>{LANG_LABELS[lang]}</option>
                ))}
              </select>
            </div>

            <button
              onClick={swapLanguages}
              className="btn-anim"
              aria-label="Swap languages"
              title="Swap languages"
              style={{
                width: '38px',
                height: '38px',
                marginTop: '18px',
                borderRadius: '50%',
                background: '#2a2a30',
                border: 'none',
                color: '#f1b80d',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>

            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                TRANSLATE TO
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as TranslationLang)}
                className="input-anim"
                style={{
                  width: '100%',
                  background: '#09090b',
                  border: '1px solid #1e1e24',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  padding: '10px 12px',
                  outline: 'none',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                {langOptions.map(lang => (
                  <option key={lang} value={lang}>{LANG_LABELS[lang]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Input — read-only by design: free typing let visitors enter words that
              were never in the corpus and would never match anything, which just
              read as "the translator is broken." Text can only come from clicking
              a word or phrase below, so everything in this box is guaranteed valid. */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.05em' }}>
                {LANG_LABELS[sourceLang].toUpperCase()} TEXT
              </label>
              {inputText && (
                <button
                  onClick={clearInput}
                  className="btn-anim"
                  style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '9px', fontWeight: 800, letterSpacing: '0.05em', cursor: 'pointer', padding: 0 }}
                >
                  CLEAR ✕
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              readOnly
              placeholder="Click a word or phrase below to see its translation here."
              className="input-anim"
              style={{
                width: '100%',
                minHeight: '90px',
                background: '#09090b',
                border: '1px solid #1e1e24',
                color: '#e2e8f0',
                fontSize: '14px',
                padding: '12px 14px',
                outline: 'none',
                borderRadius: '4px',
                fontFamily: 'Inter, sans-serif',
                resize: 'none',
                cursor: 'default',
              }}
            />
          </div>

          {/* Result */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.05em' }}>
                {LANG_LABELS[targetLang].toUpperCase()} TRANSLATION
              </label>
              {inputText && (
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1b80d', letterSpacing: '0.04em' }}>
                  {Math.round(result.confidence * 100)}% CONFIDENCE
                </span>
              )}
            </div>
            <div
              style={{
                background: '#121214',
                border: '1px solid #2d2d34',
                borderRadius: '4px',
                padding: '14px',
                minHeight: '60px',
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                lineHeight: 1.5,
              }}
            >
              {inputText && hasTranslated ? (result.translatedText || <span style={{ color: '#71717a', fontStyle: 'italic', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>No match found.</span>) : (
                <span style={{ color: '#71717a', fontStyle: 'italic', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>Click any word or phrase in the list below to see its translation.</span>
              )}
            </div>

            {inputText && result.matchedPhrases.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  MATCHED FROM SCRIPTURE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.matchedPhrases.map((m, i) => (
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
                        <span style={{ color: '#52525b', fontStyle: 'italic', flexShrink: 0 }}>{m.verseRef}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inputText && (
              <div style={{ marginTop: '12px', fontSize: '10.5px', color: '#52525b' }}>
                {result.matchedWordsCount} of {result.totalWordsCount} word{result.totalWordsCount === 1 ? '' : 's'} matched &middot; Source: {result.corpusSource}
              </div>
            )}
          </div>
        </section>

        {/* Browse Available Words */}
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
            Browse Available Words
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every word and phrase the translator can recognize is listed below, shown in {LANG_LABELS[sourceLang]} since
            that is your current &ldquo;Translate From&rdquo; language. The text box above only accepts a click from
            this list, so every translation you see is guaranteed to come from the real Agusan Manobo Bible corpus.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                PHRASES
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

            {VOCAB_GROUPS.map(group => (
              <div key={group.label}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  {group.label.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {group.words.map(w => {
                    const entry = lexiconByEnglish.get(w)
                    if (!entry) return null
                    const isActive = inputText.trim().toLowerCase() === entry[LANG_FIELD[sourceLang]].toLowerCase()
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
