'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SyncSegment, activeSegmentIndex, estimateTimings, formatClock, splitIntoLines, validateSegments } from '@/lib/transcriptSync'

interface Props {
  entryId: string
  audioFile: string
  transcription: string
  initialSegments: SyncSegment[]
}

const card: React.CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }
const btn: React.CSSProperties = { padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#8F000D', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const ghost: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: '12.5px', cursor: 'pointer' }
const input: React.CSSProperties = { padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', fontSize: '12.5px' }

export default function TranscriptSyncEditor({ entryId, audioFile, transcription, initialSegments }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [lines, setLines] = useState<string[]>(initialSegments.length ? initialSegments.map(s => s.text) : splitIntoLines(transcription))
  const [times, setTimes] = useState<(number | null)[]>(initialSegments.length ? initialSegments.map(s => s.start) : [])
  const [linesText, setLinesText] = useState(lines.join('\n'))
  const [editingLines, setEditingLines] = useState(false)
  const [tapIndex, setTapIndex] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [duration, setDuration] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const segments: SyncSegment[] = lines.map((text, i) => ({ text, start: times[i] ?? NaN }))
  const complete = lines.length > 0 && times.length === lines.length && times.every(t => typeof t === 'number' && isFinite(t))
  const active = complete ? activeSegmentIndex(segments, now) : -1

  const applyLines = () => {
    const next = linesText.split('\n').map(l => l.trim()).filter(Boolean)
    setLines(next)
    setTimes(next.map((_, i) => times[i] ?? null))
    setEditingLines(false)
  }

  const startTapping = () => {
    const a = audioRef.current
    if (!a) return
    setTimes(lines.map(() => null))
    setTapIndex(0)
    a.currentTime = 0
    a.play().catch(() => setMessage({ type: 'error', text: 'The recording could not be played.' }))
  }

  const mark = useCallback(() => {
    const a = audioRef.current
    if (tapIndex === null || !a) return
    setTimes(prev => {
      const next = [...prev]
      next[tapIndex] = Math.round(a.currentTime * 10) / 10
      return next
    })
    if (tapIndex + 1 >= lines.length) {
      setTapIndex(null)
      setMessage({ type: 'success', text: 'All lines marked. Play the recording to check, adjust any time, then save.' })
    } else setTapIndex(tapIndex + 1)
  }, [tapIndex, lines.length])

  // Space bar marks the next line while tapping
  useEffect(() => {
    if (tapIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        mark()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tapIndex, mark])

  const estimate = () => {
    if (!duration) return setMessage({ type: 'error', text: 'Load the recording first (press play once) so its length is known.' })
    setTimes(estimateTimings(lines, duration).map(s => s.start))
    setMessage({ type: 'success', text: 'Estimated from line lengths. Listen and correct the times before saving — estimates are only a starting point.' })
  }

  const playFrom = (t: number | null) => {
    const a = audioRef.current
    if (!a || t === null) return
    a.currentTime = t
    a.play().catch(() => {})
  }

  const save = async (clear = false) => {
    setMessage(null)
    const payload = clear ? null : segments
    if (!clear) {
      const invalid = validateSegments(payload)
      if (invalid) return setMessage({ type: 'error', text: invalid })
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/entries/${entryId}/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      if (clear) setTimes(lines.map(() => null))
      setMessage({ type: 'success', text: clear ? 'Synchronization removed.' : `Saved ${data.lines} synchronized lines. The archive page now highlights them during playback.` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={card}>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
          <strong style={{ color: '#f8fafc' }}>Tap to sync:</strong> press <em>Start tapping</em>, then press <em>Mark line</em> (or the space bar)
          exactly when each line begins in the recording. You can also start from an estimate and correct the times by hand.
        </p>
        <audio
          ref={audioRef}
          src={audioFile}
          controls
          preload="metadata"
          style={{ width: '100%' }}
          onTimeUpdate={e => setNow(e.currentTarget.currentTime)}
          onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
          {tapIndex === null ? (
            <button type="button" style={btn} onClick={startTapping} disabled={lines.length === 0}>▶ Start tapping</button>
          ) : (
            <button type="button" style={{ ...btn, background: '#047857' }} onClick={mark}>
              Mark line {tapIndex + 1} of {lines.length} (space)
            </button>
          )}
          <button type="button" style={ghost} onClick={estimate}>Estimate from line lengths</button>
          <button type="button" style={ghost} onClick={() => { setLinesText(lines.join('\n')); setEditingLines(!editingLines) }}>
            {editingLines ? 'Cancel line editing' : 'Edit lines'}
          </button>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
            {formatClock(now)} / {formatClock(duration)}
          </span>
        </div>
      </div>

      {editingLines && (
        <div style={card}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>One line per row (the way it is sung or narrated).</div>
          <textarea value={linesText} onChange={e => setLinesText(e.target.value)} rows={12} style={{ ...input, width: '100%', boxSizing: 'border-box', lineHeight: 1.6 }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="button" style={btn} onClick={applyLines}>Use these lines</button>
            <button type="button" style={ghost} onClick={() => setLinesText(splitIntoLines(transcription).join('\n'))}>Re-split from transcription</button>
          </div>
        </div>
      )}

      <div style={card}>
        {lines.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>This entry has no transcription to synchronize.</div>
        ) : (
          lines.map((text, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 8px', borderRadius: '6px',
                background: i === active ? 'rgba(143,0,13,0.25)' : i === tapIndex ? 'rgba(4,120,87,0.2)' : 'transparent',
              }}
            >
              <input
                type="number"
                step="0.1"
                min="0"
                value={times[i] ?? ''}
                placeholder="—"
                onChange={e => {
                  const v = e.target.value === '' ? null : Number(e.target.value)
                  setTimes(prev => { const next = [...prev]; next[i] = v; return next })
                }}
                style={{ ...input, width: '80px' }}
                aria-label={`Start time of line ${i + 1} in seconds`}
              />
              <button type="button" style={{ ...ghost, padding: '4px 8px' }} onClick={() => playFrom(times[i] ?? null)} disabled={times[i] == null}>▶</button>
              <span style={{ color: i === active ? '#fff' : '#cbd5e1', fontSize: '13px', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))
        )}
      </div>

      {message && (
        <div style={{ padding: '12px 14px', borderRadius: '8px', fontSize: '13px', color: '#f8fafc', background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" style={{ ...btn, opacity: complete && !saving ? 1 : 0.5 }} disabled={!complete || saving} onClick={() => save(false)}>
          {saving ? 'Saving…' : 'Save synchronization'}
        </button>
        {initialSegments.length > 0 && (
          <button type="button" style={ghost} disabled={saving} onClick={() => save(true)}>Remove synchronization</button>
        )}
      </div>
    </div>
  )
}
