'use client'

import { useEffect, useMemo, useState } from 'react'

const GENRES = ['RIDDLE', 'PROVERB', 'FOLKTALE', 'SONG', 'MYTH', 'LEGEND', 'EPIC', 'CHANT'] as const
const SOURCES = ['archive-verbatim', 'author-written'] as const

interface CorpusDoc {
  id: string
  text: string
  genre: string
  themes: string[]
  provenance: string
  source: string
  citation: string | null
  archiveEntryId: string | null
  overlapsArchive: boolean
  isActive: boolean
  updatedAt: string
}

interface FormState {
  id?: string
  text: string
  genre: string
  themes: string
  provenance: string
  source: string
  citation: string
  overlapsArchive: boolean
}

const EMPTY_FORM: FormState = {
  text: '',
  genre: 'RIDDLE',
  themes: '',
  provenance: '',
  source: 'archive-verbatim',
  citation: '',
  overlapsArchive: false,
}

const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  padding: '20px',
}
const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary, transparent)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  boxSizing: 'border-box',
}
const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }
const primaryBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--primary-red, #8F000D)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
}
const ghostBtn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: '12px',
  cursor: 'pointer',
}

export default function TrainingCorpusManagement() {
  const [docs, setDocs] = useState<CorpusDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [genreFilter, setGenreFilter] = useState<string>('ALL')
  // Genres the classifier currently predicts — derived on the server from the verified entries
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set())
  const ACTIVE = activeGenres

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ml/training-corpus')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load training corpus')
      setDocs(data.docs)
      setActiveGenres(new Set<string>(data.activeGenres || []))
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
    for (const d of docs) if (d.isActive && !d.overlapsArchive) c[d.genre] = (c[d.genre] || 0) + 1
    return c
  }, [docs])

  const visible = docs.filter(d => genreFilter === 'ALL' || d.genre === genreFilter)

  const save = async () => {
    if (!form) return
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        text: form.text,
        genre: form.genre,
        themes: form.themes.split(',').map(t => t.trim().toUpperCase()).filter(Boolean),
        provenance: form.provenance,
        source: form.source,
        citation: form.citation,
        overlapsArchive: form.overlapsArchive,
      }
      const res = await fetch(form.id ? `/api/ml/training-corpus/${form.id}` : '/api/ml/training-corpus', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage({ type: 'success', text: form.id ? 'Training document updated. Models retrained.' : 'Training document added. Models retrained.' })
      setForm(null)
      await load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (doc: CorpusDoc) => {
    setMessage(null)
    const res = await fetch(`/api/ml/training-corpus/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !doc.isActive }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: `${doc.id} ${doc.isActive ? 'disabled' : 'enabled'}. Models retrained.` })
      await load()
    } else {
      setMessage({ type: 'error', text: 'Could not update document' })
    }
  }

  const remove = async (doc: CorpusDoc) => {
    if (!window.confirm(`Permanently delete training document ${doc.id}? Use "Disable" instead to keep it for audit.`)) return
    const res = await fetch(`/api/ml/training-corpus/${doc.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage({ type: 'success', text: `${doc.id} deleted. Models retrained.` })
      await load()
    } else {
      setMessage({ type: 'error', text: 'Could not delete document' })
    }
  }

  const edit = (d: CorpusDoc) =>
    setForm({
      id: d.id,
      text: d.text,
      genre: d.genre,
      themes: d.themes.join(', '),
      provenance: d.provenance,
      source: d.source,
      citation: d.citation || '',
      overlapsArchive: d.overlapsArchive,
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Training Corpus</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '640px' }}>
            Base examples the classifier learns from, in addition to human-verified archive entries. Stored in the
            database; every change retrains the models immediately.
          </p>
        </div>
        <button type="button" style={primaryBtn} onClick={() => setForm({ ...EMPTY_FORM })}>
          + Add training document
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.type === 'success' ? '#10b98144' : '#ef444444'}`,
            color: 'var(--text-primary)',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Per-genre counts used for training (active, non-overlapping) */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['ALL', ...GENRES].map(g => (
          <button
            key={g}
            type="button"
            onClick={() => setGenreFilter(g)}
            style={{
              ...ghostBtn,
              background: genreFilter === g ? 'var(--primary-red, #8F000D)' : 'transparent',
              color: genreFilter === g ? '#fff' : 'var(--text-secondary)',
              opacity: g !== 'ALL' && !ACTIVE.has(g) ? 0.6 : 1,
            }}
          >
            {g === 'ALL' ? `All (${docs.length})` : `${g} · ${counts[g] || 0} trainable`}
          </button>
        ))}
      </div>

      {form && (
        <div style={{ ...card, display: 'grid', gap: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
            {form.id ? `Edit ${form.id}` : 'New training document'}
          </h3>
          <div>
            <label style={label}>Text (transcription and/or translation — do not include the genre name)</label>
            <textarea rows={5} style={input} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={label}>Genre</label>
              <select style={input} value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}>
                {GENRES.map(g => (
                  <option key={g} value={g}>
                    {g}
                    {ACTIVE.has(g) ? '' : ' (inactive in predictions)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Source</label>
              <select style={input} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Citation</label>
              <input style={input} value={form.citation} placeholder="e.g. Eugenio (1993)" onChange={e => setForm({ ...form, citation: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div>
              <label style={label}>Provenance</label>
              <input style={input} value={form.provenance} placeholder="e.g. Maravilla (2024) - Trento" onChange={e => setForm({ ...form, provenance: e.target.value })} />
            </div>
            <div>
              <label style={label}>Themes (comma-separated)</label>
              <input style={input} value={form.themes} placeholder="NATURE_AND_ENVIRONMENT, MORAL_LESSONS" onChange={e => setForm({ ...form, themes: e.target.value })} />
            </div>
          </div>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.overlapsArchive} onChange={e => setForm({ ...form, overlapsArchive: e.target.checked })} />
            Duplicates an archive entry (excluded from training to prevent evaluation leakage)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" style={ghostBtn} onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>Loading training corpus…</div>
      ) : error ? (
        <div style={{ ...card, color: 'var(--text-primary)' }}>{error}</div>
      ) : visible.length === 0 ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>No training documents for this filter.</div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {visible.map(d => (
            <div key={d.id} style={{ ...card, padding: '14px 16px', opacity: d.isActive ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{d.genre}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.id}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>· {d.source}</span>
                  {d.overlapsArchive && <span style={{ color: '#d97706' }}>· overlaps archive (not trained)</span>}
                  {!d.isActive && <span style={{ color: '#ef4444' }}>· disabled</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" style={ghostBtn} onClick={() => edit(d)}>
                    Edit
                  </button>
                  <button type="button" style={ghostBtn} onClick={() => toggleActive(d)}>
                    {d.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" style={{ ...ghostBtn, color: '#ef4444' }} onClick={() => remove(d)}>
                    Delete
                  </button>
                </div>
              </div>
              <p style={{ margin: '8px 0 4px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{d.text}</p>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {d.provenance}
                {d.citation ? ` · ${d.citation}` : ''}
                {d.themes.length ? ` · ${d.themes.join(', ')}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
