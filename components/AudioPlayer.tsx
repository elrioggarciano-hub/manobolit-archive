'use client'

import { useAudio } from '@/lib/context/AudioContext'

interface Props {
  audioFile?: string | null
  title?: string
  duration?: number | null
  transcription?: string | null
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ audioFile, title = 'Audio Recording', duration, transcription }: Props) {
  const { playTrack, currentTrack, isPlaying, togglePlay, currentTime, duration: globalDuration, progress, seek } = useAudio()

  const isCurrent = currentTrack?.audioFile === audioFile
  const isThisPlaying = isCurrent && isPlaying
  const displayDuration = duration || globalDuration || 25

  const handleToggle = () => {
    if (!audioFile) return
    if (isCurrent) {
      togglePlay()
    } else {
      playTrack({
        audioFile,
        title,
        narrator: 'Agusan Manobo Oral Recording',
        duration: displayDuration,
        textToRecite: transcription,
      })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    if (isCurrent) {
      seek(ratio)
    } else {
      handleToggle()
    }
  }

  // Generate 48 bars for the waveform matching the visual style in the mockup
  const bars = Array.from({ length: 48 }, (_, i) => {
    const heights = [30, 45, 60, 40, 75, 50, 35, 70, 45, 80, 55, 30, 20, 45, 85, 60, 30, 45, 70, 50, 35, 75, 45, 65]
    return heights[i % heights.length]
  })

  // Calculate unique 3-digit Archive ID based on title
  const archiveId = title 
    ? (title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900) + 100 
    : 772

  if (!audioFile) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '0px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif'
      }}>
        <span style={{ marginRight: '4px' }}>🎵</span> No oral recording available for this literature entry.
      </div>
    )
  }

  return (
    <div 
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '0px',
        padding: '20px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* Yellow Play/Pause Button */}
        <button
          onClick={handleToggle}
          className="btn-anim"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            background: '#f1b80d',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s, box-shadow 0.25s',
            boxShadow: isThisPlaying ? '0 0 0 4px rgba(241, 184, 13, 0.18)' : 'none',
          }}
          aria-label={isThisPlaying ? "Pause" : "Play"}
        >
          {isThisPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginLeft: '2px' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Right Section: Time metadata & Waveform */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {/* Metadata Row */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '10px', 
              fontWeight: 800, 
              color: 'var(--text-muted)', 
              letterSpacing: '0.05em' 
            }}
          >
            <span>{formatTime(isCurrent ? currentTime : 0)} / {formatTime(displayDuration)}</span>
            <span style={{ color: 'var(--text-secondary)' }}>AUDIO ARCHIVE #{archiveId}</span>
          </div>

          {/* Waveform Slider */}
          <div
            onClick={handleSeek}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              height: '36px',
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            {bars.map((h, i) => {
              const barProgress = (i / bars.length) * 100
              const active = barProgress <= progress
              return (
                <div 
                  key={i} 
                  style={{
                    flex: 1, 
                    height: `${h}%`, 
                    borderRadius: '1px',
                    background: active ? '#f1b80d' : '#fee2e2',
                    transition: 'background 0.1s',
                    minWidth: '2px',
                  }} 
                />
              )
            })}
          </div>

        </div>

      </div>
    </div>
  )
}
