'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/context/LanguageContext'

interface Props {
  entryId: string
  title: string
  transcription?: string | null
  translation?: string | null
  bisayaTranslation?: string | null
  communityLocation?: string | null
  municipality?: string | null
  barangay?: string | null
}

// Asks the classifier to explain its decision for this entry (Explainable AI). Nothing is saved.
export default function ExplainClassification(props: Props) {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ text: string; source: string; genre: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const explain = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // explainEntryId (not entryId) so nothing is saved; it only excludes the entry itself from "similar entries"
        body: JSON.stringify({ ...props, entryId: undefined, explainEntryId: props.entryId, text: props.translation || props.transcription, lang: language }),
      })
      const data = await res.json()
      if (!res.ok || !data?.result?.explanation) throw new Error(data?.error || 'No explanation available')
      setResult({ text: data.result.explanation.text, source: data.result.explanation.source, genre: data.result.genre?.value })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!result) {
    return (
      <div style={{ marginTop: '14px' }}>
        <button
          type="button"
          onClick={explain}
          disabled={loading}
          className="btn-anim"
          style={{
            padding: '7px 12px',
            border: '1px solid #8F000D',
            background: 'transparent',
            color: 'var(--brand-accent)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            letterSpacing: '0.03em',
          }}
        >
          {loading ? 'Analysing…' : '🧠 WHY THIS GENRE?'}
        </button>
        {error && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>{error}</div>}
      </div>
    )
  }

  return (
    <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(16, 185, 129, 0.07)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
      <div style={{ fontSize: '9px', fontWeight: 800, color: '#059669', letterSpacing: '0.05em', marginBottom: '6px' }}>
        🧠 WHY THIS GENRE? · EXPLAINABLE AI
      </div>
      <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{result.text}</p>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
        {result.source === 'gemini'
          ? "Written by Gemini from the classifier's own evidence; it cannot change the decision."
          : "Generated from the classifier's own evidence (matched rules, learned words, similar verified entries)."}
      </div>
    </div>
  )
}
