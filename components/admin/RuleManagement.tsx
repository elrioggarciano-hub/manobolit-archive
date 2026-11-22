'use client'

import { useEffect, useMemo, useState } from 'react'

interface Rule {
  id: string
  name: string
  type: 'GENRE' | 'THEME' | 'LOCATION'
  framework: string
  value: string
  keywords: string[]
  phrases: string[]
  contextClues: string[]
  baseConfidence: number
  source?: string
  isActive?: boolean
}

interface Suggestion {
  ruleId: string
  ruleName: string
  type: string
  value: string
  term: string
  support: number
  confidence: number
  occurrences: number
}

interface Form {
  id?: string
  type: Rule['type']
  name: string
  value: string
  keywords: string
  phrases: string
  contextClues: string
  baseConfidence: string
}

const TYPES: { id: Rule['type']; label: string; framework: string }[] = [
  { id: 'GENRE', label: 'Genre rules', framework: 'Eugenio (1993)' },
  { id: 'THEME', label: 'Theme rules', framework: 'Andress (1985)' },
  { id: 'LOCATION', label: 'Location rules', framework: 'Recorded provenance' },
]

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }
const input: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--border-color)',
  background: 'var(--bg-primary, transparent)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box',
}
const btn: React.CSSProperties = { padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary-red, #8F000D)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const ghost: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }
const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }

const toList = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean)

