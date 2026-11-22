'use client'

import { useEffect, useRef, useState } from 'react'

interface TrainedModelSummary {
  id: string
  version: string
  algorithm: string
  status: string
  metrics: any
  accuracy: number | null
  macroF1: number | null
  datasetSize: number
  verifiedCounts: Record<string, number>
  promotionReason: string | null
  activatedAt: string | null
  createdAt: string
}

const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  padding: '20px',
}
const btn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--primary-red, #8F000D)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
}
const ghost: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: '12px',
  cursor: 'pointer',
}

const pct = (v: number | null | undefined) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—')

export default function TrainedModelManagement() {
  const [models, setModels] = useState<TrainedModelSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ml/models/trained')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load trained models')
      setModels(data.models)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const upload = async (file: File) => {
    setBusy(true)
    setMessage(null)
    try {
      let artifact: any
      try {
        artifact = JSON.parse(await file.text())
      } catch {
        throw new Error('The file is not valid JSON. Upload the model file downloaded from the Colab notebook.')
      }
      const res = await fetch('/api/ml/models/trained', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artifact),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setMessage({
        type: 'success',
        text: `Model ${data.version} is now active (${data.trainedSamples} training entries, LOOCV accuracy ${pct(data.accuracy)}). Parity verified on ${data.parity.count} test cases.`,
      })
      await load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const activate = async (version: string) => {
    setMessage(null)
    const res = await fetch('/api/ml/models/trained', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version }),
    })
    const data = await res.json()
    setMessage(res.ok ? { type: 'success', text: `Model ${version} re-activated.` } : { type: 'error', text: data.error })
    if (res.ok) await load()
  }

  const active = models.find(m => m.status === 'ACTIVE')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '680px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>🧪 Trained Model (Google Colab)</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Train the genre classifier in <code>notebooks/ManoboLit_Genre_Classifier_Trainer.ipynb</code> on human-verified
            entries, download the model file, and upload it here. The app checks that it reproduces the notebook&apos;s
            predictions before using it.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <button type="button" style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Verifying…' : '⬆ Upload model (.json)'}
          </button>
        </div>
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

      {loading ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>Loading trained models…</div>
      ) : error ? (
        <div style={{ ...card, color: 'var(--text-primary)' }}>{error}</div>
      ) : !active ? (
        <div style={{ ...card, color: 'var(--text-secondary)', fontSize: '13px' }}>
          No trained model uploaded yet. Until one is uploaded, the app uses its in-app learned ensemble.
        </div>
      ) : (
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          {[
            ['Active version', active.version],
            ['LOOCV accuracy', pct(active.accuracy)],
            ['Macro-F1', active.macroF1?.toFixed(3) ?? '—'],
            ['Majority baseline', pct(active.metrics?.majorityBaseline)],
            ['Training entries', String(active.datasetSize)],
            ['Activated', active.activatedAt ? new Date(active.activatedAt).toLocaleString() : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', wordBreak: 'break-all' }}>{value}</div>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {active.algorithm} · Per genre: {Object.entries(active.verifiedCounts).map(([g, n]) => `${g} ${n}`).join(', ')}
          </div>
        </div>
      )}

      {models.length > 1 && (
        <div style={{ ...card, padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>History</div>
          {models.map(m => (
            <div
              key={m.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: '1px solid var(--border-color)', fontSize: '12px', flexWrap: 'wrap' }}
            >
              <span style={{ color: 'var(--text-primary)' }}>
                {m.version} · acc {pct(m.accuracy)} · {m.datasetSize} entries · {m.status}
              </span>
              {m.status !== 'ACTIVE' && (
                <button type="button" style={ghost} onClick={() => activate(m.version)}>
                  Activate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
