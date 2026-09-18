'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAudio } from '@/lib/context/AudioContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PersistentAudioPlayer() {
  const pathname = usePathname()
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    togglePlay,
    seek,
  } = useAudio()

  const [showTranscript, setShowTranscript] = useState(false)
  const isMobile = useIsMobile(640)

  // Auth screens have no relevance to folk-song playback, and the fixed
  // bottom bar collides with the vertically centered login card.
  if (pathname === '/admin/login') {
    return null
  }

  if (!currentTrack) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          minHeight: '75px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 500,
          zIndex: 1000,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
          padding: '12px 16px',
          textAlign: 'center',
        }}
      >
        <span style={{ marginRight: '8px' }}>🎵</span> Select a folk song or oral literature piece to listen to the singer.
      </div>
    )
  }

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    seek(ratio)
  }

  const singerName = currentTrack.singer || currentTrack.narrator || 'Agusan Manobo Vocalist'

  return (
    <>
      {/* Transcript / Lyrics Modal Overlay */}
      {showTranscript && (
        <div
          className="modal-content"
          style={{
            position: 'fixed',
            bottom: isMobile ? '75px' : '75px',
            right: isMobile ? '12px' : '24px',
            left: isMobile ? '12px' : 'auto',
            width: isMobile ? 'auto' : '380px',
            maxHeight: '320px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #8F000D',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
            zIndex: 999,
            padding: '16px',
            overflowY: 'auto',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#8F000D', letterSpacing: '0.1em' }}>SUNG LYRICS & TRANSCRIPT</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 700, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{currentTrack.title}</h4>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Singer: {singerName}</p>
            </div>
            <button
              onClick={() => setShowTranscript(false)}
              className="btn-anim"
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-line', margin: 0, background: '#FAF9F6', padding: '12px', borderLeft: '3px solid #8F000D' }}>
            {currentTrack.textToRecite || 'Lantawod diya lawod nig duma kan bayod soe tribu ko no daog-daog mahawig no katuigan...'}
          </p>
        </div>
      )}

      <div
        className="anim-slide-up"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '75px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 24px',
          gap: isMobile ? '10px' : '0',
          zIndex: 1000,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Left Column: Red sound block & track details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: isMobile ? '36px' : '44px',
              height: isMobile ? '36px' : '44px',
              background: '#8F000D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              borderRadius: '0px',
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5v14M22 9v6M7 7v10M2 10v4" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {!isMobile && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#8F000D',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '2px',
                }}
              >
                🎤 SINGER: {singerName}
              </span>
            )}
            <span 
              style={{ 
                fontSize: '15px', 
                fontWeight: 700, 
                color: '#1e293b', 
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
              }}
            >
              {currentTrack.title}
            </span>
          </div>
        </div>

        {/* Middle Column: Controls & Progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 2, maxWidth: '400px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <button
              onClick={togglePlay}
              className="btn-anim"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f1b80d',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(241, 184, 13, 0.2)',
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginLeft: '2px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          <div 
            onClick={handleWaveformClick}
            style={{
              width: '100%',
              height: '4px',
              background: '#e2e8f0',
              cursor: 'pointer',
              position: 'relative',
              borderRadius: '0px',
            }}
          >
            <div 
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#8F000D',
                borderRadius: '0px',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>

        {/* Right Column: TRANSCRIPT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: 0, flex: isMobile ? '0 0 auto' : 1, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowTranscript(prev => !prev)}
            className="btn-anim"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: showTranscript ? '#8F000D' : '#71717a',
              transition: 'color 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" strokeWidth="1.5" />
              <line x1="12" y1="17" x2="12" y2="21" strokeWidth="1.5" />
              <line x1="6" y1="8" x2="18" y2="8" strokeWidth="1.5" />
              <line x1="6" y1="12" x2="14" y2="12" strokeWidth="1.5" />
            </svg>
            <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.05em' }}>TRANSCRIPT</span>
          </button>
        </div>
      </div>
    </>
  )
}