export default function RuleManagement() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<Rule['type']>('GENRE')
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [handled, setHandled] = useState<Record<string, 'approved' | 'dismissed'>>({})
  const [suggestMeta, setSuggestMeta] = useState<{ verifiedEntries?: number; minSupport?: number; minConfidence?: number }>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ml/rules')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load rules')
      setRules(data.rules)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const loadSuggestions = async () => {
    setSuggestions(null)
    const res = await fetch('/api/ml/rules/suggestions')
    const data = await res.json()
    if (!res.ok) return setMessage({ type: 'error', text: data.error || 'Could not discover rule terms' })
    setSuggestions(data.suggestions)
    setSuggestMeta({ verifiedEntries: data.verifiedEntries, minSupport: data.minSupport, minConfidence: data.minConfidence })
  }

  const visible = useMemo(() => rules.filter(r => r.type === type), [rules, type])

  const save = async () => {
    if (!form) return
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        type: form.type,
        name: form.name,
        value: form.value,
        keywords: toList(form.keywords),
        phrases: toList(form.phrases),
        contextClues: toList(form.contextClues),
        baseConfidence: Number(form.baseConfidence),
      }
      const res = await fetch(form.id ? `/api/ml/rules/${form.id}` : '/api/ml/rules', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage({ type: 'success', text: `Rule ${data.rule.id} saved. The classifier uses it immediately.` })
      setForm(null)
      await load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (r: Rule) => {
    const res = await fetch(`/api/ml/rules/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: r.isActive === false }) })
    setMessage(res.ok ? { type: 'success', text: `Rule ${r.id} ${r.isActive === false ? 'enabled' : 'disabled'}.` } : { type: 'error', text: 'Could not update rule' })
    if (res.ok) await load()
  }

  const approve = async (s: Suggestion) => {
    const res = await fetch(`/api/ml/rules/${s.ruleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addKeyword: s.term }) })
    if (res.ok) {
      setHandled({ ...handled, [`${s.ruleId}:${s.term}`]: 'approved' })
      await load()
    } else setMessage({ type: 'error', text: 'Could not add the term' })
  }

  const edit = (r: Rule) =>
    setForm({
      id: r.id,
      type: r.type,
      name: r.name,
      value: r.value,
      keywords: r.keywords.join(', '),
      phrases: r.phrases.join(', '),
      contextClues: r.contextClues.join(', '),
      baseConfidence: String(r.baseConfidence),
    })

  const pending = (suggestions || []).filter(s => !handled[`${s.ruleId}:${s.term}`])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ maxWidth: '700px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Classification Rules</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The rule base of the rule-based classifier (genre rules after Eugenio 1993, theme rules after Andress 1985), stored in
            the database. Rule scores are combined with machine-learned probabilities, and new rule terms are discovered from verified entries for your approval.
          </p>
        </div>
        <button type="button" style={btn} onClick={() => setForm({ type, name: '', value: '', keywords: '', phrases: '', contextClues: '', baseConfidence: '0.8' })}>
          + Add rule
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? '#10b98144' : '#ef444444'}` }}>
          {message.text}
        </div>
      )}

      {/* Rule discovery */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '700px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>🧠 Discovered rule terms (needs review)</h3>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The system mines the verified entries for words strongly associated with a genre or theme (association rules:
              support = entries with the label containing the word, confidence = share of entries containing the word that have the label).
              Approve only meaningful words; function words should be dismissed.
            </p>
          </div>
          <button type="button" style={ghost} onClick={() => { const next = !showSuggestions; setShowSuggestions(next); if (next && !suggestions) loadSuggestions() }}>
            {showSuggestions ? 'Hide' : 'Discover terms'}
          </button>
        </div>
        {showSuggestions && (
          <div style={{ marginTop: '12px' }}>
            {!suggestions ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mining verified entries…</div>
            ) : pending.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No new rule terms to review.</div>
            ) : (
              <>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Mined from {suggestMeta.verifiedEntries} verified entries (support ≥ {suggestMeta.minSupport}, confidence ≥ {Math.round((suggestMeta.minConfidence || 0) * 100)}%).
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px' }}>Term</th><th style={{ padding: '8px' }}>Rule</th><th style={{ padding: '8px' }}>Support</th><th style={{ padding: '8px' }}>Confidence</th><th style={{ padding: '8px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {pending.slice(0, 60).map(s => (
                        <tr key={`${s.ruleId}:${s.term}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.term}</td>
                          <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{s.ruleId} · {s.value}</td>
                          <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{s.support} entries</td>
                          <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{Math.round(s.confidence * 100)}% ({s.support}/{s.occurrences})</td>
                          <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                            <button type="button" style={{ ...ghost, color: '#10b981' }} onClick={() => approve(s)}>Approve</button>{' '}
                            <button type="button" style={ghost} onClick={() => setHandled({ ...handled, [`${s.ruleId}:${s.term}`]: 'dismissed' })}>Dismiss</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button key={t.id} type="button" onClick={() => setType(t.id)}
            style={{ ...ghost, background: type === t.id ? 'var(--primary-red, #8F000D)' : 'transparent', color: type === t.id ? '#fff' : 'var(--text-secondary)' }}>
            {t.label} · {t.framework} ({rules.filter(r => r.type === t.id).length})
          </button>
        ))}
      </div>

      {form && (
        <div style={{ ...card, display: 'grid', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>{form.id ? `Edit rule ${form.id}` : 'New rule'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={label}>Type</label>
              <select style={input} value={form.type} disabled={!!form.id} onChange={e => setForm({ ...form, type: e.target.value as Rule['type'] })}>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div><label style={label}>Name</label><input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={label}>Value (e.g. RIDDLE, NATURE_AND_ENVIRONMENT)</label><input style={input} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
            <div><label style={label}>Base confidence (0–1)</label><input style={input} type="number" step="0.05" min="0.05" max="1" value={form.baseConfidence} onChange={e => setForm({ ...form, baseConfidence: e.target.value })} /></div>
          </div>
          <div><label style={label}>Keywords (comma-separated, weight 1)</label><textarea rows={2} style={input} value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} /></div>
          <div><label style={label}>Phrases (comma-separated, weight 2)</label><textarea rows={2} style={input} value={form.phrases} onChange={e => setForm({ ...form, phrases: e.target.value })} /></div>
          <div><label style={label}>Context clues (comma-separated, weight 1.5)</label><textarea rows={2} style={input} value={form.contextClues} onChange={e => setForm({ ...form, contextClues: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={{ ...btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" style={ghost} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>Loading rules…</div>
      ) : error ? (
        <div style={{ ...card, color: 'var(--text-primary)' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {visible.map(r => (
            <div key={r.id} style={{ ...card, padding: '14px 16px', opacity: r.isActive === false ? 0.5 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  <strong>{r.id}</strong> · {r.name} → <strong>{r.value}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}> · {r.framework} · {r.source}{r.isActive === false ? ' · disabled' : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" style={ghost} onClick={() => edit(r)}>Edit</button>
                  <button type="button" style={ghost} onClick={() => toggle(r)}>{r.isActive === false ? 'Enable' : 'Disable'}</button>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                {r.keywords.length} keywords · {r.phrases.length} phrases · {r.contextClues.length} context clues · base confidence {r.baseConfidence}
                <br />
                <span style={{ color: 'var(--text-muted)' }}>{[...r.keywords, ...r.phrases].slice(0, 14).join(', ')}{r.keywords.length + r.phrases.length > 14 ? ', …' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
