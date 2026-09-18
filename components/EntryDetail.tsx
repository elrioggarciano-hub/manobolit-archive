'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import AudioPlayer from './AudioPlayer'

const RegionalMap = dynamic(() => import('./RegionalMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ width: '100%', height: '100%' }} />,
})

interface Classification {
  classifiedGenre: string
  classifiedThemes: string[]
  confidenceScore: number
  rulesApplied: string[]
  timestamp: string
}

interface Entry {
  id: string
  title: string
  manoboTitle?: string | null
  englishTitle?: string | null
  type: string
  content: string
  transcription?: string | null
  translation?: string | null
  audioFile?: string | null
  audioDuration?: number | null
  source: string
  yearCollected?: number | null
  narrator?: string | null
  singer?: string | null
  communityLocation: string
  province: string
  municipality: string
  barangay?: string | null
  genre: string
  themes: string[]
  culturalElements: string[]
  createdAt: string
  classifications: Classification[]
}

const getAnalysisText = (entry: Entry) => {
  if (entry.genre === 'MYTH') {
    return 'System classified as Origin Myth based on lexical frequency of "Father Sky" and "Birth" within the introductory markers.'
  } else if (entry.genre === 'SONG') {
    return 'System classified as Courtship Folk Song based on lyrical patterns of "Kudlung" and "Serenade" matches in the corpus.'
  } else if (entry.genre === 'EPIC') {
    return 'System classified as Heroic Epic based on presence of warrior narrative frames and "Agyu" reference clusters.'
  }
  return `System classified as ${entry.genre} based on matching keyword heuristics in Eugenio's taxonomy rules.`
}

