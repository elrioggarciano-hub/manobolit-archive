'use client'

import { useEffect, useState } from 'react'

interface Location {
  id: string
  barangay: string
  aliases: string[]
  municipality: string
  province: string
  lat: number
  lng: number
  sourceUrl: string | null
}

interface Unmapped {
  location: string
  barangay: string
  municipality: string
  province: string
  count: number
}

interface Form {
  id?: string
  barangay: string
  aliases: string
  municipality: string
  province: string
  lat: string
  lng: string
  sourceUrl: string
}

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }
const input: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--border-color)',
  background: 'var(--bg-primary, transparent)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box',
}
const btn: React.CSSProperties = { padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary-red, #8F000D)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const ghost: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }
const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }

const EMPTY: Form = { barangay: '', aliases: '', municipality: '', province: 'Agusan del Sur', lat: '', lng: '', sourceUrl: '' }

export default function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([])
  const [unmapped, setUnmapped] = useState<Unmapped[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ml/locations')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load locations')
      setLocations(data.locations)
      setUnmapped(data.unmapped)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (!form) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(form.id ? `/api/ml/locations/${form.id}` : '/api/ml/locations', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lat: Number(form.lat), lng: Number(form.lng) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage({ type: 'success', text: `Brgy. ${data.location.barangay}, ${data.location.municipality} saved. The maps now show it.` })
      setForm(null)
      await load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (l: Location) => {
    if (!window.confirm(`Remove the coordinates of Brgy. ${l.barangay}, ${l.municipality}? Its entries will show as "not mapped".`)) return
    const res = await fetch(`/api/ml/locations/${l.id}`, { method: 'DELETE' })
    setMessage(res.ok ? { type: 'success', text: 'Location removed.' } : { type: 'error', text: 'Could not remove location' })
    if (res.ok) await load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '28px' }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '700px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>📍 Barangay locations (map)</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Coordinates used by the regional heatmap and entry maps. Look the barangay up on PhilAtlas
            (philatlas.com → Mindanao → Caraga → province → municipality → barangay) and copy its latitude and longitude.
          </p>
        </div>
        <button type="button" style={btn} onClick={() => setForm({ ...EMPTY })}>+ Add barangay</button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? '#10b98144' : '#ef444444'}` }}>
          {message.text}
        </div>
      )}

      {unmapped.length > 0 && (
        <div style={{ ...card, borderColor: '#d97706' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            ⚠️ Archive barangays without coordinates (shown as &quot;not mapped&quot;)
          </div>
          {unmapped.map(u => (
            <div key={u.location} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: '1px solid var(--border-color)', fontSize: '13px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-primary)' }}>{u.location} · {u.count} {u.count === 1 ? 'entry' : 'entries'}</span>
              <button type="button" style={ghost} onClick={() => setForm({ ...EMPTY, barangay: u.barangay, municipality: u.municipality, province: u.province })}>
                Add coordinates
              </button>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div style={{ ...card, display: 'grid', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>{form.id ? `Edit Brgy. ${form.barangay}` : 'New barangay'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div><label style={label}>Barangay</label><input style={input} value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} placeholder="e.g. Tudela" /></div>
            <div><label style={label}>Municipality</label><input style={input} value={form.municipality} onChange={e => setForm({ ...form, municipality: e.target.value })} placeholder="e.g. Trento" /></div>
            <div><label style={label}>Province</label><input style={input} value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} /></div>
            <div><label style={label}>Other spellings (comma-separated)</label><input style={input} value={form.aliases} onChange={e => setForm({ ...form, aliases: e.target.value })} placeholder="e.g. Sta Maria, Sta. Maria" /></div>
            <div><label style={label}>Latitude</label><input style={input} type="number" step="0.0001" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="e.g. 8.0684" /></div>
            <div><label style={label}>Longitude</label><input style={input} type="number" step="0.0001" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="e.g. 126.1032" /></div>
          </div>
          <div><label style={label}>Source (PhilAtlas page)</label><input style={input} value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://www.philatlas.com/..." /></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={{ ...btn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" style={ghost} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>Loading locations…</div>
      ) : error ? (
        <div style={{ ...card, color: 'var(--text-primary)' }}>{error}</div>
      ) : (
        <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Barangay</th><th style={{ padding: '10px 12px' }}>Municipality</th>
                <th style={{ padding: '10px 12px' }}>Latitude, Longitude</th><th style={{ padding: '10px 12px' }}>Source</th><th />
              </tr>
            </thead>
            <tbody>
              {locations.map(l => (
                <tr key={l.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '9px 12px', color: 'var(--text-primary)' }}>{l.barangay}{l.aliases.length ? ` (${l.aliases.join(', ')})` : ''}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-primary)' }}>{l.municipality}, {l.province}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{l.lat}, {l.lng}</td>
                  <td style={{ padding: '9px 12px' }}>{l.sourceUrl ? <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-accent)' }}>PhilAtlas</a> : '—'}</td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button type="button" style={ghost} onClick={() => setForm({ id: l.id, barangay: l.barangay, aliases: l.aliases.join(', '), municipality: l.municipality, province: l.province, lat: String(l.lat), lng: String(l.lng), sourceUrl: l.sourceUrl || '' })}>Edit</button>{' '}
                    <button type="button" style={{ ...ghost, color: '#ef4444' }} onClick={() => remove(l)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
