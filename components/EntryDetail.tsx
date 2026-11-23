'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import AudioPlayer from './AudioPlayer'
import SyncedTranscript from './SyncedTranscript'
import ExplainClassification from './ExplainClassification'
import { parseSegments } from '@/lib/transcriptSync'
import { aggregateLocations, type LocationStat } from '@/lib/geo'

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
  predictionSource?: string | null
  modelVersion?: string | null
  probabilities?: Record<string, number> | null
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
  bisayaTranslation?: string | null
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
  reviewStatus?: string | null
  verifiedGenre?: string | null
  transcriptSync?: string | null
}

const SOURCE_LABELS: Record<string, string> = {
  RULES_PLUS_COLAB_MODEL: 'the rule-based engine (Eugenio 1993 / Andress 1985) combined with the machine-learning model trained in Google Colab',
  RULES_PLUS_LEARNED_ENSEMBLE: 'the rule-based engine (Eugenio 1993 / Andress 1985) combined with the in-app learned models',
  COLAB_TRAINED_MODEL: 'the machine-learning model trained in Google Colab on human-verified entries',
  TS_LEARNED_ENSEMBLE: 'the in-app learned ensemble (Naive Bayes, TF-IDF, character n-grams, k-NN)',
  TYPESCRIPT_HYBRID_ENGINE: 'the in-app learned ensemble (Naive Bayes, TF-IDF, character n-grams, k-NN)',
  TS_HYBRID_ENSEMBLE: 'the in-app learned ensemble (Naive Bayes, TF-IDF, character n-grams)',
  NEURAL_SEMANTIC_MODEL: 'the Gemini large language model',
}

const pretty = (g: string) => g.charAt(0) + g.slice(1).toLowerCase()

// Explains the actual stored classification (no fixed per-genre text).
const getAnalysisText = (entry: Entry, latest?: Classification) => {
  if (!latest) return 'This entry has not been classified yet.'
  const source = SOURCE_LABELS[latest.predictionSource || ''] || 'the classification model'
  const pct = Math.round((latest.confidenceScore || 0) * 100)
  const alternatives = Object.entries(latest.probabilities || {})
    .filter(([g]) => g !== latest.classifiedGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([g, p]) => `${pretty(g)} ${Math.round(p * 100)}%`)
  let text =
    latest.classifiedGenre === 'UNCLASSIFIED'
      ? `${source.charAt(0).toUpperCase() + source.slice(1)} was not confident enough to assign a genre, so the entry was sent for human review.`
      : `Predicted as ${pretty(latest.classifiedGenre)} by ${source}${latest.modelVersion ? ` (version ${latest.modelVersion})` : ''} with ${pct}% probability.`
  if (alternatives.length) text += ` Next most likely: ${alternatives.join(', ')}.`
  if (entry.reviewStatus === 'VERIFIED') {
    text += ` Genre confirmed by a human reviewer as ${pretty(entry.verifiedGenre || entry.genre)}.`
  }
  return text
}

export default function EntryDetail({ entry, locationStats }: { entry: Entry; locationStats?: LocationStat[] }) {
  const latestClassification = entry.classifications?.[0]
  // The stored model probability, shown as-is (never replaced by another number).
  const confidence = latestClassification ? Math.round((latestClassification.confidenceScore || 0) * 100) : 0
  const syncSegments = parseSegments(entry.transcriptSync)
  // Credit the recorded performer; 'AI Generated' only when no vocalist/narrator is on record (see Terms)
  const narratorLabel = entry.type === 'FOLK_SONG'
    ? (entry.singer || 'AI Generated')
    : (entry.narrator || entry.singer || 'AI Generated')

  return (
    <div className="anim-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px 80px', fontFamily: 'Inter, sans-serif' }}>

      {/* Title Header Block */}
      <div style={{ marginBottom: '24px' }}>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            color: 'var(--brand-accent)',
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
            fontSize: 'clamp(26px, 5vw, 40px)',
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
            narrator={narratorLabel}
            entryId={entry.id}
          />
        </div>
      )}

      {/* Main Grid Content Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Columns (Transcription & Translation & Metadata) */}
        <div className="lg:col-span-2">

          {/* Manobo Transcription */}
          <div>
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: '10px',
                fontWeight: 800,
                color: 'var(--brand-accent)',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '8px'
              }}
            >
              TRANSCRIPTION (MANOBO)
            </h3>
            {entry.audioFile && syncSegments.length > 0 ? (
              <SyncedTranscript
                entryId={entry.id}
                audioFile={entry.audioFile}
                title={entry.title}
                duration={entry.audioDuration}
                narrator={narratorLabel}
                transcription={entry.transcription}
                segments={syncSegments}
              />
            ) : (
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
            )}
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
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{entry.barangay || 'Not documented'}</div>
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
                color: 'var(--brand-accent)',
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" style={{ cursor: 'pointer' }}>
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
                      color: 'var(--brand-accent)',
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

            {/* Singer / Cultural Bearer (Only shown for folk songs or when a singer is recorded) */}
            {(entry.type === 'FOLK_SONG' || entry.singer) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--brand-accent)', marginBottom: '4px', letterSpacing: '0.05em' }}>🎤 SINGER / CULTURAL BEARER</div>
                <div style={{ fontSize: '13px', color: 'var(--brand-accent)', fontWeight: 700 }}>
                  {entry.singer || 'Manobo Folk Singer (Elder)'}
                </div>
              </div>
            )}

            {/* Narrator */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>NARRATOR / INFORMANT</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {entry.narrator || 'Manobo Elder (Informant - Anonymous)'}
              </div>
            </div>

            {/* Academic Source / Reference */}
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>SOURCE / REFERENCE</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {entry.source || 'Catipay & Curato (2024)'}
              </div>
            </div>

          </div>

          {/* Card 2: Classification Analysis (learned model) */}
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
                color: 'var(--brand-accent)',
                letterSpacing: '0.05em'
              }}
            >
              CLASSIFICATION ANALYSIS
            </h4>

            <p style={{ margin: '0 0 20px 0', fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {getAnalysisText(entry, latestClassification)}
            </p>

            {/* Confidence Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.05em' }}>
                <span style={{ color: 'var(--brand-accent)' }}>CONFIDENCE LEVEL</span>
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

            <ExplainClassification
              entryId={entry.id}
              title={entry.title}
              transcription={entry.transcription}
              translation={entry.translation}
              bisayaTranslation={entry.bisayaTranslation}
              communityLocation={entry.communityLocation}
              municipality={entry.municipality}
              barangay={entry.barangay}
            />
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
            <RegionalMap locationStats={locationStats ?? aggregateLocations([entry])} />

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
