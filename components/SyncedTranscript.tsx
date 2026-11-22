'use client'

import { useEffect, useRef } from 'react'
import { useAudio } from '@/lib/context/AudioContext'
import { SyncSegment, activeSegmentIndex, formatClock } from '@/lib/transcriptSync'

interface Props {
  entryId: string
  audioFile: string
  title: string
  duration?: number | null
  narrator?: string | null
  transcription?: string | null
  segments: SyncSegment[]
}

// Transcript lines that highlight in time with the archive's audio player; click a line to play from there.
export default function SyncedTranscript({ entryId, audioFile, title, duration, narrator, transcription, segments }: Props) {
  const { currentTrack, currentTime, isPlaying, playTrack, seekTime, togglePlay } = useAudio()
  const isCurrent = currentTrack?.entryId === entryId
  const active = isCurrent ? activeSegmentIndex(segments, currentTime) : -1
  const boxRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Keep the active line visible inside the transcript box (without scrolling the page)
  useEffect(() => {
    const box = boxRef.current
    const el = lineRefs.current[active]
    if (!box || !el) return
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: 'smooth' })
    }
  }, [active])

  const playFrom = (start: number) => {
    if (isCurrent) {
      seekTime(start)
      if (!isPlaying) togglePlay()
    } else {
      playTrack({ audioFile, title, narrator, duration, textToRecite: transcription, entryId, startAt: start })
    }
  }

  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
        ♪ Synchronized with the recording — click a line to play from there.
      </div>
      <div ref={boxRef} style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
        {segments.map((seg, i) => {
          const isActive = i === active
          return (
            <button
              key={i}
              ref={el => { lineRefs.current[i] = el }}
              type="button"
              onClick={() => playFrom(seg.start)}
              aria-current={isActive ? 'true' : undefined}
              style={{
                display: 'flex',
                gap: '10px',
                width: '100%',
                textAlign: 'left',
                padding: '6px 8px',
                margin: '0 0 2px',
                border: 'none',
                borderLeft: `3px solid ${isActive ? 'var(--brand-accent, #8F000D)' : 'transparent'}`,
                background: isActive ? 'rgba(143, 0, 13, 0.08)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
                lineHeight: 1.6,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '44px', paddingTop: '3px', fontVariantNumeric: 'tabular-nums' }}>
                {formatClock(seg.start)}
              </span>
              <span>{seg.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
