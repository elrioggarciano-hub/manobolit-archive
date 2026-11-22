'use client'

import { useEffect, useMemo, useState } from 'react'

const KINDS = [
  { id: 'WORD', label: 'Words', help: 'Vocabulary from the archive entries (shown on the Translator page).' },
  { id: 'PHRASE', label: 'Phrases', help: 'Parallel phrases from the literature (matched before single words).' },
  { id: 'WEBONARY', label: 'SIL Webonary', help: 'Dictionary entries used to validate Manobo words.' },
  { id: 'DIALECT_VARIANT', label: 'Dialect variants', help: 'Variant spelling → standard spelling.' },
  { id: 'PREFIX', label: 'Prefixes', help: 'Affixes stripped when looking up a root word.' },
  { id: 'SUFFIX', label: 'Suffixes', help: 'Affixes stripped when looking up a root word.' },
] as const
type Kind = (typeof KINDS)[number]['id']

interface Row {
  id: string
  kind: Kind
  manobo: string
  english: string | null
  bisaya: string | null
  tagalog: string | null
  root: string | null
  partOfSpeech: string | null
  definition: string | null
  notes: string | null
  reference: string | null
  entryTitle: string | null
  group: string | null
  source: string | null
  isActive: boolean
}

type Form = Partial<Row> & { kind: Kind }

// Which fields each kind uses: [field, label]
const FIELDS: Record<Kind, [keyof Row, string][]> = {
  WORD: [['manobo', 'Manobo'], ['english', 'English'], ['bisaya', 'Bisaya'], ['tagalog', 'Tagalog'], ['partOfSpeech', 'Category (NOUN, VERB…)'], ['group', 'Translator group'], ['notes', 'Notes / source entry']],
  PHRASE: [['manobo', 'Manobo'], ['english', 'English'], ['bisaya', 'Bisaya'], ['tagalog', 'Tagalog'], ['reference', 'Reference (entry + genre)'], ['entryTitle', 'Entry title'], ['notes', 'Context']],
  WEBONARY: [['manobo', 'Manobo'], ['root', 'Root'], ['english', 'English'], ['bisaya', 'Bisaya'], ['partOfSpeech', 'Part of speech'], ['definition', 'Definition'], ['source', 'Source']],
  DIALECT_VARIANT: [['manobo', 'Variant spelling'], ['root', 'Standard spelling'], ['notes', 'Notes']],
  PREFIX: [['manobo', 'Prefix (e.g. pig)']],
  SUFFIX: [['manobo', 'Suffix (e.g. on)']],
}

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }
const input: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--border-color)',
  background: 'var(--bg-primary, transparent)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box',
}
const btn: React.CSSProperties = { padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary-red, #8F000D)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const ghost: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }

const PAGE = 60

export default function LexiconManagement() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<Kind>('WORD')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ml/lexicon')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load lexicon')
      setRows(data.rows)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of rows) c[r.kind] = (c[r.kind] || 0) + 1
    return c
  }, [rows])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      r => r.kind === kind && (!q || [r.manobo, r.english, r.bisaya, r.tagalog, r.root].some(v => v?.toLowerCase().includes(q)))
    )
  }, [rows, kind, query])

  const save = async () => {
    if (!form) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(form.id ? `/api/ml/lexicon/${form.id}` : '/api/ml/lexicon', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage({ type: 'success', text: form.id ? 'Entry updated. The translator uses it within a minute.' : 'Entry added. The translator uses it within a minute.' })
      setForm(null)
      await load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (r: Row) => {
    const res = await fetch(`/api/ml/lexicon/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !r.isActive }),
    })
    setMessage(res.ok ? { type: 'success', text: `"${r.manobo}" ${r.isActive ? 'disabled' : 'enabled'}.` } : { type: 'error', text: 'Could not update entry' })
    if (res.ok) await load()
  }

  const remove = async (r: Row) => {
    if (!window.confirm(`Permanently delete "${r.manobo}"? Use Disable instead to keep it for reference.`)) return
    const res = await fetch(`/api/ml/lexicon/${r.id}`, { method: 'DELETE' })
    setMessage(res.ok ? { type: 'success', text: `"${r.manobo}" deleted.` } : { type: 'error', text: 'Could not delete entry' })
    if (res.ok) await load()
  }

  const kindInfo = KINDS.find(k => k.id === kind)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ maxWidth: '680px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Lexicon & Dictionary</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Every Agusan Manobo word, phrase, dictionary entry, dialect variant and affix used by the translator and the
            word validator is stored here in the database — none are written in the source code.
          </p>
        </div>
        <button type="button" style={btn} onClick={() => setForm({ kind })}>
          + Add {kindInfo.label.toLowerCase().replace(/s$/, '')}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.type === 'success' ? '#10b98144' : '#ef444444'}`,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {KINDS.map(k => (
          <button
            key={k.id}
            type="button"
            onClick={() => { setKind(k.id); setLimit(PAGE); setForm(null) }}
            style={{ ...ghost, background: kind === k.id ? 'var(--primary-red, #8F000D)' : 'transparent', color: kind === k.id ? '#fff' : 'var(--text-secondary)' }}
          >
            {k.label} ({counts[k.id] || 0})
          </button>
        ))}
        <input
          style={{ ...input, width: '220px', marginLeft: 'auto' }}
          placeholder="Search…"
          value={query}
          onChange={e => { setQuery(e.target.value); setLimit(PAGE) }}
        />
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-8px' }}>{kindInfo.help}</div>

      {form && (
        <div style={{ ...card, display: 'grid', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
            {form.id ? `Edit "${form.manobo}"` : `New ${KINDS.find(k => k.id === form.kind)!.label.toLowerCase().replace(/s$/, '')}`}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {FIELDS[form.kind].map(([field, label]) => (
              <label key={field} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {label}
                <input
                  style={{ ...input, marginTop: '5px' }}
                  value={(form[field] as string) ?? ''}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={{ ...btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" style={ghost} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>Loading lexicon…</div>
      ) : error ? (
        <div style={{ ...card, color: 'var(--text-primary)' }}>{error}</div>
      ) : visible.length === 0 ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>No entries.</div>
      ) : (
        <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                {FIELDS[kind].slice(0, 4).map(([f, l]) => <th key={f} style={{ padding: '10px 12px' }}>{l}</th>)}
                <th style={{ padding: '10px 12px' }} />
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, limit).map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-color)', opacity: r.isActive ? 1 : 0.5 }}>
                  {FIELDS[kind].slice(0, 4).map(([f]) => (
                    <td key={f} style={{ padding: '9px 12px', color: 'var(--text-primary)' }}>{(r[f] as string) || '—'}</td>
                  ))}
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button type="button" style={ghost} onClick={() => setForm({ ...r })}>Edit</button>{' '}
                    <button type="button" style={ghost} onClick={() => toggle(r)}>{r.isActive ? 'Disable' : 'Enable'}</button>{' '}
                    <button type="button" style={{ ...ghost, color: '#ef4444' }} onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length > limit && (
            <div style={{ padding: '12px', textAlign: 'center' }}>
              <button type="button" style={ghost} onClick={() => setLimit(limit + PAGE)}>
                Show more ({visible.length - limit} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
