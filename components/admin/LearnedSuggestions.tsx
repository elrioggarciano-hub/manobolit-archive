'use client'

import { useEffect, useState } from 'react'

interface Suggestion {
  manobo: string
  english?: string
  pEnglish?: number
  bisaya?: string
  pBisaya?: number
  frequency: number
}

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }
const input: React.CSSProperties = {
  width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)',
  background: 'var(--bg-primary, transparent)', color: 'var(--text-primary)', fontSize: '12.5px', boxSizing: 'border-box',
}
const ghost: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }
const pct = (p?: number) => (typeof p === 'number' ? `${Math.round(p * 100)}%` : '—')

export default function LearnedSuggestions() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [meta, setMeta] = useState<{ trainedDocuments?: number; seedPairs?: number; note?: string }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, { english: string; bisaya: string }>>({})
  const [done, setDone] = useState<Record<string, 'approved' | 'dismissed'>>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ml/lexicon/suggestions')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load suggestions')
      setItems(data.suggestions)
      setMeta({ trainedDocuments: data.trainedDocuments, seedPairs: data.seedPairs, note: data.note })
      setEdits(Object.fromEntries(data.suggestions.map((s: Suggestion) => [s.manobo, { english: s.english || '', bisaya: s.bisaya || '' }])))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && items.length === 0) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const approve = async (s: Suggestion) => {
    const e = edits[s.manobo]
    const res = await fetch('/api/ml/lexicon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'WORD',
        manobo: s.manobo,
        english: e.english,
        bisaya: e.bisaya,
        partOfSpeech: 'NOUN',
        notes: `Learned by IBM Model 1 from verified archive texts (p_en ${pct(s.pEnglish)}, p_ceb ${pct(s.pBisaya)}, seen ${s.frequency}×); reviewer-approved`,
        source: 'Learned alignment (reviewer-approved)',
      }),
    })
    if (res.ok) setDone({ ...done, [s.manobo]: 'approved' })
    else setError((await res.json()).error || 'Could not approve')
  }

  const pending = items.filter(s => !done[s.manobo])

  return (
    <div style={{ ...card, marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '700px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>🧠 Words the system learned (needs review)</h3>
          <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The translator learns word translations by itself from the verified Manobo ↔ English/Bisaya texts (IBM Model 1
            statistical word alignment). New Manobo words it has learned appear here; approve the correct ones to add them to the lexicon.
          </p>
        </div>
        <button type="button" style={ghost} onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'Show suggestions'}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: '14px' }}>
          {loading ? (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Training on verified texts…</div>
          ) : error ? (
            <div style={{ fontSize: '13px', color: '#ef4444' }}>{error}</div>
          ) : pending.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{meta.note || 'No new learned words to review.'}</div>
          ) : (
            <>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Learned from {meta.trainedDocuments} parallel texts + {meta.seedPairs} verified lexicon pairs. Probability = how strongly the alignment model links the words.
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px' }}>Manobo</th>
                      <th style={{ padding: '8px' }}>English (p)</th>
                      <th style={{ padding: '8px' }}>Bisaya (p)</th>
                      <th style={{ padding: '8px' }}>Seen</th>
                      <th style={{ padding: '8px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {pending.slice(0, 40).map(s => (
                      <tr key={s.manobo} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.manobo}</td>
                        <td style={{ padding: '8px', minWidth: '140px' }}>
                          <input style={input} value={edits[s.manobo]?.english ?? ''} onChange={e => setEdits({ ...edits, [s.manobo]: { ...edits[s.manobo], english: e.target.value } })} />
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{pct(s.pEnglish)}</span>
                        </td>
                        <td style={{ padding: '8px', minWidth: '140px' }}>
                          <input style={input} value={edits[s.manobo]?.bisaya ?? ''} onChange={e => setEdits({ ...edits, [s.manobo]: { ...edits[s.manobo], bisaya: e.target.value } })} />
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{pct(s.pBisaya)}</span>
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{s.frequency}×</td>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                          <button type="button" style={{ ...ghost, color: '#10b981' }} disabled={!edits[s.manobo]?.english} onClick={() => approve(s)}>
                            Approve
                          </button>{' '}
                          <button type="button" style={ghost} onClick={() => setDone({ ...done, [s.manobo]: 'dismissed' })}>
                            Dismiss
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Object.values(done).includes('approved') && (
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px' }}>
                  Approved words were added to the lexicon (refresh the list below to see them).
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