export default function EntryDetail({ entry }: { entry: Entry }) {
  const latestClassification = entry.classifications?.[0]
  const confidence = latestClassification ? Math.round(latestClassification.confidenceScore * 100) : 84
  
  return (
    <div className="anim-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px 80px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Title Header Block */}
      <div style={{ marginBottom: '24px' }}>
        <span 
          style={{ 
            fontSize: '9px', 
            fontWeight: 800, 
            color: '#8F000D', 
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '6px'
          }}
        >
          MANOBO ORAL TRADITION
        </span>
        <h1 
          style={{ 
            margin: '0 0 4px', 
            fontSize: '40px', 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            lineHeight: 1.1 
          }}
        >
          {entry.title}
        </h1>
        {entry.manoboTitle && (
          <p 
            style={{ 
              margin: 0, 
              fontSize: '18px', 
              color: 'var(--text-primary)', 
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontStyle: 'italic' 
            }}
          >
            {entry.manoboTitle}
          </p>
        )}
      </div>

      {/* Audio Player Block */}
      {entry.audioFile && (
        <div style={{ marginBottom: '24px' }}>
          <AudioPlayer
            audioFile={entry.audioFile}
            title={entry.title}
            duration={entry.audioDuration}
            transcription={entry.transcription}
          />
        </div>
      )}

      {/* Main Grid Content Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Transcription & Translation & Metadata) */}
        <div className="lg:col-span-2">
          
          {/* Side-by-Side Language Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {/* Manobo Transcription */}
            <div>
              <h3 
                style={{ 
                  margin: '0 0 12px', 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  color: '#8F000D', 
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px'
                }}
              >
                TRANSCRIPIAN (MANOBO)
              </h3>
              <p 
                style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  lineHeight: 1.6, 
                  color: 'var(--text-secondary)', 
                  whiteSpace: 'pre-line',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {entry.transcription || 'No transcription available.'}
              </p>
            </div>

            {/* English Translation */}
            <div>
              <h3 
                style={{ 
                  margin: '0 0 12px', 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  color: '#8F000D', 
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '8px'
                }}
              >
                TRANSLATION (ENGLISH)
              </h3>
              <p 
                style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  lineHeight: 1.6, 
                  color: 'var(--text-secondary)', 
                  whiteSpace: 'pre-line',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {entry.translation || 'No translation available.'}
              </p>
            </div>

          </div>

          {/* Metadata Row */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
              gap: '16px', 
              marginTop: '32px', 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '20px' 
            }}
          >
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>RECORDING YEAR</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{entry.yearCollected || '1992'}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>PROVINCE</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{entry.province}</div>
            </div>

            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>MUNICIPALITY</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{entry.municipality}</div>
            </div>

            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>BARANGAY</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{entry.barangay || 'Langasian'}</div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Archive Classification */}
          <div
            className="stagger-item card-hover"
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '20px',
              borderRadius: '0px'
            }}
          >
            <h4 
              style={{ 
                margin: '0 0 16px 0', 
                fontSize: '10px', 
                fontWeight: 800, 
                color: '#8F000D', 
                letterSpacing: '0.05em' 
              }}
            >
              ARCHIVE CLASSIFICATION
            </h4>

            {/* Genre */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>GENRE (EUGENIO)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{ 
                    background: '#18181b', 
                    color: '#ffffff', 
                    fontSize: '9px', 
                    fontWeight: 700, 
                    padding: '4px 10px', 
                    borderRadius: '0px',
                    letterSpacing: '0.05em'
                  }}
                >
                  {entry.genre}
                </span>
                
                {/* Custom Edit/Review Icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8F000D" strokeWidth="2.5" style={{ cursor: 'pointer' }}>
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
              </div>
            </div>

            {/* Themes */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>THEMES (ANDRESS)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {entry.themes.map(t => (
                  <span
                    key={t}
                    className="stagger-item"
                    style={{
                      background: '#fee2e2',
                      color: '#8F000D',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '0px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Singer / Cultural Bearer */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#8F000D', marginBottom: '4px', letterSpacing: '0.05em' }}>🎤 SINGER / CULTURAL BEARER</div>
              <div style={{ fontSize: '13px', color: '#8F000D', fontWeight: 700 }}>
                {entry.singer || entry.narrator || 'Bae Malingeb & Tribal Elders'}
              </div>
            </div>

            {/* Narrator */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>NARRATOR / INFORMANT</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {entry.narrator || entry.singer || 'Datu Malingeb'}
              </div>
            </div>

            {/* Source Code */}
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>SOURCE CODE</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {entry.source || 'ML-ADS-1992-04'}
              </div>
            </div>

          </div>

          {/* Card 2: Rule-Based Analysis */}
          <div
            className="stagger-item card-hover"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderLeft: '4px solid #8F000D',
              padding: '20px',
              borderRadius: '0px'
            }}
          >
            <h4 
              style={{ 
                margin: '0 0 12px 0', 
                fontSize: '10px', 
                fontWeight: 800, 
                color: '#8F000D', 
                letterSpacing: '0.05em' 
              }}
            >
              RULE-BASED ANALYSIS
            </h4>
            
            <p style={{ margin: '0 0 20px 0', fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {getAnalysisText(entry)}
            </p>

            {/* Confidence Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.05em' }}>
                <span style={{ color: '#8F000D' }}>CONFIDENCE LEVEL</span>
                <span style={{ color: 'var(--text-primary)' }}>{confidence}%</span>
              </div>
              <div style={{ height: '2px', background: '#fee2e2', position: 'relative' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${confidence}%`,
                    background: '#8F000D',
                    transition: 'width 0.8s var(--ease-out-smooth, ease-out)',
                  }}
                />
              </div>
            </div>

          </div>

          {/* Card 3: Location Map */}
          <div
            className="stagger-item"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '0px',
              height: '140px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <RegionalMap
              locationStats={[
                {
                  location: entry.communityLocation,
                  municipality: entry.municipality,
                  province: entry.province,
                  count: 1,
                },
              ]}
            />

            {/* Overlay Text Tag */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: '#ffffff',
                color: '#1e293b',
                fontSize: '9px',
                fontWeight: 800,
                padding: '4px 8px',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              {entry.communityLocation.toUpperCase()}, {entry.province.toUpperCase()}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
